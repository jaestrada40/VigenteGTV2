import React, { useState, useEffect } from 'react';
import { User, Document, NotificationLog, ViewType, DocType } from './types';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage, { getDocumentStatus } from './components/DashboardPage';
import AdminPanel from './components/AdminPanel';
import { Mail, CheckCircle2, ShieldCheck, Inbox, X, Calendar, AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';

// --- MOCK SEED DATA ---
const DEFAULT_USERS: User[] = [
  {
    id: 'usr-1',
    email: 'javiera.estradag@gmail.com',
    password: 'password123',
    createdAt: '2026-06-01',
    isAdmin: false
  },
  {
    id: 'usr-2',
    email: 'carlos.mendoza@gmail.com',
    password: 'password123',
    createdAt: '2026-05-15',
    isAdmin: false
  },
  {
    id: 'usr-admin',
    email: 'admin@vigente.gt',
    password: 'password123',
    createdAt: '2026-01-01',
    isAdmin: true
  }
];

const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    userId: 'usr-1',
    userEmail: 'javiera.estradag@gmail.com',
    type: 'DPI',
    name: 'Mi DPI Personal',
    expiryDate: '2026-08-15', // Vence pronto (~26 días)
    createdAt: '2026-06-01'
  },
  {
    id: 'doc-2',
    userId: 'usr-1',
    userEmail: 'javiera.estradag@gmail.com',
    type: 'Licencia',
    name: 'Licencia Profesional Tipo B',
    expiryDate: '2028-11-20', // Vigente (> 2 años)
    createdAt: '2026-06-01'
  },
  {
    id: 'doc-3',
    userId: 'usr-2',
    userEmail: 'carlos.mendoza@gmail.com',
    type: 'DPI',
    name: 'DPI de Carlos',
    expiryDate: '2026-07-10', // Vencido (hace 10 días)
    createdAt: '2026-05-15'
  },
  {
    id: 'doc-4',
    userId: 'usr-2',
    userEmail: 'carlos.mendoza@gmail.com',
    type: 'Licencia',
    name: 'Licencia de Moto Tipo M',
    expiryDate: '2026-07-25', // Urgente (~5 días)
    createdAt: '2026-05-15'
  }
];

const DEFAULT_LOGS: NotificationLog[] = [
  {
    id: 'log-1',
    userEmail: 'javiera.estradag@gmail.com',
    docType: 'DPI',
    docName: 'Mi DPI Personal',
    expiryDate: '2026-08-15',
    sentAt: '2026-07-15T10:30:00.000Z',
    status: 'Vence pronto'
  },
  {
    id: 'log-2',
    userEmail: 'carlos.mendoza@gmail.com',
    docType: 'DPI',
    docName: 'DPI de Carlos',
    expiryDate: '2026-07-10',
    sentAt: '2026-07-10T08:15:00.000Z',
    status: 'Vencido'
  }
];

