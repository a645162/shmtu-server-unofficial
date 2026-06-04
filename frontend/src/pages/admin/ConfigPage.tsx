import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Label,
  Subtitle1,
  Body1,
  Badge,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { EditRegular } from '@fluentui/react-icons';
import dayjs from 'dayjs';
import { configApi } from '../../api/client';
import type { SystemConfig, UpdateConfigRequest } from '../../types';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
  },
});

const ConfigPage: React.FC = () => {
  const styles = useStyles();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await configApi.list();
      setConfigs(data as SystemConfig[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleEdit = (config: SystemConfig) => {
    setEditKey(config.configKey);
    setEditValue(config.configValue || '');
    setEditDesc(config.description || '');
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: UpdateConfigRequest = { configValue: editValue };
      await configApi.update(editKey, data);
      setMsg({ type: 'success', text: '配置已更新' });
      setEditDialogOpen(false);
      fetchConfigs();
    } catch {
      setMsg({ type: 'error', text: '更新失败' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Body1>加载中...</Body1>;

  return (
    <div>
      <div className={styles.header}>
        <Subtitle1>系统配置</Subtitle1>
      </div>

      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}

      {configs.length === 0 ? (
        <div className={styles.empty}><Text>暂无系统配置</Text></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>配置键</TableHeaderCell>
              <TableHeaderCell>配置值</TableHeaderCell>
              <TableHeaderCell>类型</TableHeaderCell>
              <TableHeaderCell>描述</TableHeaderCell>
              <TableHeaderCell>更新时间</TableHeaderCell>
              <TableHeaderCell>操作</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell>
                  <TableCellLayout>
                    <Text weight="semibold">{config.configKey}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Badge appearance="ghost">{config.configValue || '-'}</Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{config.valueType}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{config.description || '-'}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{dayjs(config.updatedAt).format('YYYY-MM-DD HH:mm')}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Button
                      appearance="subtle"
                      icon={<EditRegular />}
                      size="small"
                      onClick={() => handleEdit(config)}
                    >
                      编辑
                    </Button>
                  </TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editDialogOpen} onOpenChange={(_, data) => setEditDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>编辑配置</DialogTitle>
            <DialogContent>
              <div className={styles.formRow}>
                <Label>配置键</Label>
                <Input value={editKey} readOnly />
              </div>
              <div className={styles.formRow}>
                <Label>配置值</Label>
                <Input
                  value={editValue}
                  onChange={(_, d) => setEditValue(d.value)}
                  placeholder="请输入新的配置值"
                />
              </div>
              <div className={styles.formRow}>
                <Label>描述</Label>
                <Input value={editDesc} readOnly />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditDialogOpen(false)}>取消</Button>
              <Button appearance="primary" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ConfigPage;
