import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Label,
  Switch,
  Subtitle1,
  Body1,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { AddRegular } from '@fluentui/react-icons';
import dayjs from 'dayjs';
import { accountApi } from '../../api/client';
import type { Account } from '../../types';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
  },
});

const AccountListPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccountId, setNewAccountId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountApi.list();
      setAccounts(data as Account[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async () => {
    if (!newAccountId || !newAccountPassword || !newAccountName) return;
    setCreating(true);
    try {
      await accountApi.create({
        accountId: newAccountId,
        password: newAccountPassword,
        accountName: newAccountName,
      });
      setMsg({ type: 'success', text: '账号创建成功' });
      setDialogOpen(false);
      setNewAccountId('');
      setNewAccountName('');
      setNewAccountPassword('');
      fetchAccounts();
    } catch {
      setMsg({ type: 'error', text: '创建失败' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEnable = async (account: Account, enable: boolean) => {
    try {
      await accountApi.update(account.id, { enable });
      fetchAccounts();
    } catch {
      // ignore
    }
  };

  if (loading) return <Body1>加载中...</Body1>;

  return (
    <div>
      <div className={styles.header}>
        <Subtitle1>账号管理</Subtitle1>
        <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" icon={<AddRegular />}>添加账号</Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>添加账号</DialogTitle>
              <DialogContent>
                <div className={styles.formRow}>
                  <Label>学号</Label>
                  <Input
                    value={newAccountId}
                    onChange={(_, d) => setNewAccountId(d.value)}
                    placeholder="请输入学号"
                  />
                </div>
                <div className={styles.formRow}>
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={newAccountPassword}
                    onChange={(_, d) => setNewAccountPassword(d.value)}
                    placeholder="请输入密码"
                  />
                </div>
                <div className={styles.formRow}>
                  <Label>显示名</Label>
                  <Input
                    value={newAccountName}
                    onChange={(_, d) => setNewAccountName(d.value)}
                    placeholder="请输入显示名"
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">取消</Button>
                </DialogTrigger>
                <Button appearance="primary" onClick={handleCreate} disabled={creating}>
                  {creating ? '创建中...' : '创建'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}

      {accounts.length === 0 ? (
        <div className={styles.empty}><Text>暂无账号，点击"添加账号"开始</Text></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>学号</TableHeaderCell>
              <TableHeaderCell>显示名</TableHeaderCell>
              <TableHeaderCell>状态</TableHeaderCell>
              <TableHeaderCell>更新状态</TableHeaderCell>
              <TableHeaderCell>最后登录</TableHeaderCell>
              <TableHeaderCell>最后同步</TableHeaderCell>
              <TableHeaderCell>操作</TableHeaderCell>
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
                    <Switch
                      checked={account.enableUpdate}
                      onChange={(_, data) =>
                        accountApi.update(account.id, { enableUpdate: data.checked }).then(fetchAccounts)
                      }
                    />
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    {account.lastLoginTime
                      ? dayjs(account.lastLoginTime).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    {account.lastBillSyncTime
                      ? dayjs(account.lastBillSyncTime).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Switch
                      checked={account.enable}
                      onChange={(_, data) => handleToggleEnable(account, data.checked)}
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={() => navigate(`/admin/accounts/${account.id}`)}
                      style={{ marginLeft: '8px' }}
                    >
                      详情
                    </Button>
                  </TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AccountListPage;
