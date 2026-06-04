import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Card,
  Badge,
  Switch,
  Subtitle1,
  Subtitle2,
  Body1,
  Label,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';
import { Chart, ChartDataFormat, ChartType } from '@fluentui/react-charting';
import { accountApi, billApi } from '../../api/client';
import type { Account, SessionInfo, BillOriginal } from '../../types';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: { padding: '20px' },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  actions: { display: 'flex', gap: '8px', marginTop: '12px' },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
  chartHost: { height: '300px', width: '100%' },
});

const AccountDetailPage: React.FC = () => {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bills, setBills] = useState<BillOriginal[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const accountId = Number(id);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountData, sessionData, billsData] = await Promise.all([
        accountApi.get(accountId).catch(() => null),
        accountApi.getSession(accountId).catch(() => null),
        billApi.list({ accountId, size: 50 }).catch(() => null),
      ]);
      setAccount(accountData);
      setSession(sessionData);
      setBills(
        billsData
          ? (billsData as { content: BillOriginal[] }).content || (billsData as unknown as BillOriginal[])
          : []
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) fetchData();
  }, [accountId]);

  const handleLogin = async () => {
    setMsg(null);
    try {
      await accountApi.login(accountId);
      setMsg({ type: 'success', text: '登录成功' });
      fetchData();
    } catch {
      setMsg({ type: 'error', text: '登录失败' });
    }
  };

  const handleSync = async () => {
    setMsg(null);
    try {
      await accountApi.sync(accountId);
      setMsg({ type: 'success', text: '同步成功' });
      fetchData();
    } catch {
      setMsg({ type: 'error', text: '同步失败' });
    }
  };

  if (loading) return <Body1>加载中...</Body1>;
  if (!account) return <Body1>账号不存在</Body1>;

  const chartData: ChartDataFormat[] = [
    {
      chartTitle: '账单',
      data: bills
        .filter((b) => b.billDate && b.money != null)
        .sort((a, b) => (a.billDate || '').localeCompare(b.billDate || ''))
        .map((b) => ({
          x: (b.billDate || '').substring(5),
          y: b.money ?? 0,
          legend: '金额',
        })),
      color: tokens.colorBrandForeground1,
    } as ChartDataFormat,
  ];

  return (
    <div>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeftRegular />}
          onClick={() => navigate('/admin/accounts')}
        >
          返回
        </Button>
        <Subtitle1>{account.accountName} ({account.accountId})</Subtitle1>
        <Badge appearance="filled" color={account.enable ? 'success' : 'danger'}>
          {account.enable ? '启用' : '禁用'}
        </Badge>
      </div>

      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.grid}>
        <Card className={styles.card}>
          <Subtitle2 style={{ marginBottom: '12px' }}>账号信息</Subtitle2>
          <div className={styles.infoRow}>
            <Label>学号</Label><Text>{account.accountId}</Text>
          </div>
          <div className={styles.infoRow}>
            <Label>显示名</Label><Text>{account.accountName}</Text>
          </div>
          <div className={styles.infoRow}>
            <Label>启用</Label>
            <Switch
              checked={account.enable}
              onChange={(_, data) =>
                accountApi.update(account.id, { enable: data.checked }).then(fetchData)
              }
            />
          </div>
          <div className={styles.infoRow}>
            <Label>启用更新</Label>
            <Switch
              checked={account.enableUpdate}
              onChange={(_, data) =>
                accountApi.update(account.id, { enableUpdate: data.checked }).then(fetchData)
              }
            />
          </div>
          <div className={styles.infoRow}>
            <Label>入学日期</Label><Text>{account.admissionDate || '-'}</Text>
          </div>
          <div className={styles.infoRow}>
            <Label>毕业日期</Label><Text>{account.graduationDate || '-'}</Text>
          </div>
          <div className={styles.infoRow}>
            <Label>过期日期</Label><Text>{account.expireDate || '-'}</Text>
          </div>
          <div className={styles.actions}>
            <Button appearance="primary" onClick={handleLogin}>手动登录</Button>
            <Button appearance="secondary" onClick={handleSync}>手动同步</Button>
          </div>
        </Card>

        <Card className={styles.card}>
          <Subtitle2 style={{ marginBottom: '12px' }}>会话状态</Subtitle2>
          {session ? (
            <>
              <div className={styles.infoRow}>
                <Label>会话状态</Label>
                <Badge appearance="filled" color={session.isValid ? 'success' : 'danger'}>
                  {session.isValid ? '有效' : '无效'}
                </Badge>
              </div>
              <div className={styles.infoRow}>
                <Label>登录时间</Label>
                <Text>{session.loginTime || '-'}</Text>
              </div>
              <div className={styles.infoRow}>
                <Label>过期时间</Label>
                <Text>{session.expireTime || '-'}</Text>
              </div>
            </>
          ) : (
            <Text style={{ color: tokens.colorNeutralForeground3 }}>暂无会话信息</Text>
          )}
        </Card>
      </div>

      {chartData[0] && chartData[0].data.length > 0 && (
        <Card className={styles.card} style={{ marginBottom: '24px' }}>
          <Subtitle2 style={{ marginBottom: '12px' }}>账单时间线</Subtitle2>
          <div className={styles.chartHost}>
            <Chart
              chartType={ChartType.LineChart}
              data={chartData}
              hideLegend={false}
              height={300}
              enableReflow
            />
          </div>
        </Card>
      )}

      <Subtitle1 style={{ marginBottom: '12px' }}>账单列表</Subtitle1>
      {bills.length === 0 ? (
        <div className={styles.empty}><Text>暂无账单记录</Text></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>交易号</TableHeaderCell>
              <TableHeaderCell>日期</TableHeaderCell>
              <TableHeaderCell>类型</TableHeaderCell>
              <TableHeaderCell>金额</TableHeaderCell>
              <TableHeaderCell>分类</TableHeaderCell>
              <TableHeaderCell>位置</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell><TableCellLayout>{bill.transactionNo}</TableCellLayout></TableCell>
                <TableCell><TableCellLayout>{bill.billDate || '-'}</TableCellLayout></TableCell>
                <TableCell><TableCellLayout>{bill.billType || '-'}</TableCellLayout></TableCell>
                <TableCell><TableCellLayout>{bill.money?.toFixed(2) ?? '-'}</TableCellLayout></TableCell>
                <TableCell><TableCellLayout>{bill.category || '-'}</TableCellLayout></TableCell>
                <TableCell><TableCellLayout>{bill.position || '-'}</TableCellLayout></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AccountDetailPage;
