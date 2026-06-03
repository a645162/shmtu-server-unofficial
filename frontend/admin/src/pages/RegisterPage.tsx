import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Label,
  Card,
  Title3,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { authApi } from '../api/client';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    width: '400px',
    padding: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '16px',
  },
});

const RegisterPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ username, password, name });
      navigate('/login');
    } catch {
      setError('注册失败，用户名可能已存在');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title3 style={{ textAlign: 'center', marginBottom: '24px' }}>
          SHMTU Terminal 注册
        </Title3>

        {error && (
          <MessageBar intent="error" style={{ marginBottom: '12px' }}>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.formRow}>
            <Label>用户名</Label>
            <Input
              value={username}
              onChange={(_, data) => setUsername(data.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className={styles.formRow}>
            <Label>显示名</Label>
            <Input
              value={name}
              onChange={(_, data) => setName(data.value)}
              placeholder="请输入显示名"
              required
            />
          </div>
          <div className={styles.formRow}>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(_, data) => setPassword(data.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <div className={styles.formRow}>
            <Label>确认密码</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(_, data) => setConfirmPassword(data.value)}
              placeholder="请再次输入密码"
              required
            />
          </div>
          <Button appearance="primary" type="submit" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>

        <div className={styles.footer}>
          <Text size={200}>
            已有账号？ <Link to="/login">登录</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