export default function App() {
  // 1. Core State loaded from localStorage if available, else seeds
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vigentegt_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('vigentegt_documents');
    return saved ? JSON.parse(saved) : DEFAULT_DOCUMENTS;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('vigentegt_logs');
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });

  const [currentView, setView] = useState<ViewType>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Email Notification Modal State
  const [activeEmailPreview, setActiveEmailPreview] = useState<{
    doc: Document;
    statusLabel: string;
    daysLeft: number;
  } | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('vigentegt_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('vigentegt_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('vigentegt_logs', JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  // Handle User Registration
  const handleRegister = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    // Automatically transition to client dashboard
    setView('dashboard');
  };

  // Handle Login success
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  // Handle Adding Document
  const handleAddDocument = (type: DocType, name: string, expiryDate: string) => {
    if (!currentUser) return;
    
    const newDoc: Document = {
      id: `doc-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      type,
      name: name || `Mi ${type}`,
      expiryDate,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setDocuments(prev => [...prev, newDoc]);

    // Simulate sending an automatic initial confirmation email in logs
    const statusResult = getDocumentStatus(expiryDate);
    const logStatus = statusResult.status === 'vencido' ? 'Vencido' : statusResult.status === 'urgente' ? 'Urgente' : 'Vence pronto';
    
    const newLog: NotificationLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userEmail: currentUser.email,
      docType: type,
      docName: name || `Mi ${type}`,
      expiryDate,
      sentAt: new Date().toISOString(),
      status: logStatus
    };

    setNotificationLogs(prev => [...prev, newLog]);
  };

  // Handle Deleting Document
  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  // Handle Deleting User (And their documents)
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    setDocuments(prev => prev.filter(d => d.userId !== userId));
  };

  // Handle Resend Notification from Admin Panel
  const handleResendNotification = (doc: Document) => {
    const statusResult = getDocumentStatus(doc.expiryDate);
    const logStatus = statusResult.status === 'vencido' ? 'Vencido' : statusResult.status === 'urgente' ? 'Urgente' : 'Vence pronto';

    // 1. Add log entry
    const newLog: NotificationLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userEmail: doc.userEmail,
      docType: doc.type,
      docName: doc.name || `Mi ${doc.type}`,
      expiryDate: doc.expiryDate,
      sentAt: new Date().toISOString(),
      status: logStatus
    };

    setNotificationLogs(prev => [...prev, newLog]);

    // 2. Open Email Preview Modal to show what was sent
    setActiveEmailPreview({
      doc,
      statusLabel: statusResult.label,
      daysLeft: statusResult.daysLeft
    });
  };

  // Reset sandbox databases
  const handleResetDatabase = () => {
    if (confirm('¿Desea restaurar la base de datos de simulación al estado inicial? Se borrarán tus registros personalizados.')) {
      setUsers(DEFAULT_USERS);
      setDocuments(DEFAULT_DOCUMENTS);
      setNotificationLogs(DEFAULT_LOGS);
      setCurrentUser(null);
      setView('landing');
      alert('¡Base de datos restaurada!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-teal/20">
      
      {/* 🚀 HIGHLIGHT / TESTING TOOLBAR (SANDBOX) 🚀 */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-xs font-semibold flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-orange animate-pulse"></span>
          <span className="text-white font-bold">Vigente GT Sandbox</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Atajos rápidos de evaluación:</span>
        </div>

        {/* View Switches */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button 
            onClick={() => setView('landing')} 
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${currentView === 'landing' ? 'bg-brand-blue text-white font-extrabold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            1. Landing
          </button>
          
          <button 
            onClick={() => setView('register')} 
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${currentView === 'register' ? 'bg-brand-blue text-white font-extrabold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            2. Registro
          </button>
          
          <button 
            onClick={() => setView('login')} 
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${currentView === 'login' ? 'bg-brand-blue text-white font-extrabold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            3. Login
          </button>

          <button 
            onClick={() => {
              // Ensure we are logged in as a normal user (Javiera)
              const javiera = users.find(u => u.email === 'javiera.estradag@gmail.com') || DEFAULT_USERS[0];
              setCurrentUser(javiera);
              setView('dashboard');
            }} 
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${currentView === 'dashboard' ? 'bg-brand-blue text-white font-extrabold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            4. Dashboard Ciudadano
          </button>

          <button 
            onClick={() => {
              // Ensure we are logged in as admin
              const admin = users.find(u => u.email === 'admin@vigente.gt') || DEFAULT_USERS[2];
              setCurrentUser(admin);
              setView('admin');
            }} 
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${currentView === 'admin' ? 'bg-brand-teal text-white font-extrabold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            5. Panel Admin
          </button>
        </div>

        {/* Restore DB Button */}
        <div>
          <button 
            onClick={handleResetDatabase}
            className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-950/80 border border-red-900/30 text-red-300 transition-all font-bold cursor-pointer"
            title="Borrar cambios y restablecer datos iniciales"
          >
            Restablecer Demo Q
          </button>
        </div>
      </div>

      {/* Shared Navigation Header */}
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        currentUser={currentUser} 
        setCurrentUser={setCurrentUser} 
      />

      {/* Main View Router */}
      <main className="flex-1 bg-slate-50/20">
        {currentView === 'landing' && (
          <LandingPage setView={setView} />
        )}
        
        {currentView === 'register' && (
          <RegisterPage 
            setView={setView} 
            users={users} 
            onRegister={handleRegister} 
          />
        )}
        
        {currentView === 'login' && (
          <LoginPage 
            setView={setView} 
            users={users} 
            onLoginSuccess={handleLoginSuccess} 
          />
        )}
        
        {currentView === 'dashboard' && currentUser && (
          <DashboardPage 
            currentUser={currentUser}
            documents={documents}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            setView={setView}
          />
        )}
        
        {currentView === 'admin' && currentUser && (
          <AdminPanel 
            users={users}
            documents={documents}
            notificationLogs={notificationLogs}
            onDeleteUser={handleDeleteUser}
            onDeleteDocument={handleDeleteDocument}
            onResendNotification={handleResendNotification}
            setView={setView}
          />
        )}
      </main>

      {/* --- EMAIL PREVIEW HIGH-FIDELITY MODAL --- */}
      {activeEmailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs font-sans">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-100 shadow-2xl border border-slate-200 animate-zoom-in">
            
            {/* Window header representing an Email Client */}
            <div className="bg-slate-800 text-slate-300 px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-400 font-mono ml-2">Vista del Correo Recibido (Simulador SMTP)</span>
              </div>
              <button 
                onClick={() => setActiveEmailPreview(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Email Metadata Headers */}
            <div className="bg-white p-5 border-b border-slate-100 space-y-2 text-sm text-slate-600">
              <div>
                <strong className="text-slate-400 font-bold mr-2">De:</strong> 
                <span className="font-semibold text-brand-blue-dark">Alertas Vigente GT &lt;alertas@vigente.gt&gt;</span>
              </div>
              <div>
                <strong className="text-slate-400 font-bold mr-2">Para:</strong> 
                <span className="text-slate-800 font-medium">{activeEmailPreview.doc.userEmail}</span>
              </div>
              <div className="pt-1.5">
                <strong className="text-slate-400 font-bold mr-2">Asunto:</strong> 
                <span className="font-extrabold text-slate-900">
                  {activeEmailPreview.daysLeft < 0 
                    ? `⚠️ [VENCIDO] Tu ${activeEmailPreview.doc.type} ha expirado — Evita sanciones` 
                    : activeEmailPreview.daysLeft <= 30
                    ? `🚨 [URGENTE] Tu ${activeEmailPreview.doc.type} vence en ${activeEmailPreview.daysLeft} días — Requisitos de renovación`
                    : `🔔 [AVISO] Tu ${activeEmailPreview.doc.type} (${activeEmailPreview.doc.name || 'Sin etiqueta'}) vence pronto`}
                </span>
              </div>
            </div>

            {/* Simulated HTML Email Body */}
            <div className="bg-white p-8 max-h-[450px] overflow-y-auto">
              <div className="mx-auto max-w-xl border border-slate-100 rounded-2xl p-6 bg-slate-50/50">
                
                {/* Logo in Email */}
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-5 justify-between">
                  <div className="flex items-center space-x-1.5">
                    <div className="h-7 w-7 bg-brand-blue-dark rounded-lg flex items-center justify-center text-white">
                      <ShieldCheck className="h-4.5 w-4.5 text-brand-teal" />
                    </div>
                    <span className="font-display font-black text-brand-blue-dark text-base">Vigente GT</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">ID ALERTA: #{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>

                {/* Email Body Greeting */}
                <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-sans">
                  <h4 className="font-display text-lg font-extrabold text-slate-900">
                    Estimado Ciudadano,
                  </h4>
                  <p>
                    Te escribimos de manera preventiva porque tu documento registrado 
                    <strong className="text-brand-blue-dark font-bold"> {activeEmailPreview.doc.type} ({activeEmailPreview.doc.name || 'Sin etiqueta'}) </strong> 
                    tiene fecha de vencimiento programada para el próximo <strong className="text-slate-900 font-bold">
                      {new Date(activeEmailPreview.doc.expiryDate + 'T00:00:00').toLocaleDateString('es-GT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </strong>.
                  </p>

                  {/* Status Indicator Card in Email */}
                  <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                    activeEmailPreview.daysLeft < 0 
                      ? 'bg-red-50 text-red-700 border-red-100' 
                      : activeEmailPreview.daysLeft <= 30
                      ? 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                      : 'bg-orange-50 text-brand-orange border-orange-100'
                  }`}>
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm font-bold">
                        {activeEmailPreview.daysLeft < 0 
                          ? 'DOCUMENTO EXPIRED / VENCIDO' 
                          : `FALTAN ${activeEmailPreview.daysLeft} DÍAS PARA EL VENCIMIENTO`}
                      </strong>
                      <p className="text-xs opacity-90 mt-1 font-sans">
                        {activeEmailPreview.daysLeft < 0 
                          ? 'Ya no puedes realizar trámites bancarios ni conducir legalmente. Evita multas acumulativas.' 
                          : 'Te recomendamos iniciar el trámite de renovación presencial esta semana para evitar demoras.'}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Requirements Block inside Email */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1">
                      <span>📌 Pasos para Renovación en Guatemala</span>
                    </h5>
                    
                    {activeEmailPreview.doc.type === 'DPI' ? (
                      <ol className="text-xs text-slate-600 list-decimal list-inside space-y-2 pl-0.5">
                        <li>Realiza el pago de <strong>Q100.00</strong> por tarifa de renovación en Banrural o bancos autorizados del RENAP.</li>
                        <li>Compra tu Boleto de Ornato del año en curso en tu municipalidad respectiva.</li>
                        <li>Asiste a cualquier sede de RENAP. Presenta tu comprobante de pago de banco, Boleto de Ornato y tu DPI vencido.</li>
                        <li>Recibirás tu nuevo DPI en aproximadamente 15 a 30 días hábiles.</li>
                      </ol>
                    ) : (
                      <ol className="text-xs text-slate-600 list-decimal list-inside space-y-2 pl-0.5">
                        <li>Realiza tu examen de la vista en una clínica oftálmica autorizada por el Departamento de Tránsito (Q50.00).</li>
                        <li>Verifica tu solvencia de multas en la SAT y las PMTs respectivas de tu localidad.</li>
                        <li>Efectúa el pago por los años de vigencia que desees de tu licencia en la agencia Banrural ubicada dentro de Maycom.</li>
                        <li>Presenta en ventanilla de Maycom tu DPI vigente original y copia, examen de la vista, factura de pago de licencia y la licencia anterior.</li>
                      </ol>
                    )}
                  </div>

                  {/* Helpful disclaimer */}
                  <p className="text-xs text-slate-400 italic font-sans">
                    Nota: Este es un servicio automatizado privado brindado por Vigente GT para recordatorios ciudadanos. Recuerda que no somos una agencia de gobierno y los trámites de renovación deben hacerse directamente en las oficinas oficiales de Maycom o RENAP.
                  </p>
                </div>

                {/* Foot of email */}
                <div className="border-t border-slate-100 mt-6 pt-4 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold">Vigente GT — Alertas Ciudadanas de Guatemala</p>
                  <p>Guatemala, Centro América</p>
                  <p className="pt-2 text-[10px]">
                    Si deseas cancelar estos avisos, inicia sesión en tu panel de control y elimina el documento correspondiente.
                  </p>
                </div>

              </div>
            </div>

            {/* Bottom Actions of Window */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end border-t border-slate-100">
              <button
                onClick={() => setActiveEmailPreview(null)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Entendido, Cerrar Vista
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
