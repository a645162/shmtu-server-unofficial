import React from 'react';
import {
  makeStyles,
  tokens,
  Title1,
  Title2,
  Title3,
  Body1,
  Link,
  Button,
  Divider,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingLeft: '40px',
    paddingRight: '40px',
    height: '64px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  content: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '48px 24px',
    width: '100%',
  },
  section: { marginBottom: '32px' },
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

const AboutPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/')}
        >
          返回首页
        </Button>
        <Title2>关于</Title2>
      </header>

      <main className={styles.content}>
        <section className={styles.section}>
          <Title1>SHMTU 校园服务监控平台</Title1>
          <Body1 block style={{ marginTop: '12px' }}>
            上海海事大学校园服务监控平台（SHMTU Server Unofficial）是一个开源的校园服务聚合与监控系统。
            平台通过自动登录 CAS 系统实现一卡通账单的定期同步，并结合多渠道消息推送，
            让用户第一时间掌握消费动态。
          </Body1>
        </section>

        <Divider />

        <section className={styles.section}>
          <Title2>核心功能</Title2>
          <Body1 block style={{ marginTop: '8px' }}>
            <ul>
              <li>CAS 统一认证自动登录与会话保活</li>
              <li>一卡通账单定时同步与增量更新</li>
              <li>智能验证码识别（TCP / RESTful OCR，含多服务器速度排序 + fallback）</li>
              <li>多渠道推送：飞书、企业微信、钉钉、邮件、自定义 Webhook</li>
              <li>身份-账号层级管理，一个身份绑定多个学号</li>
              <li>在线系统配置管理</li>
              <li>OCR 可用性监控：首页实时展示每台 OCR 服务器的成功率与平均延迟</li>
            </ul>
          </Body1>
        </section>

        <Divider />

        <section className={styles.section}>
          <Title2>技术栈</Title2>
          <Title3>后端</Title3>
          <Body1 block style={{ marginTop: '4px' }}>
            Kotlin + Spring Boot，集成 shmtu-cas-kotlin 认证库，支持 Docker 容器化部署。
          </Body1>
          <Title3 style={{ marginTop: '16px' }}>OCR 服务</Title3>
          <Body1 block style={{ marginTop: '4px' }}>
            C++ (Drogon + NCNN)，支持 CPU 和 Vulkan GPU 两种推理模式，提供 TCP 和 RESTful API 两种接入方式。
          </Body1>
          <Title3 style={{ marginTop: '16px' }}>前端</Title3>
          <Body1 block style={{ marginTop: '4px' }}>
            React + TypeScript + Fluent UI v9（含 @fluentui/react-charting 图表），管理后台与公开首页统一部署。
          </Body1>
        </section>

        <Divider />

        <section className={styles.section}>
          <Title2>开源信息</Title2>
          <Body1 block style={{ marginTop: '8px' }}>
            本项目基于开源协议发布，代码托管在 GitHub。
          </Body1>
          <Body1 block style={{ marginTop: '8px' }}>
            仓库地址：
            <Link
              href="https://github.com/a645162/shmtu-terminal"
              target="_blank"
              rel="noopener"
            >
              github.com/a645162/shmtu-terminal
            </Link>
          </Body1>
        </section>
      </main>

      <footer className={styles.footer}>
        <Body1>&copy; 2024 SHMTU Terminal Project</Body1>
        <Link
          href="https://github.com/a645162/shmtu-terminal"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </Link>
      </footer>
    </div>
  );
};

export default AboutPage;
