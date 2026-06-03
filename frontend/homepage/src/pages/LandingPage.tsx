import React from 'react';
import {
  makeStyles,
  tokens,
  Title1,
  Title2,
  Title3,
  Body1,
  Body1Strong,
  Button,
  Card,
  Link,
  Divider,
} from '@fluentui/react-components';
import {
  DocumentBulletList24Regular,
  Alert24Regular,
  Bot24Regular,
  CheckmarkCircle24Regular,
  Navigation24Filled,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '40px',
    paddingRight: '40px',
    height: '64px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingTop: '80px',
    paddingBottom: '60px',
    paddingLeft: '24px',
    paddingRight: '24px',
    background: `linear-gradient(180deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorNeutralBackground1} 100%)`,
  },
  heroTitle: {
    maxWidth: '720px',
    marginBottom: '16px',
  },
  heroSubtitle: {
    maxWidth: '560px',
    marginBottom: '32px',
    color: tokens.colorNeutralForeground2,
  },
  cardsSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    paddingLeft: '40px',
    paddingRight: '40px',
    paddingTop: '20px',
    paddingBottom: '60px',
    flexWrap: 'wrap',
  },
  featureCard: {
    width: '320px',
    padding: '24px',
  },
  cardIcon: {
    marginBottom: '12px',
    color: tokens.colorBrandForeground1,
  },
  cardTitle: {
    marginBottom: '8px',
  },
  featuresSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingLeft: '40px',
    paddingRight: '40px',
    paddingTop: '40px',
    paddingBottom: '80px',
  },
  featuresGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    maxWidth: '800px',
    marginTop: '24px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '360px',
    padding: '12px 16px',
  },
  featureIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px 40px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: 'auto',
  },
});

const ADMIN_LOGIN_URL = import.meta.env.DEV
  ? 'http://localhost:5173/login'
  : '/admin/login';

const LandingPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Navigation24Filled style={{ color: tokens.colorBrandForeground1, fontSize: '28px' }} />
          <Title2>SHMTU 服务监控</Title2>
        </div>
        <div className={styles.headerRight}>
          <Button
            appearance="subtle"
            onClick={() => window.open(ADMIN_LOGIN_URL, '_self')}
          >
            登录
          </Button>
          <Button
            appearance="primary"
            onClick={() => window.open(ADMIN_LOGIN_URL, '_self')}
          >
            注册
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <Title1 block className={styles.heroTitle}>
          上海海事大学校园服务监控平台
        </Title1>
        <Body1Strong block className={styles.heroSubtitle}>
          自动账单同步 · 多渠道推送 · 智能验证码识别
        </Body1Strong>
        <Button
          appearance="primary"
          size="large"
          onClick={() => window.open(ADMIN_LOGIN_URL, '_self')}
        >
          开始使用
        </Button>
      </section>

      {/* Feature Cards */}
      <section className={styles.cardsSection}>
        <Card className={styles.featureCard}>
          <div className={styles.cardIcon}>
            <DocumentBulletList24Regular style={{ fontSize: '32px' }} />
          </div>
          <Title3 className={styles.cardTitle}>账单监控</Title3>
          <Body1>
            自动同步一卡通账单，新消费即时通知。支持多账号同时监控，消费记录一目了然。
          </Body1>
        </Card>

        <Card className={styles.featureCard}>
          <div className={styles.cardIcon}>
            <Alert24Regular style={{ fontSize: '32px' }} />
          </div>
          <Title3 className={styles.cardTitle}>多渠道推送</Title3>
          <Body1>
            飞书/企微/钉钉/邮件/自定义Webhook，每个渠道独立开关，灵活配置通知方式。
          </Body1>
        </Card>

        <Card className={styles.featureCard}>
          <div className={styles.cardIcon}>
            <Bot24Regular style={{ fontSize: '32px' }} />
          </div>
          <Title3 className={styles.cardTitle}>智能验证码</Title3>
          <Body1>
            支持 TCP 和 RESTful API 两种 OCR 识别方式，自动完成 CAS 验证码识别，无需手动输入。
          </Body1>
        </Card>
      </section>

      <Divider />

      {/* More Features */}
      <section className={styles.featuresSection}>
        <Title2>更多特性</Title2>
        <div className={styles.featuresGrid}>
          <Card className={styles.featureItem}>
            <CheckmarkCircle24Regular className={styles.featureIcon} />
            <Body1Strong>身份-账号管理 — 一个用户绑定多个学号账号</Body1Strong>
          </Card>
          <Card className={styles.featureItem}>
            <CheckmarkCircle24Regular className={styles.featureIcon} />
            <Body1Strong>定时自动刷新 — 定期登录 CAS 抓取最新账单</Body1Strong>
          </Card>
          <Card className={styles.featureItem}>
            <CheckmarkCircle24Regular className={styles.featureIcon} />
            <Body1Strong>会话保活 — 自动检测过期并重新登录</Body1Strong>
          </Card>
          <Card className={styles.featureItem}>
            <CheckmarkCircle24Regular className={styles.featureIcon} />
            <Body1Strong>系统配置 — 在线管理 OCR、调度、通知等参数</Body1Strong>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Body1>&copy; 2024 SHMTU Terminal Project</Body1>
        <Link
          href="https://github.com/a645162/shmtu-terminal"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </Link>
        <Link onClick={() => navigate('/about')} as="button">
          关于
        </Link>
      </footer>
    </div>
  );
};

export default LandingPage;
