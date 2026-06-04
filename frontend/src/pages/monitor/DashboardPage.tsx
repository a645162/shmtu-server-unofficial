import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Cloud24Regular,
  Server24Regular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { getDashboard } from '../../api/monitorClient';
import type {
  DashboardSummary,
  ServiceStatusKind,
  ServerDashboardEntry,
  InstanceDashboardEntry,
} from '../../types/monitor';

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
  serverCard: { padding: '20px', marginBottom: '16px' },
  serverHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  instanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
  },
  instanceCard: {
    padding: '16px',
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  instanceTitle: { display: 'flex', alignItems: 'center', gap: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '12px' },
  empty: { padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
  center: { padding: '60px', textAlign: 'center' },
});

const statusBadge = (s: ServiceStatusKind | undefined) => {
  if (s === 'healthy') return { color: 'success' as const, label: 'healthy' };
  if (s === 'busy') return { color: 'warning' as const, label: 'busy' };
  return { color: 'danger' as const, label: 'unavailable' };
};

const DashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className={styles.center}><Spinner size="medium" /></div>;
  }
  if (error) {
    return <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>;
  }
  if (!data) return null;

  return (
    <div>
      <div className={styles.header}>
        <Text size={600} weight="semibold">SHMTU Service Monitor</Text>
        <Button appearance="subtle" icon={<ArrowSync24Regular />} onClick={fetchData}>
          Refresh
        </Button>
      </div>

      <div className={styles.statGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{data.total_servers}</div>
          <div className={styles.statLabel}>
            <Cloud24Regular /> Server Groups
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{data.total_instances}</div>
          <div className={styles.statLabel}>
            <Server24Regular /> Instances
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue} style={{ color: tokens.colorPaletteGreenForeground1 }}>
            {data.healthy_instances}
          </div>
          <div className={styles.statLabel}>
            <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} /> Healthy
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {data.unavailable_instances}
          </div>
          <div className={styles.statLabel}>
            <ErrorCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} /> Unavailable
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Button appearance="subtle" onClick={() => navigate('/monitor/servers')}>
          <Server24Regular /> Manage Servers →
        </Button>
      </div>

      {data.servers.map((serverEntry: ServerDashboardEntry) => {
        const healthy = serverEntry.instances.filter(
          (e) => e.latest_status?.status === 'healthy'
        ).length;
        const total = serverEntry.instances.length;
        const allHealthy = healthy === total && total > 0;
        const someHealthy = healthy > 0;

        return (
          <Card key={serverEntry.server.id} className={styles.serverCard}>
            <div className={styles.serverHeader}>
              <div>
                <Text size={500} weight="semibold">{serverEntry.server.name}</Text>
                <Text size={200} style={{ marginLeft: '8px', color: tokens.colorNeutralForeground3 }}>
                  {healthy}/{total} healthy
                </Text>
              </div>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => navigate(`/monitor/servers/${serverEntry.server.id}`)}
                icon={<ArrowRight24Regular />}
                iconPosition="after"
              >
                Details
              </Button>
            </div>

            {serverEntry.server.description && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginBottom: '12px', display: 'block' }}>
                {serverEntry.server.description}
              </Text>
            )}

            <Badge
              appearance="filled"
              color={allHealthy ? 'success' : someHealthy ? 'warning' : 'danger'}
              style={{ marginBottom: '12px' }}
            >
              {allHealthy ? 'all healthy' : someHealthy ? 'partial' : 'unavailable'}
            </Badge>

            <div className={styles.instanceGrid}>
              {serverEntry.instances.map((entry: InstanceDashboardEntry) => {
                const inst = entry.instance;
                const st = entry.latest_status;
                const cfg = statusBadge(st?.status);
                return (
                  <Card
                    key={inst.id}
                    className={styles.instanceCard}
                    onClick={() => navigate(`/monitor/instances/${inst.id}`)}
                  >
                    <div className={styles.instanceTitle}>
                      <Badge appearance="filled" color={cfg.color}>{st?.status ?? 'unknown'}</Badge>
                      <Text weight="semibold">{inst.name}</Text>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Badge appearance="ghost" size="small">{inst.service_type}</Badge>
                    </div>
                    {st ? (
                      <div style={{ marginTop: '8px' }}>
                        <div className={styles.row}><Text size={200}>Models</Text><Text size={200}>{st.models_loaded ? 'Loaded' : 'Not Loaded'}</Text></div>
                        <div className={styles.row}><Text size={200}>Queue</Text><Text size={200}>{st.pending_requests}/{st.queue_capacity}</Text></div>
                        <div className={styles.row}><Text size={200}>Response</Text><Text size={200}>{st.response_time_ms.toFixed(1)}ms</Text></div>
                      </div>
                    ) : (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '8px', display: 'block' }}>
                        No status data
                      </Text>
                    )}
                  </Card>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardPage;
