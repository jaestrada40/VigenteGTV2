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
  register: (email: string, password: string) => request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  documents: () => request<{ documents: Document[] }>('/api/documents'),
  addDocument: (payload: Pick<Document, 'type' | 'name' | 'expiryDate'>) => request<{ document: Document }>('/api/documents', { method: 'POST', body: JSON.stringify(payload) }),
  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  adminOverview: () => request<{ users: User[]; documents: Document[]; notificationLogs: NotificationLog[] }>('/api/admin/overview'),
  deleteUser: (id: string) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  notify: (id: string) => request<{ delivered: boolean }>(`/api/admin/documents/${id}/notify`, { method: 'POST' }),
};
