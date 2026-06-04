import axios from 'axios';

export type OcrServerMode = 'http' | 'tcp';

/**
 * OCR 服务器的实时状态。
 * 单一数据源：GET /api/ocr/servers（OcrController.listServers）。
 * 数据由 OcrServerRegistry 维护，每次 OcrServerMonitor 探活后通过 record() 写入滑动窗口。
 */
export interface OcrServerInfo {
  name: string;
  mode: OcrServerMode;
  enabled: boolean;
  address: string;
  avgLatencyMs: number;
  successRate: number;
  sampleCount: number;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function getOcrServers(): Promise<OcrServerInfo[]> {
  const res = await api.get('/ocr/servers');
  if (!Array.isArray(res.data)) return [];
  return res.data as OcrServerInfo[];
}
