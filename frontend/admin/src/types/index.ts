// ===== User =====
export interface User {
  id: number;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  enable: boolean;
  enableUpdate: boolean;
  birthday: string | null;
  notificationEnabled: boolean;
  // 5个渠道独立开关
  larkEnabled: boolean;
  wecomEnabled: boolean;
  dingtalkEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  // 渠道配置
  larkUserId: string | null;
  larkWebhookUrl: string | null;
  larkWebhookKey: string | null;
  wecomWebhookUrl: string | null;
  wecomWebhookKey: string | null;
  dingtalkWebhookUrl: string | null;
  dingtalkWebhookSecret: string | null;
  notificationEmail: string | null;
  customWebhookUrl: string | null;
  customWebhookHeaders: string | null;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ===== Account =====
export interface Account {
  id: number;
  userId: number;
  accountName: string;
  accountId: string;
  enable: boolean;
  enableUpdate: boolean;
  admissionDate: string | null;
  graduationDate: string | null;
  expireDate: string | null;
  lastLoginTime: string | null;
  lastLoginStatus: string | null;
  lastBillSyncTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  accountName: string;
  accountId: string;
  password: string;
  enable?: boolean;
  enableUpdate?: boolean;
  admissionDate?: string;
  graduationDate?: string;
}

export interface UpdateAccountRequest {
  accountName?: string;
  password?: string;
  enable?: boolean;
  enableUpdate?: boolean;
  admissionDate?: string;
  graduationDate?: string;
}

// ===== Session =====
export interface SessionInfo {
  id: number;
  accountId: number;
  cookies: string | null;
  loginTime: string | null;
  expireTime: string | null;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Bill =====
export interface BillOriginal {
  id: number;
  accountId: number;
  transactionNo: string;
  billDate: string | null;
  billTime: string | null;
  billType: string | null;
  targetUser: string | null;
  amount: number | null;
  money: number | null;
  paymentMethod: string | null;
  status: string | null;
  category: string | null;
  position: string | null;
  room: string | null;
  isNew: boolean;
  createdAt: string;
  accountName?: string;
}

export interface BillQueryParams {
  page?: number;
  size?: number;
  accountId?: number;
  userId?: number;
  category?: string;
  billType?: string;
  startDate?: string;
  endDate?: string;
  isNew?: boolean;
}

export interface BillStats {
  totalAmount: number;
  totalMoney: number;
  count: number;
  newCount: number;
  categoryStats: CategoryStat[];
  monthlyStats: MonthlyStat[];
}

export interface CategoryStat {
  category: string;
  amount: number;
  count: number;
}

export interface MonthlyStat {
  month: string;
  amount: number;
  count: number;
}

// ===== Notification =====
export interface NotificationLog {
  id: number;
  userId: number;
  type: string;
  title: string | null;
  content: string | null;
  channelId: string | null;
  channelMessageId: string | null;
  status: string;
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface ChannelInfo {
  channelId: string;
  displayName: string;
  available: boolean;
  enabled: boolean;
  configuredForUser: boolean;
}

export interface NotificationSettings {
  notificationEnabled: boolean;
  larkEnabled: boolean;
  wecomEnabled: boolean;
  dingtalkEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  larkUserId: string | null;
  larkWebhookUrl: string | null;
  larkWebhookKey: string | null;
  wecomWebhookUrl: string | null;
  wecomWebhookKey: string | null;
  dingtalkWebhookUrl: string | null;
  dingtalkWebhookSecret: string | null;
  notificationEmail: string | null;
  customWebhookUrl: string | null;
  customWebhookHeaders: string | null;
}

// ===== System Config =====
export interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string | null;
  description: string | null;
  valueType: string;
  updatedAt: string;
}

export interface UpdateConfigRequest {
  configValue: string;
}

// ===== Operation Log =====
export interface OperationLog {
  id: number;
  userId: number | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
  username?: string;
}

// ===== Dashboard =====
export interface DashboardStats {
  userCount: number;
  accountCount: number;
  newBillCount: number;
  monthAmount: number;
}

// ===== System =====
export interface SystemHealth {
  status: string;
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: string;
  detail?: string;
}

export interface SystemStats {
  userCount: number;
  accountCount: number;
  billCount: number;
  newBillCount: number;
  todayAmount: number;
  monthAmount: number;
}

// ===== Generic API Response =====
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
