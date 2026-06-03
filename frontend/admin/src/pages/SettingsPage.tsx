import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Button,
  Input,
  Card,
  Switch,
  Label,
  Divider,
  Subtitle1,
  Subtitle2,
  Body1,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { authApi, notificationApi } from '../api/client';
import type { User, NotificationSettings } from '../types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '24px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
  },
  channelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
});

const SettingsPage: React.FC = () => {
  const styles = useStyles();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Lark
  const [larkEnabled, setLarkEnabled] = useState(false);
  const [larkUserId, setLarkUserId] = useState('');
  const [larkWebhookUrl, setLarkWebhookUrl] = useState('');
  const [larkWebhookKey, setLarkWebhookKey] = useState('');

  // WeCom
  const [wecomEnabled, setWecomEnabled] = useState(false);
  const [wecomWebhookUrl, setWecomWebhookUrl] = useState('');
  const [wecomWebhookKey, setWecomWebhookKey] = useState('');

  // DingTalk
  const [dingtalkEnabled, setDingtalkEnabled] = useState(false);
  const [dingtalkWebhookUrl, setDingtalkWebhookUrl] = useState('');
  const [dingtalkWebhookSecret, setDingtalkWebhookSecret] = useState('');

  // Email
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');

  // Custom Webhook
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [customWebhookHeaders, setCustomWebhookHeaders] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, notifData] = await Promise.all([
          authApi.me().catch(() => null),
          notificationApi.getSettings().catch(() => null),
        ]);
        setUser(userData);
        setSettings(notifData);
        if (notifData) {
          setLarkEnabled(notifData.larkEnabled);
          setLarkUserId(notifData.larkUserId || '');
          setLarkWebhookUrl(notifData.larkWebhookUrl || '');
          setLarkWebhookKey(notifData.larkWebhookKey || '');
          setWecomEnabled(notifData.wecomEnabled);
          setWecomWebhookUrl(notifData.wecomWebhookUrl || '');
          setWecomWebhookKey(notifData.wecomWebhookKey || '');
          setDingtalkEnabled(notifData.dingtalkEnabled);
          setDingtalkWebhookUrl(notifData.dingtalkWebhookUrl || '');
          setDingtalkWebhookSecret(notifData.dingtalkWebhookSecret || '');
          setEmailEnabled(notifData.emailEnabled);
          setNotificationEmail(notifData.notificationEmail || '');
          setWebhookEnabled(notifData.webhookEnabled);
          setCustomWebhookUrl(notifData.customWebhookUrl || '');
          setCustomWebhookHeaders(notifData.customWebhookHeaders || '');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePasswordChange = async () => {
    setMsg(null);
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: '两次密码输入不一致' });
      return;
    }
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setMsg({ type: 'success', text: '密码修改成功' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMsg({ type: 'error', text: '密码修改失败' });
    }
  };

  const handleToggleNotification = async (enabled: boolean) => {
    try {
      await notificationApi.updateSettings({ notificationEnabled: enabled });
      setSettings((prev) => prev ? { ...prev, notificationEnabled: enabled } : prev);
    } catch {
      // ignore
    }
  };

  const handleToggleChannel = async (channel: string, enabled: boolean) => {
    try {
      await notificationApi.updateSettings({ [channel]: enabled });
      setSettings((prev) => prev ? { ...prev, [channel]: enabled } : prev);
    } catch {
      // ignore
    }
  };

  const handleSaveNotifSettings = async () => {
    setMsg(null);
    try {
      await notificationApi.updateSettings({
        larkEnabled,
        larkUserId: larkUserId || null,
        larkWebhookUrl: larkWebhookUrl || null,
        larkWebhookKey: larkWebhookKey || null,
        wecomEnabled,
        wecomWebhookUrl: wecomWebhookUrl || null,
        wecomWebhookKey: wecomWebhookKey || null,
        dingtalkEnabled,
        dingtalkWebhookUrl: dingtalkWebhookUrl || null,
        dingtalkWebhookSecret: dingtalkWebhookSecret || null,
        emailEnabled,
        notificationEmail: notificationEmail || null,
        webhookEnabled,
        customWebhookUrl: customWebhookUrl || null,
        customWebhookHeaders: customWebhookHeaders || null,
      });
      setMsg({ type: 'success', text: '通知配置已保存' });
    } catch {
      setMsg({ type: 'error', text: '保存失败' });
    }
  };

  if (loading) return <Body1>加载中...</Body1>;

  return (
    <div>
      <Subtitle1 style={{ marginBottom: '16px' }}>个人设置</Subtitle1>

      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.grid}>
        {/* Personal Info */}
        <Card className={styles.card}>
          <Subtitle2 style={{ marginBottom: '16px' }}>个人信息</Subtitle2>
          <div className={styles.formRow}>
            <Label>用户名</Label>
            <Input value={user?.username || ''} readOnly />
          </div>
          <div className={styles.formRow}>
            <Label>姓名</Label>
            <Input value={user?.name || ''} readOnly />
          </div>
          <div className={styles.formRow}>
            <Label>邮箱</Label>
            <Input value={user?.email || ''} readOnly />
          </div>
          <div className={styles.formRow}>
            <Label>手机</Label>
            <Input value={user?.phone || ''} readOnly />
          </div>
          <div className={styles.formRow}>
            <Label>注册时间</Label>
            <Input value={user?.createdAt || ''} readOnly />
          </div>
        </Card>

        {/* Password Change */}
        <Card className={styles.card}>
          <Subtitle2 style={{ marginBottom: '16px' }}>修改密码</Subtitle2>
          <div className={styles.formRow}>
            <Label>旧密码</Label>
            <Input type="password" value={oldPassword} onChange={(_, data) => setOldPassword(data.value)} />
          </div>
          <div className={styles.formRow}>
            <Label>新密码</Label>
            <Input type="password" value={newPassword} onChange={(_, data) => setNewPassword(data.value)} />
          </div>
          <div className={styles.formRow}>
            <Label>确认新密码</Label>
            <Input type="password" value={confirmPassword} onChange={(_, data) => setConfirmPassword(data.value)} />
          </div>
          <div className={styles.actions}>
            <Button appearance="primary" onClick={handlePasswordChange}>修改密码</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <Subtitle2 style={{ marginBottom: '16px' }}>通知设置</Subtitle2>
          <div className={styles.formRow}>
            <Label>启用通知</Label>
            <Switch
              checked={settings?.notificationEnabled ?? true}
              onChange={(_, data) => handleToggleNotification(data.checked)}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Lark */}
          <div className={styles.channelHeader}>
            <Subtitle2>飞书</Subtitle2>
            <Switch
              checked={larkEnabled}
              onChange={(_, data) => {
                setLarkEnabled(data.checked);
                handleToggleChannel('larkEnabled', data.checked);
              }}
              label="启用飞书推送"
            />
          </div>
          <div className={styles.formRow}>
            <Label>Lark User ID</Label>
            <Input
              placeholder="ou_xxxxx"
              value={larkUserId}
              disabled={!larkEnabled}
              onChange={(_, data) => setLarkUserId(data.value)}
            />
          </div>
          <div className={styles.formRow}>
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
              value={larkWebhookUrl}
              disabled={!larkEnabled}
              onChange={(_, data) => setLarkWebhookUrl(data.value)}
            />
          </div>
          <div className={styles.formRow}>
            <Label>Webhook 签名密钥</Label>
            <Input
              placeholder="签名密钥"
              value={larkWebhookKey}
              disabled={!larkEnabled}
              onChange={(_, data) => setLarkWebhookKey(data.value)}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* WeCom */}
          <div className={styles.channelHeader}>
            <Subtitle2>企业微信</Subtitle2>
            <Switch
              checked={wecomEnabled}
              onChange={(_, data) => {
                setWecomEnabled(data.checked);
                handleToggleChannel('wecomEnabled', data.checked);
              }}
              label="启用企业微信推送"
            />
          </div>
          <div className={styles.formRow}>
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              value={wecomWebhookUrl}
              disabled={!wecomEnabled}
              onChange={(_, data) => setWecomWebhookUrl(data.value)}
            />
          </div>
          <div className={styles.formRow}>
            <Label>Webhook Key</Label>
            <Input
              placeholder="Webhook Key"
              value={wecomWebhookKey}
              disabled={!wecomEnabled}
              onChange={(_, data) => setWecomWebhookKey(data.value)}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* DingTalk */}
          <div className={styles.channelHeader}>
            <Subtitle2>钉钉</Subtitle2>
            <Switch
              checked={dingtalkEnabled}
              onChange={(_, data) => {
                setDingtalkEnabled(data.checked);
                handleToggleChannel('dingtalkEnabled', data.checked);
              }}
              label="启用钉钉推送"
            />
          </div>
          <div className={styles.formRow}>
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
              value={dingtalkWebhookUrl}
              disabled={!dingtalkEnabled}
              onChange={(_, data) => setDingtalkWebhookUrl(data.value)}
            />
          </div>
          <div className={styles.formRow}>
            <Label>Secret</Label>
            <Input
              placeholder="签名密钥"
              value={dingtalkWebhookSecret}
              disabled={!dingtalkEnabled}
              onChange={(_, data) => setDingtalkWebhookSecret(data.value)}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Email */}
          <div className={styles.channelHeader}>
            <Subtitle2>邮件</Subtitle2>
            <Switch
              checked={emailEnabled}
              onChange={(_, data) => {
                setEmailEnabled(data.checked);
                handleToggleChannel('emailEnabled', data.checked);
              }}
              label="启用邮件推送"
            />
          </div>
          <div className={styles.formRow}>
            <Label>通知邮箱</Label>
            <Input
              placeholder="user@example.com"
              value={notificationEmail}
              disabled={!emailEnabled}
              onChange={(_, data) => setNotificationEmail(data.value)}
            />
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Custom Webhook */}
          <div className={styles.channelHeader}>
            <Subtitle2>自定义 Webhook</Subtitle2>
            <Switch
              checked={webhookEnabled}
              onChange={(_, data) => {
                setWebhookEnabled(data.checked);
                handleToggleChannel('webhookEnabled', data.checked);
              }}
              label="启用自定义 Webhook"
            />
          </div>
          <div className={styles.formRow}>
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://example.com/webhook"
              value={customWebhookUrl}
              disabled={!webhookEnabled}
              onChange={(_, data) => setCustomWebhookUrl(data.value)}
            />
          </div>
          <div className={styles.formRow}>
            <Label>自定义 Headers (JSON)</Label>
            <Input
              placeholder='{"Authorization": "Bearer ..."}'
              value={customWebhookHeaders}
              disabled={!webhookEnabled}
              onChange={(_, data) => setCustomWebhookHeaders(data.value)}
            />
          </div>

          <div className={styles.actions}>
            <Button appearance="primary" onClick={handleSaveNotifSettings}>保存通知配置</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
