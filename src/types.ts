export type DocType = 'DPI' | 'Licencia';

export interface User {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaRequiredSetup: boolean;
}

export interface Document {
  id: string;
  userId: string;
  userEmail: string;
  type: DocType;
  name: string; // optional user label, e.g., "Mi DPI de repuesto", "Licencia tipo C"
  expiryDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  userEmail: string;
  docType: DocType;
  docName: string;
  expiryDate: string;
  sentAt: string;
  status: 'Vence pronto' | 'Vencido' | 'Urgente';
  deliveryStatus?: 'SENT' | 'FAILED';
}

export type ViewType = 'landing' | 'login' | 'register' | 'dashboard' | 'admin' | 'security' | 'privacy' | 'terms';
