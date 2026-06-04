import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Badge,
  Subtitle1,
  Body1,
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import { SendRegular } from '@fluentui/react-icons';
import dayjs from 'dayjs';
import { notificationApi } from '../../api/client';
import type { NotificationLog } from '../../types';

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
  contentTruncate: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

const NotificationPage: React.FC = () => {
  const styles = useStyles();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testMsg, setTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleTest = async () => {
    setTestMsg(null);
    try {
      await notificationApi.test();
      setTestMsg({ type: 'success', text: '测试通知已发送' });
      fetchNotifications();
    } catch {
      setTestMsg({ type: 'error', text: '测试通知发送失败' });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'success' as const;
      case 'FAILED': return 'danger' as const;
      case 'PENDING': return 'warning' as const;
      default: return 'informative' as const;
    }
  };

  const channelLabel = (channelId: string | null) => {
    switch (channelId) {
      case 'lark': return '飞书';
      case 'wecom': return '企微';
      case 'dingtalk': return '钉钉';
      case 'email': return '邮件';
      case 'webhook': return 'Webhook';
      default: return channelId || '-';
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'NEW_BILL': return '新账单';
      case 'LOGIN_FAIL': return '登录失败';
      case 'SYNC_ERROR': return '同步异常';
      case 'SYSTEM': return '系统';
      default: return type;
    }
  };

  if (loading) return <Body1>加载中...</Body1>;

  return (
    <div>
      <div className={styles.header}>
        <Subtitle1>通知中心</Subtitle1>
        <Button appearance="primary" icon={<SendRegular />} onClick={handleTest}>
          发送测试通知
        </Button>
      </div>

      {testMsg && (
        <MessageBar intent={testMsg.type} style={{ marginBottom: '12px' }}>
          <MessageBarBody>{testMsg.text}</MessageBarBody>
        </MessageBar>
      )}

      {notifications.length === 0 ? (
        <div className={styles.empty}><Text>暂无通知记录</Text></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>渠道</TableHeaderCell>
              <TableHeaderCell>类型</TableHeaderCell>
              <TableHeaderCell>标题</TableHeaderCell>
              <TableHeaderCell>状态</TableHeaderCell>
              <TableHeaderCell>重试</TableHeaderCell>
              <TableHeaderCell>发送时间</TableHeaderCell>
              <TableHeaderCell>创建时间</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <TableCellLayout>
                    <Badge appearance="ghost" size="small">{channelLabel(item.channelId)}</Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Badge appearance="ghost" size="small">{typeLabel(item.type)}</Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <div>
                      <Text weight="semibold">{item.title || '-'}</Text>
                      {item.content && (
                        <div className={styles.contentTruncate}>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{item.content}</Text>
                        </div>
                      )}
                    </div>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Badge appearance="filled" color={statusColor(item.status)}>{item.status}</Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{item.retryCount}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    {item.sentAt ? dayjs(item.sentAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default NotificationPage;
