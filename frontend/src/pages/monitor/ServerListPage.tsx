import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Badge,
  Spinner,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Input,
  Label,
  Select,
  Link,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  ArrowLeft24Regular,
} from '@fluentui/react-icons';
import {
  listServers,
  createServer,
  deleteServer,
  listInstances,
  registerInstance,
  deleteInstance,
} from '../../api/monitorClient';
import type {
  MonitorServer,
  ServiceInstance,
  CreateServerRequest,
  CreateInstanceRequest,
} from '../../types/monitor';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  serverRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  serverCell: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  center: { padding: '60px', textAlign: 'center' },
  instanceTable: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  instanceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    gap: '8px',
  },
});

const ServerListPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [servers, setServers] = useState<MonitorServer[]>([]);
  const [instancesMap, setInstancesMap] = useState<Record<number, ServiceInstance[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverDesc, setServerDesc] = useState('');

  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [instName, setInstName] = useState('');
  const [instType, setInstType] = useState('dotnet-ocr');
  const [instUrl, setInstUrl] = useState('');
  const [instPoll, setInstPoll] = useState<string>('10');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const serverList = await listServers();
      setServers(serverList);
      const map: Record<number, ServiceInstance[]> = {};
      for (const s of serverList) {
        try {
          map[s.id] = await listInstances(s.id);
        } catch {
          map[s.id] = [];
        }
      }
      setInstancesMap(map);
    } catch {
      setError('加载服务器列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateServer = async () => {
    if (!serverName) return;
    try {
      const payload: CreateServerRequest = { name: serverName, description: serverDesc || undefined };
      await createServer(payload);
      setInfo('服务器组创建成功');
      setServerDialogOpen(false);
      setServerName('');
      setServerDesc('');
      fetchData();
    } catch {
      setError('创建失败');
    }
  };

  const handleDeleteServer = async (id: number) => {
    if (!window.confirm('确认删除此服务器组及其所有实例？')) return;
    try {
      await deleteServer(id);
      setInfo('已删除');
      fetchData();
    } catch {
      setError('删除失败');
    }
  };

  const handleRegisterInstance = async () => {
    if (!selectedServerId || !instName || !instUrl) return;
    try {
      const payload: CreateInstanceRequest = {
        name: instName,
        service_type: instType,
        base_url: instUrl,
        poll_interval_secs: Number(instPoll) || 10,
      };
      await registerInstance(selectedServerId, payload);
      setInfo('实例注册成功');
      setInstanceDialogOpen(false);
      setInstName('');
      setInstUrl('');
      setInstType('dotnet-ocr');
      setInstPoll('10');
      fetchData();
    } catch {
      setError('注册失败');
    }
  };

  const handleDeleteInstance = async (id: number) => {
    if (!window.confirm('确认删除此实例？')) return;
    try {
      await deleteInstance(id);
      setInfo('已删除');
      fetchData();
    } catch {
      setError('删除失败');
    }
  };

  if (loading) return <div className={styles.center}><Spinner size="medium" /></div>;

  return (
    <div>
      <div className={styles.header}>
        <Button
          icon={<ArrowLeft24Regular />}
          appearance="subtle"
          onClick={() => navigate('/monitor/dashboard')}
        />
        <Text size={600} weight="semibold">Server Management</Text>
      </div>

      {error && (
        <MessageBar intent="error" style={{ marginBottom: '12px' }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {info && (
        <MessageBar intent="success" style={{ marginBottom: '12px' }}>
          <MessageBarBody>{info}</MessageBarBody>
        </MessageBar>
      )}

      <div style={{ marginBottom: '16px' }}>
        <Dialog
          open={serverDialogOpen}
          onOpenChange={(_, d) => setServerDialogOpen(d.open)}
        >
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" icon={<Add24Regular />}>
              Create Server Group
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Create Server Group</DialogTitle>
              <DialogContent>
                <div className={styles.formRow}>
                  <Label>Name</Label>
                  <Input
                    value={serverName}
                    onChange={(_, d) => setServerName(d.value)}
                    placeholder="e.g. Production OCR Cluster"
                  />
                </div>
                <div className={styles.formRow}>
                  <Label>Description</Label>
                  <Input
                    value={serverDesc}
                    onChange={(_, d) => setServerDesc(d.value)}
                    placeholder="Optional"
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button appearance="primary" onClick={handleCreateServer}>
                  Create
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      {servers.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarBody>暂无服务器组，点击上方按钮创建</MessageBarBody>
        </MessageBar>
      ) : (
        <div>
          {servers.map((s) => (
            <div key={s.id} style={{ marginBottom: '16px' }}>
              <div className={styles.serverRow}>
                <div className={styles.serverCell}>
                  <Link onClick={() => navigate(`/monitor/servers/${s.id}`)}>
                    <Text weight="semibold">{s.name}</Text>
                  </Link>
                  <Badge appearance="ghost" size="small">
                    {instancesMap[s.id]?.length ?? 0} instances
                  </Badge>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {s.description}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="small"
                    icon={<Add24Regular />}
                    onClick={() => {
                      setSelectedServerId(s.id);
                      setInstanceDialogOpen(true);
                    }}
                  >
                    Add Instance
                  </Button>
                  <Button
                    size="small"
                    icon={<Delete24Regular />}
                    appearance="subtle"
                    onClick={() => handleDeleteServer(s.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {(instancesMap[s.id] ?? []).length > 0 && (
                <div className={styles.instanceTable}>
                  {(instancesMap[s.id] ?? []).map((inst) => (
                    <div key={inst.id} className={styles.instanceRow}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Text size={200}>{inst.name}</Text>
                        <Badge appearance="ghost" size="small">{inst.service_type}</Badge>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {inst.base_url}
                        </Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Poll: {inst.poll_interval_secs}s
                        </Text>
                      </div>
                      <Button
                        size="small"
                        icon={<Delete24Regular />}
                        appearance="subtle"
                        onClick={() => handleDeleteInstance(inst.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={instanceDialogOpen}
        onOpenChange={(_, d) => setInstanceDialogOpen(d.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Register Instance</DialogTitle>
            <DialogContent>
              <div className={styles.formRow}>
                <Label>Name</Label>
                <Input
                  value={instName}
                  onChange={(_, d) => setInstName(d.value)}
                  placeholder="e.g. OCR Server #1"
                />
              </div>
              <div className={styles.formRow}>
                <Label>Type</Label>
                <Select value={instType} onChange={(_, d) => setInstType(d.value)}>
                  <option value="dotnet-ocr">.NET OCR</option>
                  <option value="cpp-ocr">C++ OCR</option>
                  <option value="rust-ocr">Rust OCR</option>
                </Select>
              </div>
              <div className={styles.formRow}>
                <Label>Base URL</Label>
                <Input
                  value={instUrl}
                  onChange={(_, d) => setInstUrl(d.value)}
                  placeholder="http://192.168.1.10:21600"
                />
              </div>
              <div className={styles.formRow}>
                <Label>Poll Interval (s)</Label>
                <Input
                  type="number"
                  value={instPoll}
                  onChange={(_, d) => setInstPoll(d.value)}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleRegisterInstance}>
                Register
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ServerListPage;
