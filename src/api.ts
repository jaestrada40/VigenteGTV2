import { Document, NotificationLog, User } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.');
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>('/api/auth/me'),
  login: (email: string, password: string) => request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) => request<{ user: User; verificationEmailSent: boolean }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, acceptedTerms: true, acceptedPrivacy: true, alertConsent: true }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  documents: () => request<{ documents: Document[] }>('/api/documents'),
  addDocument: (payload: Pick<Document, 'type' | 'name' | 'expiryDate'>) => request<{ document: Document }>('/api/documents', { method: 'POST', body: JSON.stringify(payload) }),
  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  adminOverview: () => request<{ users: User[]; documents: Document[]; notificationLogs: NotificationLog[] }>('/api/admin/overview'),
  deleteUser: (id: string) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  notify: (id: string) => request<{ delivered: boolean }>(`/api/admin/documents/${id}/notify`, { method: 'POST' }),
  verifyEmail: (token: string) => request<{ message: string }>('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: () => request<{ message: string }>('/api/auth/resend-verification', { method: 'POST' }),
  forgotPassword: (email: string) => request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  changePassword: (currentPassword: string, newPassword: string) => request<{ message: string }>('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  smtpHealth: () => request<{ ok: boolean }>('/api/admin/smtp-health'),
  exportAccount: () => request<Record<string, unknown>>('/api/account/export'),
  deleteAccount: (password: string, confirmation: string) => request<void>('/api/account', { method: 'DELETE', body: JSON.stringify({ password, confirmation }) }),
};
