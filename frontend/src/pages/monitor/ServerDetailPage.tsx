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
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { getServerDetail } from '../../api/monitorClient';
import type {
  ServerDetail,
  InstanceDashboardEntry,
  ServiceStatusKind,
} from '../../types/monitor';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  infoCard: { padding: '20px', marginBottom: '16px' },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  instanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
  },
  instanceCard: {
    padding: '16px',
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  instanceTitle: { display: 'flex', alignItems: 'center', gap: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '12px' },
  center: { padding: '60px', textAlign: 'center' },
});

const statusBadge = (s: ServiceStatusKind | undefined) => {
  if (s === 'healthy') return { color: 'success' as const, label: 'healthy' };
  if (s === 'busy') return { color: 'warning' as const, label: 'busy' };
  return { color: 'danger' as const, label: 'unavailable' };
};

const ServerDetailPage: React.FC = () => {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverId = parseInt(id || '0', 10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getServerDetail(serverId);
        setData(res);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (serverId) fetchData();
  }, [serverId]);

  if (loading) return <div className={styles.center}><Spinner size="medium" /></div>;
  if (error) return <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>;
  if (!data) return <MessageBar intent="error"><MessageBarBody>Server not found</MessageBarBody></MessageBar>;

  const healthyCount = data.instances.filter(
    (e) => e.latest_status?.status === 'healthy'
  ).length;

  return (
    <div>
      <div className={styles.header}>
        <Button
          icon={<ArrowLeft24Regular />}
          appearance="subtle"
          onClick={() => navigate('/monitor/servers')}
        />
        <Text size={600} weight="semibold">{data.server.name}</Text>
      </div>

      <Card className={styles.infoCard}>
        <Text size={500} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>
          Server Info
        </Text>
        <div className={styles.infoRow}>
          <Text size={200}>ID</Text>
          <Text size={200}>{data.server.id}</Text>
        </div>
        <div className={styles.infoRow}>
          <Text size={200}>Name</Text>
          <Text size={200}>{data.server.name}</Text>
        </div>
        <div className={styles.infoRow}>
          <Text size={200}>Description</Text>
          <Text size={200}>{data.server.description || '—'}</Text>
        </div>
        <div className={styles.infoRow}>
          <Text size={200}>Instances</Text>
          <Text size={200}>{data.instances.length}</Text>
        </div>
        <div className={styles.infoRow}>
          <Text size={200}>Healthy</Text>
          <Text size={200}>{healthyCount}/{data.instances.length}</Text>
        </div>
      </Card>

      <div className={styles.instanceGrid}>
        {data.instances.map((entry: InstanceDashboardEntry) => {
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
                  <div className={styles.row}>
                    <Text size={200}>Models</Text>
                    <Text size={200}>{st.models_loaded ? 'Loaded' : 'Not Loaded'}</Text>
                  </div>
                  <div className={styles.row}>
                    <Text size={200}>Queue</Text>
                    <Text size={200}>{st.pending_requests}/{st.queue_capacity}</Text>
                  </div>
                  <div className={styles.row}>
                    <Text size={200}>Response</Text>
                    <Text size={200}>{st.response_time_ms.toFixed(1)}ms</Text>
                  </div>
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
    </div>
  );
};

export default ServerDetailPage;
