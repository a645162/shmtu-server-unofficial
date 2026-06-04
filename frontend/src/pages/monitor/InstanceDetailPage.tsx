import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import {
  getInstance,
  getInstanceStatus,
  getInstanceHistory,
  getServer,
} from '../../api/monitorClient';
import StatusTimeline from '../../components/StatusTimeline';
import type {
  ServiceInstance,
  ServiceStatus,
  ServiceStatusKind,
  MonitorServer,
} from '../../types/monitor';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  infoCard: { padding: '20px' },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  statLabel: { color: tokens.colorNeutralForeground3, fontSize: '12px', marginBottom: '4px' },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  timelineCard: { padding: '20px' },
  center: { padding: '60px', textAlign: 'center' },
});

const statusBadge = (s: ServiceStatusKind | undefined) => {
  if (s === 'healthy') return { color: 'success' as const, label: 'healthy' };
  if (s === 'busy') return { color: 'warning' as const, label: 'busy' };
  return { color: 'danger' as const, label: 'unavailable' };
};

const utilizationColor = (p: number): 'success' | 'warning' | 'error' => {
  if (p > 80) return 'error';
  if (p > 50) return 'warning';
  return 'success';
};

const InstanceDetailPage: React.FC = () => {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<ServiceInstance | null>(null);
  const [server, setServer] = useState<MonitorServer | null>(null);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [history, setHistory] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const instanceId = parseInt(id || '0', 10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const inst = await getInstance(instanceId);
        setInstance(inst);
        const srv = await getServer(inst.server_id).catch(() => null);
        setServer(srv);
        const [st, hist] = await Promise.all([
          getInstanceStatus(instanceId).catch(() => null),
          getInstanceHistory(instanceId, { limit: 200 }).catch(() => []),
        ]);
        setStatus(st);
        setHistory(hist);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (instanceId) fetchData();
  }, [instanceId]);

  if (loading) return <div className={styles.center}><Spinner size="medium" /></div>;
  if (error) return <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>;
  if (!instance) return <MessageBar intent="error"><MessageBarBody>Instance not found</MessageBarBody></MessageBar>;

  const cfg = statusBadge(status?.status);
  const util = status ? Math.round(status.utilization_percent) : 0;

  return (
    <div>
      <div className={styles.header}>
        <Button
          icon={<ArrowLeft24Regular />}
          appearance="subtle"
          onClick={() => navigate('/monitor/servers')}
        />
        <Text size={600} weight="semibold">{instance.name}</Text>
        {server && <Badge appearance="ghost" size="small">{server.name}</Badge>}
      </div>

      <div className={styles.grid}>
        <Card className={styles.infoCard}>
          <Text size={500} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>
            Instance Info
          </Text>
          <div className={styles.infoRow}><Text size={200}>ID</Text><Text size={200}>{instance.id}</Text></div>
          <div className={styles.infoRow}><Text size={200}>Name</Text><Text size={200}>{instance.name}</Text></div>
          <div className={styles.infoRow}>
            <Text size={200}>Server</Text>
            <Text size={200}>{server ? server.name : `Server #${instance.server_id}`}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text size={200}>Type</Text>
            <Text size={200}>{instance.service_type}</Text>
          </div>
          <div className={styles.infoRow}><Text size={200}>Base URL</Text><Text size={200}>{instance.base_url}</Text></div>
          <div className={styles.infoRow}><Text size={200}>Poll Interval</Text><Text size={200}>{instance.poll_interval_secs}s</Text></div>
          <div className={styles.infoRow}>
            <Text size={200}>Status</Text>
            {status ? (
              <Badge appearance="filled" color={cfg.color}>{status.status}</Badge>
            ) : (
              <Text size={200}>—</Text>
            )}
          </div>
        </Card>

        <Card className={styles.infoCard}>
          <Text size={500} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>
            Current Status
          </Text>
          {status ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div className={styles.statLabel}>Response Time</div>
                <div className={styles.statValue}>{status.response_time_ms.toFixed(1)} ms</div>
              </div>
              <div>
                <div className={styles.statLabel}>Queue</div>
                <div className={styles.statValue}>{status.pending_requests}/{status.queue_capacity}</div>
              </div>
              <div>
                <div className={styles.statLabel}>Utilization</div>
                <ProgressBar value={util} color={utilizationColor(util)} />
                <Text size={200}>{util}%</Text>
              </div>
              <div>
                <div className={styles.statLabel}>Models Loaded</div>
                <div className={styles.statValue}>{status.models_loaded ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className={styles.statLabel}>Avg Response</div>
                <div className={styles.statValue}>
                  {status.avg_response_ms != null ? `${status.avg_response_ms.toFixed(1)} ms` : 'N/A'}
                </div>
              </div>
              {status.total_requests != null && (
                <>
                  <div>
                    <div className={styles.statLabel}>Total Requests</div>
                    <div className={styles.statValue}>{status.total_requests}</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Success / Failure</div>
                    <div className={styles.statValue}>
                      <span style={{ color: tokens.colorPaletteGreenForeground1 }}>
                        {status.success_count ?? 0}
                      </span>
                      {' / '}
                      <span style={{ color: tokens.colorPaletteRedForeground1 }}>
                        {status.failure_count ?? 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              No status data available
            </Text>
          )}
        </Card>
      </div>

      <Card className={styles.timelineCard}>
        <Text size={500} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>
          Status Timeline
        </Text>
        <StatusTimeline history={history} />
      </Card>
    </div>
  );
};

export default InstanceDetailPage;
