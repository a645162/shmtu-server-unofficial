import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  User,
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  SessionInfo,
  BillOriginal,
  BillQueryParams,
  BillStats,
  NotificationLog,
  ChannelInfo,
  NotificationSettings,
  SystemConfig,
  UpdateConfigRequest,
  OperationLog,
  DashboardStats,
  SystemHealth,
  SystemStats,
  PageResponse,
} from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper: extract data from response
function extractData<T>(response: { data: T | { data: T } }): T {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return (d as { data: T }).data;
  }
  return d as T;
}

// ===== Auth API =====
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then(extractData),

  register: (data: RegisterRequest) =>
    apiClient.post<User>('/auth/register', data).then(extractData),

  logout: () => apiClient.post('/auth/logout').then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }),

  me: () =>
    apiClient.get<User>('/auth/me').then(extractData),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put('/auth/password', data).then(extractData),
};

// ===== Account API =====
export const accountApi = {
  list: () =>
    apiClient.get<Account[]>('/accounts').then(extractData),

  get: (id: number) =>
    apiClient.get<Account>(`/accounts/${id}`).then(extractData),

  create: (data: CreateAccountRequest) =>
    apiClient.post<Account>('/accounts', data).then(extractData),

  update: (id: number, data: UpdateAccountRequest) =>
    apiClient.put<Account>(`/accounts/${id}`, data).then(extractData),

  delete: (id: number) =>
    apiClient.delete(`/accounts/${id}`).then(extractData),

  login: (id: number) =>
    apiClient.post(`/accounts/${id}/login`).then(extractData),

  sync: (id: number) =>
    apiClient.post(`/accounts/${id}/sync`).then(extractData),

  getSession: (id: number) =>
    apiClient.get<SessionInfo>(`/accounts/${id}/session`).then(extractData),
};

// ===== Bill API =====
export const billApi = {
  list: (params?: BillQueryParams) =>
    apiClient.get<PageResponse<BillOriginal>>('/bills', { params }).then(extractData),

  stats: (params?: { userId?: number; accountId?: number; startDate?: string; endDate?: string }) =>
    apiClient.get<BillStats>('/bills/stats', { params }).then(extractData),

  newBills: () =>
    apiClient.get<BillOriginal[]>('/bills/new').then(extractData),

  markRead: (billIds?: number[]) =>
    apiClient.post('/bills/mark-read', billIds ? { billIds } : undefined).then(extractData),
};

// ===== Notification API =====
export const notificationApi = {
  list: () =>
    apiClient.get<NotificationLog[]>('/notifications').then(extractData),

  channels: () =>
    apiClient.get<ChannelInfo[]>('/notifications/channels').then(extractData),

  test: () =>
    apiClient.post('/notifications/test').then(extractData),

  getSettings: () =>
    apiClient.get<NotificationSettings>('/notifications/settings').then(extractData),

  updateSettings: (data: Partial<NotificationSettings>) =>
    apiClient.put('/notifications/settings', data).then(extractData),
};

// ===== Config API (Admin) =====
export const configApi = {
  list: () =>
    apiClient.get<SystemConfig[]>('/config').then(extractData),

  update: (key: string, data: UpdateConfigRequest) =>
    apiClient.put(`/config/${key}`, data).then(extractData),

  getOcr: () =>
    apiClient.get('/config/ocr').then(extractData),

  updateOcr: (data: Record<string, unknown>) =>
    apiClient.put('/config/ocr', data).then(extractData),

  getScheduler: () =>
    apiClient.get('/config/scheduler').then(extractData),

  updateScheduler: (data: Record<string, unknown>) =>
    apiClient.put('/config/scheduler', data).then(extractData),
};

// ===== System API (Admin) =====
export const systemApi = {
  health: () =>
    apiClient.get<SystemHealth>('/system/health').then(extractData),

  stats: () =>
    apiClient.get<SystemStats>('/system/stats').then(extractData),

  logs: (params?: { page?: number; size?: number; action?: string }) =>
    apiClient.get<PageResponse<OperationLog>>('/system/logs', { params }).then(extractData),

  syncAll: () =>
    apiClient.post('/system/sync-all').then(extractData),
};

// ===== Dashboard =====
export const dashboardApi = {
  stats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats').then(extractData),

  recentBills: () =>
    apiClient.get<BillOriginal[]>('/bills', { params: { size: 5 } }).then(extractData),
};

// ===== OCR API =====
export const ocrApi = {
  status: () =>
    apiClient.get('/ocr/status').then(extractData),

  recognize: (imageBase64: string) =>
    apiClient.post('/ocr/recognize', { image: imageBase64 }).then(extractData),
};
