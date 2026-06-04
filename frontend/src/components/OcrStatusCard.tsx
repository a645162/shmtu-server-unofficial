import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  Badge,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  ProgressBar,
} from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Server24Regular,
} from '@fluentui/react-icons';
import { getOcrServers, type OcrServerInfo } from '../api/monitorClient';

const useStyles = makeStyles({
  card: { padding: '20px' },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr',
    gap: '8px',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerCols: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr',
    gap: '8px',
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    padding: '4px 0 8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

const statusMeta = (s: OcrServerInfo) => {
  if (s.sampleCount === 0) {
    return { intent: 'warning' as const, label: '无样本' };
  }
  if (s.successRate === null || s.successRate < 0.8) {
    return { intent: 'danger' as const, label: '异常' };
  }
  if (s.successRate < 0.95) {
    return { intent: 'warning' as const, label: '降级' };
  }
  return { intent: 'success' as const, label: '健康' };
};

const OcrStatusCard: React.FC = () => {
  const styles = useStyles();
  const [servers, setServers] = useState<OcrServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOcrServers();
      setServers(data);
    } catch (e) {
      setError((e as Error).message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = window.setInterval(fetchData, 30000);
    return () => window.clearInterval(t);
  }, []);

  const healthyCount = servers.filter(
    (s) => s.sampleCount > 0 && (s.successRate ?? 0) >= 0.95
  ).length;

  return (
    <Card className={styles.card}>
      <div className={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server24Regular style={{ color: tokens.colorBrandForeground1 }} />
          <Text size={500} weight="semibold">OCR 可用性监控</Text>
          <Badge
            appearance="filled"
            color={servers.length > 0 && healthyCount === servers.length ? 'success' : 'warning'}
          >
            {servers.length === 0 ? '无服务器' : `${healthyCount}/${servers.length} 健康`}
          </Badge>
        </div>
        <Button
          appearance="subtle"
          icon={<ArrowSync24Regular />}
          size="small"
          onClick={fetchData}
          disabled={loading}
        >
          刷新
        </Button>
      </div>

      {error && (
        <MessageBar intent="error" style={{ marginBottom: '8px' }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {loading && servers.length === 0 ? (
        <div className={styles.empty}>
          <Spinner size="small" />
        </div>
      ) : servers.length === 0 ? (
        <div className={styles.empty}>
          <Text>
            暂无 OCR 服务器，请先在 <Link to="/monitor/servers">服务监控</Link> 中添加
          </Text>
        </div>
      ) : (
        <>
          <div className={styles.headerCols}>
            <Text size={200}>名称 / 地址</Text>
            <Text size={200}>模式</Text>
            <Text size={200}>平均延迟</Text>
            <Text size={200}>成功率</Text>
          </div>
          {servers.map((s) => {
            const meta = statusMeta(s);
            return (
              <div key={`${s.name}-${s.address}`} className={styles.row}>
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
                  {s.avgLatencyMs != null ? (
                    <Text>{s.avgLatencyMs.toFixed(1)} ms</Text>
                  ) : (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </div>
                <div>
                  <ProgressBar
                    value={s.successRate != null ? Math.round(s.successRate * 100) : 0}
                    color={
                      meta.intent === 'success' ? 'success' :
                      meta.intent === 'warning' ? 'warning' : 'error'
                    }
                  />
                  <Text size={200">
                    {s.successRate != null ? `${(s.successRate * 100).toFixed(1)}%` : '—'}
                    {s.sampleCount > 0 && ` · ${s.sampleCount} 样本`}
                    {' · '}
                    {meta.label}
                  </Text>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className={styles.footer}>
        <Link to="/monitor/servers">
          <Button appearance="subtle" size="small">查看详情 →</Button>
        </Link>
      </div>
    </Card>
  );
};

export default OcrStatusCard;
