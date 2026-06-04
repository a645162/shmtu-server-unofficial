import axios from 'axios';
import type {
  MonitorServer,
  ServiceInstance,
  ServiceStatus,
  CreateServerRequest,
  CreateInstanceRequest,
  DashboardSummary,
  ServerDetail,
} from '../types/monitor';

const monitorApi = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function listServers(): Promise<MonitorServer[]> {
  const res = await monitorApi.get('/servers');
  return res.data;
}

export async function getServer(id: number): Promise<MonitorServer> {
  const res = await monitorApi.get(`/servers/${id}`);
  return res.data;
}

export async function createServer(data: CreateServerRequest): Promise<MonitorServer> {
  const res = await monitorApi.post('/servers', data);
  return res.data;
}

export async function deleteServer(id: number): Promise<void> {
  await monitorApi.delete(`/servers/${id}`);
}

export async function getServerDetail(id: number): Promise<ServerDetail> {
  const res = await monitorApi.get(`/servers/${id}/detail`);
  return res.data;
}

export async function listInstances(serverId: number): Promise<ServiceInstance[]> {
  const res = await monitorApi.get(`/servers/${serverId}/instances`);
  return res.data;
}

export async function getInstance(id: number): Promise<ServiceInstance> {
  const res = await monitorApi.get(`/instances/${id}`);
  return res.data;
}

export async function registerInstance(
  serverId: number,
  data: CreateInstanceRequest
): Promise<ServiceInstance> {
  const res = await monitorApi.post(`/servers/${serverId}/instances`, data);
  return res.data;
}

export async function deleteInstance(id: number): Promise<void> {
  await monitorApi.delete(`/instances/${id}`);
}

export async function getInstanceStatus(id: number): Promise<ServiceStatus> {
  const res = await monitorApi.get(`/instances/${id}/status`);
  return res.data;
}

export async function getInstanceHistory(
  id: number,
  params?: { from?: string; to?: string; limit?: number }
): Promise<ServiceStatus[]> {
  const res = await monitorApi.get(`/instances/${id}/history`, { params });
  return res.data;
}

export async function getDashboard(): Promise<DashboardSummary> {
  const res = await monitorApi.get('/dashboard');
  return res.data;
}

// ===== OCR 可用性监控（首页用） =====
export type OcrServerMode = 'http' | 'tcp';

export interface OcrServerInfo {
  name: string;
  mode: OcrServerMode;
  address: string;
  avgLatencyMs: number | null;
  successRate: number | null;
  sampleCount: number;
}

export async function getOcrServers(): Promise<OcrServerInfo[]> {
  const res = await monitorApi.get('/ocr/servers');
  return Array.isArray(res.data) ? res.data : [];
}
