import { useEffect, useState } from 'react';
import { Document, NotificationLog, User, ViewType, DocType } from './types';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import AdminPanel from './components/AdminPanel';
import { api } from './api';
import LegalPage from './components/LegalPage';
import AccountActionPage from './components/AccountActionPage';
import SecurityPage from './components/SecurityPage';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [currentView, setView] = useState<ViewType>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const params = new URLSearchParams(window.location.search);
  const verifyToken = params.get('verify') || undefined;
  const resetToken = params.get('reset') || undefined;

  const loadData = async (user: User) => {
    if (user.isAdmin) {
      const data = await api.adminOverview();
      setUsers(data.users);
      setDocuments(data.documents);
      setNotificationLogs(data.notificationLogs);
    } else {
      const data = await api.documents();
      setDocuments(data.documents);
      setUsers([]);
      setNotificationLogs([]);
    }
  };

  useEffect(() => {
    api.me()
      .then(async ({ user }) => {
        setCurrentUser(user);
        await loadData(user);
        setView(user.isAdmin ? 'admin' : 'dashboard');
      })
      .catch(() => undefined)
      .finally(() => setLoadingSession(false));
  }, []);

  const handleAuthenticated = async (user: User) => {
    setCurrentUser(user);
    await loadData(user);
    setView(user.isAdmin ? 'admin' : 'dashboard');
  };

  const handleLogout = async () => {
    await api.logout().catch(() => undefined);
    setCurrentUser(null);
    setUsers([]);
    setDocuments([]);
    setNotificationLogs([]);
    setView('landing');
  };

  const handleAddDocument = async (type: DocType, name: string, expiryDate: string) => {
    const { document } = await api.addDocument({ type, name: name || `Mi ${type}`, expiryDate });
    setDocuments(previous => [document, ...previous]);
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments(previous => previous.filter(document => document.id !== id));
    } catch (error) { alert(error instanceof Error ? error.message : 'No se pudo eliminar el documento.'); }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setUsers(previous => previous.filter(user => user.id !== id));
      setDocuments(previous => previous.filter(document => document.userId !== id));
    } catch (error) { alert(error instanceof Error ? error.message : 'No se pudo eliminar el usuario.'); }
  };

  const handleResendNotification = async (document: Document) => {
    try {
      await api.notify(document.id);
      if (currentUser) await loadData(currentUser);
      alert(`Correo entregado a ${document.userEmail}.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo enviar el correo.');
      throw error;
    }
  };

  if (loadingSession) return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Cargando Vigente GT…</div>;

  const finishAccountAction = () => { window.history.replaceState({}, '', '/'); setCurrentUser(null); setView('login'); };

  const protectedView = currentView === 'dashboard' || currentView === 'admin';
  const safeView = protectedView && !currentUser ? 'login' : currentView === 'admin' && !currentUser?.isAdmin ? 'dashboard' : currentView;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-teal/20">
      <Navbar currentView={safeView} setView={setView} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 bg-slate-50/20">
        {(verifyToken || resetToken) ? <AccountActionPage verifyToken={verifyToken} resetToken={resetToken} onDone={finishAccountAction} /> : <>
        {safeView === 'landing' && <LandingPage setView={setView} />}
        {safeView === 'register' && <RegisterPage setView={setView} onRegister={handleAuthenticated} />}
        {safeView === 'login' && <LoginPage setView={setView} onLoginSuccess={handleAuthenticated} />}
        {safeView === 'dashboard' && currentUser && <DashboardPage currentUser={currentUser} documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} setView={setView} />}
        {safeView === 'admin' && currentUser?.isAdmin && <AdminPanel users={users} documents={documents} notificationLogs={notificationLogs} onDeleteUser={handleDeleteUser} onDeleteDocument={handleDeleteDocument} onResendNotification={handleResendNotification} setView={setView} />}
        {safeView === 'security' && currentUser && <SecurityPage setView={setView} />}
        {safeView === 'privacy' && <LegalPage type="privacy" setView={setView} />}
        {safeView === 'terms' && <LegalPage type="terms" setView={setView} />}
        </>}
      </main>
      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-xs text-slate-500"><button onClick={()=>setView('privacy')} className="mx-3 hover:text-brand-teal">Privacidad</button><button onClick={()=>setView('terms')} className="mx-3 hover:text-brand-teal">Términos</button></footer>
    </div>
  );
}
