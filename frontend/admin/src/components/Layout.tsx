import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  FluentProvider,
  webLightTheme,
  BrandVariants,
  createDarkTheme,
  Button,
  Text,
  Divider,
  Switch,
} from '@fluentui/react-components';
import {
  Board24Regular,
  People24Regular,
  Money24Regular,
  AlertBadge24Regular,
  Settings24Regular,
  Server24Regular,
  Navigation24Regular,
  Dismiss24Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from '@fluentui/react-icons';
import { authApi } from '../api/client';

const shmtuBrand: BrandVariants = {
  10: '#040709',
  20: '#0a1520',
  30: '#0e2033',
  40: '#132b46',
  50: '#17365a',
  60: '#1b416e',
  70: '#1f4d82',
  80: '#235996',
  90: '#2765aa',
  100: '#2b71be',
  110: '#387ec6',
  120: '#4d8bcd',
  130: '#6298d4',
  140: '#77a5db',
  150: '#8cb2e2',
  160: '#a1bfe9',
};

const shmtuLightTheme = { ...webLightTheme, ...{ brand: shmtuBrand } };
const shmtuDarkTheme = createDarkTheme(shmtuBrand);

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    transition: 'width 0.2s, min-width 0.2s',
    '@media (max-width: 768px)': {
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '1000',
      height: '100vh',
      width: '260px',
      minWidth: '260px',
      boxShadow: tokens.shadow16,
      transform: 'translateX(0)',
    },
  },
  sidebarHidden: {
    '@media (max-width: 768px)': {
      transform: 'translateX(-100%)',
    },
  },
  sidebarHeader: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navSection: {
    padding: '8px 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    textAlign: 'left',
    fontSize: '14px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: '600',
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
      color: tokens.colorBrandForeground2,
    },
  },
  main: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    height: '48px',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  content: {
    flex: '1',
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: '999',
  },
});

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { path: '/', label: '仪表盘', icon: <Board24Regular /> },
  { path: '/accounts', label: '账号管理', icon: <People24Regular /> },
  { path: '/bills', label: '账单列表', icon: <Money24Regular /> },
  { path: '/bills/stats', label: '账单统计', icon: <Money24Regular /> },
  { path: '/notifications', label: '通知中心', icon: <AlertBadge24Regular /> },
  { path: '/settings', label: '个人设置', icon: <Settings24Regular /> },
];

const adminNav: NavItem[] = [
  { path: '/admin/config', label: '系统配置', icon: <Server24Regular /> },
];

const Layout: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const theme = darkMode ? shmtuDarkTheme : shmtuLightTheme;

  return (
    <FluentProvider theme={theme}>
      <div className={styles.root}>
        {mobileOpen && (
          <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
        )}

        <div className={`${styles.sidebar} ${!mobileOpen ? styles.sidebarHidden : ''}`}>
          <div className={styles.sidebarHeader}>
            <Text size={500} weight="bold" style={{ color: tokens.colorBrandForeground1 }}>
              SHMTU Terminal
            </Text>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              size="small"
              onClick={() => setMobileOpen(false)}
              style={{ display: mobileOpen ? 'inline-flex' : 'none' }}
            />
          </div>

          <div className={styles.navSection}>
            {mainNav.map((item) => (
              <button
                key={item.path}
                className={`${styles.navItem} ${isActive(item.path) ? styles.navItemActive : ''}`}
                onClick={() => handleNav(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <Divider style={{ margin: '4px 12px' }} />

          <div className={styles.navSection}>
            <Text size={200} weight="semibold" style={{ padding: '4px 12px', color: tokens.colorNeutralForeground3 }}>
              管理员
            </Text>
            {adminNav.map((item) => (
              <button
                key={item.path}
                className={`${styles.navItem} ${isActive(item.path) ? styles.navItemActive : ''}`}
                onClick={() => handleNav(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WeatherSunny24Regular />
            <Switch
              checked={darkMode}
              onChange={(_, data) => setDarkMode(data.checked)}
            />
            <WeatherMoon24Regular />
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.topbar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                appearance="subtle"
                icon={<Navigation24Regular />}
                onClick={() => setMobileOpen(true)}
                style={{ display: 'none', '@media (max-width: 768px)': { display: 'inline-flex' } } as React.CSSProperties}
              />
              <Text size={300} weight="semibold">
                {mainNav.find((n) => isActive(n.path))?.label ||
                  adminNav.find((n) => isActive(n.path))?.label ||
                  '仪表盘'}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text size={200}>{user?.username || '用户'}</Text>
              <Button size="small" appearance="subtle" onClick={handleLogout}>
                退出
              </Button>
            </div>
          </div>

          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </FluentProvider>
  );
};

export default Layout;
