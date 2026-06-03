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

const LoginPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      navigate('/');
    } catch {
      setError('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title3 style={{ textAlign: 'center', marginBottom: '24px' }}>
          SHMTU Terminal 登录
        </Title3>

        {error && (
          <MessageBar intent="error" style={{ marginBottom: '12px' }}>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <form className={styles.form} onSubmit={handleLogin}>
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
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(_, data) => setPassword(data.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <Button appearance="primary" type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className={styles.footer}>
          <Text size={200}>
            还没有账号？ <Link to="/register">注册</Link>
          </Text>
        </div>
        <div className={styles.footer}>
          <a href="http://localhost:3000" style={{ fontSize: '12px', color: tokens.colorBrandForeground1 }}>
            返回首页
          </a>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
