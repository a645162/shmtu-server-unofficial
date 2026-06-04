import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  Subtitle1,
  Body1,
  Badge,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import dayjs from 'dayjs';
import { dashboardApi, accountApi } from '../../api/client';
import type { DashboardStats, BillOriginal, Account } from '../../types';

const useStyles = makeStyles({
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: { padding: '20px' },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  statLabel: { color: tokens.colorNeutralForeground3, marginTop: '4px' },
  section: { marginBottom: '24px' },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
});

const DashboardPage: React.FC = () => {
  const styles = useStyles();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBills, setRecentBills] = useState<BillOriginal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, billsData, accountsData] = await Promise.all([
          dashboardApi.stats().catch(() => null),
          dashboardApi.recentBills().catch(() => []),
          accountApi.list().catch(() => []),
        ]);
        setStats(statsData);
        setRecentBills(Array.isArray(billsData) ? billsData : []);
        setAccounts(accountsData as Account[]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Body1>加载中...</Body1>;

  return (
    <div>
      <Subtitle1 style={{ marginBottom: '16px' }}>仪表盘</Subtitle1>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.accountCount ?? 0}</div>
          <div className={styles.statLabel}>账号数</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.newBillCount ?? 0}</div>
          <div className={styles.statLabel}>新账单数</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.monthAmount?.toFixed(2) ?? '0.00'}</div>
          <div className={styles.statLabel}>本月消费</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.userCount ?? 0}</div>
          <div className={styles.statLabel}>用户数</div>
        </Card>
      </div>

      <div className={styles.section}>
        <Subtitle1 style={{ marginBottom: '12px' }}>账号状态概览</Subtitle1>
        {accounts.length === 0 ? (
          <div className={styles.empty}><Text>暂无账号</Text></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>学号</TableHeaderCell>
                <TableHeaderCell>显示名</TableHeaderCell>
                <TableHeaderCell>状态</TableHeaderCell>
                <TableHeaderCell>最后同步时间</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell><TableCellLayout>{account.accountId}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{account.accountName}</TableCellLayout></TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <Badge appearance="filled" color={account.enable ? 'success' : 'danger'}>
                        {account.enable ? '启用' : '禁用'}
                      </Badge>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      {account.lastBillSyncTime
                        ? dayjs(account.lastBillSyncTime).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className={styles.section}>
        <Subtitle1 style={{ marginBottom: '12px' }}>最近账单</Subtitle1>
        {recentBills.length === 0 ? (
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
                <TableHeaderCell>状态</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell><TableCellLayout>{bill.transactionNo}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.billDate || '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.billType || '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.money?.toFixed(2) ?? '-'}</TableCellLayout></TableCell>
                  <TableCell><TableCellLayout>{bill.category || '-'}</TableCellLayout></TableCell>
                  <TableCell>
                    <TableCellLayout>
                      {bill.isNew && (
                        <Badge appearance="filled" color="warning" size="small">新</Badge>
                      )}
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
