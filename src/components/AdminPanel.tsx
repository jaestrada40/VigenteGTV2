import React, { useState } from 'react';
import { User, Document, NotificationLog, ViewType } from '../types';
import { getDocumentStatus } from './DashboardPage';
import { Users, FileText, Send, Trash2, Calendar, AlertTriangle, ShieldCheck, Mail, Check, ArrowRight, RefreshCw, FileCheck } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  documents: Document[];
  notificationLogs: NotificationLog[];
  onDeleteUser: (userId: string) => void;
  onDeleteDocument: (docId: string) => void;
  onResendNotification: (doc: Document) => void;
  setView: (view: ViewType) => void;
}

export default function AdminPanel({
  users,
  documents,
  notificationLogs,
  onDeleteUser,
  onDeleteDocument,
  onResendNotification,
  setView
}: AdminPanelProps) {
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculate stats
  const totalUsersCount = users.filter(u => !u.isAdmin).length;
  const totalDocsCount = documents.length;
  const dpiCount = documents.filter(d => d.type === 'DPI').length;
  const licenciaCount = documents.filter(d => d.type === 'Licencia').length;
  const totalNotificationsSent = notificationLogs.length;

  const handleResendClick = (doc: Document) => {
    onResendNotification(doc);
    
    setToastMessage(`Aviso enviado con éxito a ${doc.userEmail} para su ${doc.type} (${doc.name || 'Sin etiqueta'})`);
    
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  const handleUserDelete = (user: User) => {
    if (user.email === 'javiera.estradag@gmail.com') {
      alert('Por cuestiones de prueba, no permitimos eliminar la cuenta semilla javiera.estradag@gmail.com para evitar quedar con un panel vacío.');
      return;
    }
    
    if (confirm(`¿Está seguro de que desea eliminar la cuenta de ${user.email}?\nSe borrarán todos sus documentos (${documents.filter(d => d.userId === user.id).length}) y dejará de recibir alertas de manera irreversible.`)) {
      onDeleteUser(user.id);
    }
  };

  // Filter out actual admin user from standard lists if desired, or keep them
  const standardUsers = users.filter(u => !u.isAdmin && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDocs = documents.filter(d => d.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10" id="admin-panel-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-xl border border-slate-800 animate-slide-up">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-teal text-white border border-brand-teal/20">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Simulación de Alerta</p>
            <p className="font-sans text-sm text-white font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-blue-dark flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-brand-teal" />
            <span>Panel de Control Administrativo</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-sans">
            Monitoreo global de registros de usuarios, documentos de Guatemala y envíos automáticos de alertas.
          </p>
        </div>

        {/* Global Search Input */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Buscar por correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white px-4 py-2 text-sm placeholder-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-all font-sans"
          />
        </div>
      </div>

      {/* Three Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-10" id="admin-stats-row">
        
        {/* Stat 1: Users */}
        <div className="geometric-card p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Usuarios Registrados
            </span>
            <span className="text-3xl font-extrabold text-brand-blue-dark block mt-2 font-mono">
              {totalUsersCount}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              Ciudadanos activos en Guatemala
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-blue/5 text-brand-blue border border-brand-blue/10">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 2: Documents */}
        <div className="geometric-card p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Documentos Registrados
            </span>
            <span className="text-3xl font-extrabold text-brand-blue-dark block mt-2 font-mono">
              {totalDocsCount}
            </span>
            <div className="flex items-center space-x-2 mt-1.5 text-[10px] font-mono font-bold uppercase tracking-wide">
              <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 text-brand-blue border border-brand-blue/5">
                {dpiCount} DPI
              </span>
              <span className="text-slate-300">/</span>
              <span className="rounded bg-brand-teal/10 px-1.5 py-0.5 text-brand-teal-hover border border-brand-teal/5">
                {licenciaCount} Licencias
              </span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-teal/5 text-brand-teal border border-brand-teal/10">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 3: Recordatorios enviados */}
        <div className="geometric-card p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Alertas por Correo Enviadas
            </span>
            <span className="text-3xl font-extrabold text-brand-blue-dark block mt-2 font-mono">
              {totalNotificationsSent}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              Avisos automáticos despachados
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded bg-orange-50 text-brand-orange border border-orange-100">
            <Mail className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Grid of Tables */}
      <div className="space-y-10">
        
        {/* Table 1: Users */}
        <div className="geometric-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-brand-blue-dark">
                Listado de Usuarios Registrados
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Mapeo de cuentas de ciudadanos y la cantidad de documentos que tienen bajo supervisión activa.
              </p>
            </div>
            <span className="rounded bg-slate-200/70 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider border border-slate-300/50">
              {standardUsers.length} registros listados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="users-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/40 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Correo Electrónico</th>
                  <th className="px-6 py-3.5">Fecha de Registro</th>
                  <th className="px-6 py-3.5 text-center">Docs Monitoreados</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-sans text-slate-700">
                {standardUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  standardUsers.map((user) => {
                    const userDocs = documents.filter(d => d.userEmail.toLowerCase() === user.email.toLowerCase());
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-blue-dark/5 text-brand-blue-dark font-mono text-xs font-bold border border-brand-blue-dark/10">
                              {user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold block text-slate-800">{user.email}</span>
                              <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-widest">
                                ID: {user.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium font-mono text-xs">
                          {new Date(user.createdAt + 'T00:00:00').toLocaleDateString('es-GT', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center rounded px-2.5 py-0.5 text-xs font-mono font-bold ${userDocs.length > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                            {userDocs.length} docs
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            id={`btn-admin-delete-user-${user.id}`}
                            onClick={() => handleUserDelete(user)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors inline-flex cursor-pointer"
                            title="Eliminar usuario permanentemente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>          {/* Table 2: Documents */}
        <div className="geometric-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-brand-blue-dark">
                Listado de Documentos Monitoreados
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Tabla general con todas las fechas de expiración. Permite reenviar avisos simulados por correo a los dueños correspondientes.
              </p>
            </div>
            <span className="rounded bg-slate-200/70 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider border border-slate-300/50">
              {filteredDocs.length} registros de documentos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="documents-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/40 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Propietario</th>
                  <th className="px-6 py-3.5">Tipo</th>
                  <th className="px-6 py-3.5">Etiqueta</th>
                  <th className="px-6 py-3.5">Fecha Vencimiento</th>
                  <th className="px-6 py-3.5 text-center">Badge Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones de Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-sans text-slate-700">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                      No se encontraron documentos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const statusInfo = getDocumentStatus(doc.expiryDate);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* Owner Email */}
                        <td className="px-6 py-4 font-semibold text-slate-800 font-sans">
                          {doc.userEmail}
                        </td>

                        {/* Document Type */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${doc.type === 'DPI' ? 'bg-brand-blue/5 text-brand-blue border border-brand-blue/15' : 'bg-brand-teal/10 text-brand-teal-hover border border-brand-teal/20'}`}>
                            {doc.type}
                          </span>
                        </td>

                        {/* Optional name */}
                        <td className="px-6 py-4 text-slate-500 font-medium font-sans">
                          {doc.name || <em className="text-slate-300 font-normal font-sans">Sin etiqueta</em>}
                        </td>

                        {/* Expiration date */}
                        <td className="px-6 py-4 text-slate-850 font-bold font-mono text-xs">
                          {new Date(doc.expiryDate + 'T00:00:00').toLocaleDateString('es-GT', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${statusInfo.badgeClass}`}>
                            {statusInfo.daysLeft < 0 ? 'Vencido' : statusInfo.daysLeft <= 90 ? 'Pronto' : 'Vigente'}
                          </span>
                        </td>

                        {/* Send Notification Trigger */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              id={`btn-admin-resend-${doc.id}`}
                              onClick={() => handleResendClick(doc)}
                              className="flex items-center space-x-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                              title="Enviar correo simulado de alerta"
                            >
                              <Send className="h-3 w-3 text-brand-teal" />
                              <span>Reenviar aviso</span>
                            </button>

                            <button
                              id={`btn-admin-delete-doc-${doc.id}`}
                              onClick={() => {
                                if (confirm(`¿Eliminar este documento de ${doc.type} de ${doc.userEmail}?`)) {
                                  onDeleteDocument(doc.id);
                                }
                              }}
                              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                              title="Borrar documento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Envíos de Alertas (Mock notification terminal) */}
        <div className="geometric-card bg-slate-900 border-slate-800 p-6 text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-brand-teal border border-slate-700">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Historial de Notificaciones por Correo Electrónico
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Registro en tiempo real de correos de alerta despachados por el sistema a los usuarios.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => alert('Simulador: Todas las alertas diarias automáticas han sido verificadas con el servidor de correos.')}
              className="rounded bg-slate-800 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 transition-colors flex items-center space-x-1 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 text-brand-teal" />
              <span>Verificar SMTP</span>
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-2">
            {notificationLogs.length === 0 ? (
              <p className="text-slate-500 italic py-4 text-center">
                Ninguna notificación enviada aún en esta sesión de simulación.
              </p>
            ) : (
              [...notificationLogs].reverse().map((log) => (
                <div key={log.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-850 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-brand-teal font-bold">[VIGENTE_GT_MAILER]</span>
                    <span className="text-slate-400"> Correo enviado a </span>
                    <strong className="text-white font-semibold">{log.userEmail}</strong>
                    <span className="text-slate-400"> para su </span>
                    <span className="text-slate-200 underline">{log.docType} ({log.docName})</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-sm font-bold ${
                      log.status === 'Vencido' ? 'bg-red-950 text-red-400 border border-red-900/40' :
                      log.status === 'Urgente' ? 'bg-red-950 text-red-300 border border-red-900/30' :
                      'bg-orange-950 text-orange-400 border border-orange-900/30'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-slate-500">
                      {new Date(log.sentAt).toLocaleTimeString('es-GT')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
