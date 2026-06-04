import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  Badge,
  Spinner,
  MessageBar,
  MessageBarBody,
  Button,
  ProgressBar,
} from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Server24Regular,
} from '@fluentui/react-icons';
import { getOcrServers, type OcrServerInfo } from '../../api/monitorClient';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: { padding: '20px' },
  statValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  statLabel: { color: tokens.colorNeutralForeground3, marginTop: '4px' },
  listCard: { padding: '0' },
  row: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.4fr 1.4fr 1.2fr',
    gap: '12px',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerCols: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  center: { padding: '60px', textAlign: 'center' },
});

/**
 * 单台 OCR 服务器的状态分类（基于 OcrServerInfo 的统计指标推导）：
 *   - 无样本 → "无样本"
 *   - 成功率 < 80% → "异常"（danger）
 *   - 80% ≤ 成功率 < 95% → "降级"（warning）
 *   - 成功率 ≥ 95% → "健康"（success）
 *   - enabled=false → "已禁用"（subtle）
 */
type Health = 'healthy' | 'degraded' | 'unhealthy' | 'no-samples' | 'disabled';

const classify = (s: OcrServerInfo): Health => {
  if (!s.enabled) return 'disabled';
  if (s.sampleCount === 0) return 'no-samples';
  if (s.successRate < 0.8) return 'unhealthy';
  if (s.successRate < 0.95) return 'degraded';
  return 'healthy';
};

const healthBadge = (h: Health) => {
  switch (h) {
    case 'healthy': return { intent: 'success' as const, label: '健康' };
    case 'degraded': return { intent: 'warning' as const, label: '降级' };
    case 'unhealthy': return { intent: 'danger' as const, label: '异常' };
    case 'no-samples': return { intent: 'warning' as const, label: '无样本' };
    case 'disabled': return { intent: 'subtle' as const, label: '已禁用' };
  }
};

const DashboardPage: React.FC = () => {
  const styles = useStyles();
  const [servers, setServers] = useState<OcrServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOcrServers();
      setServers(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 每 10s 自动刷新，与 OcrServerMonitor 探活周期同步
    const t = window.setInterval(fetchData, 10000);
    return () => window.clearInterval(t);
  }, []);

  // 顶部统计
  const enabledServers = servers.filter((s) => s.enabled);
  const healthyCount = enabledServers.filter((s) => classify(s) === 'healthy').length;
  const unhealthyCount = enabledServers.filter((s) => classify(s) === 'unhealthy').length;
  const totalSamples = servers.reduce((sum, s) => sum + s.sampleCount, 0);

  if (loading && servers.length === 0) {
    return <div className={styles.center}><Spinner size="medium" /></div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Server24Regular style={{ color: tokens.colorBrandForeground1 }} />
          <Text size={600} weight="semibold">OCR 服务监控</Text>
          <Badge appearance="filled" color="brand">
            {servers.length === 0 ? '无配置' : `${healthyCount}/${enabledServers.length} 健康`}
          </Badge>
        </div>
        <Button appearance="subtle" icon={<ArrowSync24Regular />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      {error && (
        <MessageBar intent="error" style={{ marginBottom: '12px' }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.statGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{servers.length}</div>
          <div className={styles.statLabel}>
            <Server24Regular /> OCR 服务器总数
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue} style={{ color: tokens.colorPaletteGreenForeground1 }}>
            {healthyCount}
          </div>
          <div className={styles.statLabel}>
            <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} /> 健康
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {unhealthyCount}
          </div>
          <div className={styles.statLabel}>
            <ErrorCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} /> 异常
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{totalSamples}</div>
          <div className={styles.statLabel}>累计探活样本</div>
        </Card>
      </div>

      {servers.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarBody>
            暂无 OCR 服务器，请先在 <Link to="/about">关于</Link> 页面查看配置说明，并在 application.yaml 的 <code>ocr.servers</code> 中添加。
          </MessageBarBody>
        </MessageBar>
      ) : (
        <Card className={styles.listCard}>
          <div className={styles.row}>
            <Text size={200} className={styles.headerCols}>名称 / 地址</Text>
            <Text size={200} className={styles.headerCols}>模式</Text>
            <Text size={200} className={styles.headerCols}>平均延迟</Text>
            <Text size={200} className={styles.headerCols}>成功率</Text>
            <Text size={200} className={styles.headerCols}>状态</Text>
          </div>
          {servers.map((s) => {
            const h = classify(s);
            const meta = healthBadge(h);
            const percent = s.sampleCount > 0 ? Math.round(s.successRate * 100) : 0;
            return (
              <div key={s.name} className={styles.row}>
                <div>
                  <Text weight="semibold">{s.name}</Text>
                  <br />
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {s.address}
                  </Text>
                </div>
                <Badge appearance="ghost" size="small">
                  {s.mode.toUpperCase()}
                </Badge>
                <div>
                  {s.sampleCount > 0 ? (
                    <Text>{s.avgLatencyMs.toFixed(1)} ms</Text>
                  ) : (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                  <br />
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {s.sampleCount} 样本
                  </Text>
                </div>
                <div>
                  {s.sampleCount > 0 ? (
                    <>
                      <ProgressBar
                        value={percent}
                        color={
                          h === 'healthy' ? 'success' :
                          h === 'degraded' ? 'warning' :
                          h === 'unhealthy' ? 'error' : 'neutral'
                        }
                      />
                      <Text size={200}>{percent.toFixed(1)}%</Text>
                    </>
                  ) : (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </div>
                <Badge appearance="filled" color={
                  meta.intent === 'success' ? 'success' :
                  meta.intent === 'warning' ? 'warning' :
                  meta.intent === 'danger' ? 'danger' : 'subtle'
                }>
                  {meta.label}
                </Badge>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
