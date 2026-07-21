import React, { useState } from 'react';
import { Document, DocType, User, ViewType } from '../types';
import { CreditCard, Calendar, Plus, Trash2, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Clock, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

interface DashboardPageProps {
  currentUser: User;
  documents: Document[];
  onAddDocument: (type: DocType, name: string, date: string) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  setView: (view: ViewType) => void;
}

// Helper to determine status against the current calendar date.
export function getDocumentStatus(expiryDateStr: string, currentDateStr: string = new Date().toISOString().slice(0, 10)) {
  if (!expiryDateStr) return { daysLeft: 0, status: 'desconocido', label: 'Sin fecha', colorClass: '', badgeClass: '' };
  
  const expiry = new Date(expiryDateStr);
  const current = new Date(currentDateStr);
  
  // Calculate difference in days
  const diffTime = expiry.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      daysLeft: diffDays,
      status: 'vencido', // rojo
      label: `Vencido hace ${Math.abs(diffDays)} días`,
      colorClass: 'border-red-200 bg-red-50/50 text-red-700',
      badgeClass: 'bg-red-600 text-white font-semibold',
      accentColor: 'text-red-500'
    };
  } else if (diffDays <= 30) {
    return {
      daysLeft: diffDays,
      status: 'urgente', // rojo
      label: `Urgente: vence en ${diffDays} días`,
      colorClass: 'border-red-200 bg-red-50/40 text-red-600',
      badgeClass: 'bg-red-500 text-white font-bold animate-pulse',
      accentColor: 'text-red-500'
    };
  } else if (diffDays <= 90) {
    return {
      daysLeft: diffDays,
      status: 'pronto', // naranja
      label: `Vence pronto: en ${diffDays} días`,
      colorClass: 'border-orange-200 bg-orange-50/40 text-brand-orange',
      badgeClass: 'bg-brand-orange text-white font-semibold',
      accentColor: 'text-brand-orange'
    };
  } else {
    return {
      daysLeft: diffDays,
      status: 'vigente', // verde
      label: `Falta tiempo: vence en ${diffDays} días`,
      colorClass: 'border-emerald-200 bg-emerald-50/40 text-emerald-700',
      badgeClass: 'bg-emerald-500 text-white font-medium',
      accentColor: 'text-emerald-500'
    };
  }
}

export default function DashboardPage({ currentUser, documents, onAddDocument, onDeleteDocument, setView }: DashboardPageProps) {
  const [docType, setDocType] = useState<DocType>('DPI');
  const [docName, setDocName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Filter documents belonging to the current user
  const userDocuments = documents.filter(doc => doc.userEmail.toLowerCase() === currentUser.email.toLowerCase());

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!expiryDate) {
      setFormError('Por favor seleccione la fecha de vencimiento de su documento.');
      return;
    }

    try {
      await onAddDocument(docType, docName.trim(), expiryDate);
      setFormSuccess(`¡${docType} agregado con éxito! Hemos programado tus alertas de correo.`);
      setDocName('');
      setExpiryDate('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible agregar el documento.');
      return;
    }

    setTimeout(() => {
      setFormSuccess('');
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10" id="dashboard-container">
      
      {/* Welcome Banner */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-blue-dark">
            Mi Panel de Documentos
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-sans">
            Gestiona los recordatorios para tus documentos clave de Guatemala. Hoy es <strong className="text-brand-blue-dark font-mono font-bold">{new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          </p>
        </div>

        {/* Info panel */}
        <div className="flex items-center space-x-3 rounded bg-brand-blue/5 p-4 border border-brand-blue/15 max-w-md">
          <Clock className="h-5 w-5 text-brand-blue shrink-0" />
          <p className="text-xs text-brand-blue-dark leading-relaxed font-sans">
            El sistema de alertas está programado. Te enviaremos correos electrónicos cuando queden <strong>90, 60 y 30 días</strong> para el vencimiento de tus registros.
          </p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        
        {/* Left 2 columns: List of Documents */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-brand-blue-dark flex items-center space-x-2">
              <FileText className="h-5 w-5 text-brand-teal" />
              <span>Documentos Registrados ({userDocuments.length})</span>
            </h2>
            {userDocuments.length > 0 && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Monitoreando fechas activamente
              </span>
            )}
          </div>

          {/* Empty State */}
          {userDocuments.length === 0 ? (
            <div className="geometric-card p-12 text-center" id="empty-state-card">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-slate-50 text-slate-400 mb-5 border border-slate-200">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-700">No tienes documentos registrados</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 font-sans">
                Para empezar a recibir avisos de vencimiento por correo, agrega tu primer DPI o Licencia utilizando el formulario que se encuentra a continuación.
              </p>
              <div className="mt-6">
                <a 
                  href="#add-document-card" 
                  className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-brand-teal hover:text-brand-teal-hover uppercase tracking-wider transition-all"
                >
                  <span>Ir al formulario para agregar</span>
                  <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                </a>
              </div>
            </div>
          ) : (
            /* Document Cards List */
            <div className="grid gap-6 md:grid-cols-2" id="document-grid">
              {userDocuments.map((doc) => {
                const info = getDocumentStatus(doc.expiryDate);
                const isDPI = doc.type === 'DPI';
                
                return (
                  <div 
                    key={doc.id}
                    id={`doc-card-${doc.id}`}
                    className={`relative overflow-hidden geometric-card p-6 border-l-4 transition-all hover:-translate-y-0.5 ${info.colorClass}`}
                  >
                    {/* Header bar of mini card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`flex h-9 w-9 items-center justify-center rounded bg-white shadow-xs border ${isDPI ? 'border-brand-blue/15 text-brand-blue' : 'border-brand-teal/15 text-brand-teal'}`}>
                          {isDPI ? (
                            <span className="font-mono font-extrabold text-xs">DPI</span>
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                            Documento GT
                          </span>
                          <h4 className="font-display text-base font-extrabold text-slate-800">
                            {doc.type}
                          </h4>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${info.badgeClass}`}>
                        {info.daysLeft < 0 ? 'Vencido' : info.daysLeft <= 90 ? 'Pronto' : 'Vigente'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="space-y-3 mt-4">
                      {/* Name Label */}
                      <div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Etiqueta / Nombre
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {doc.name || `Mi ${doc.type}`}
                        </span>
                      </div>

                      {/* Expiry Date */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Vence el
                          </span>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-850">
                              {new Date(doc.expiryDate + 'T00:00:00').toLocaleDateString('es-GT', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Expiry Counter Info */}
                        <div className="text-right">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Estado
                          </span>
                          <span className="text-xs font-bold block mt-0.5 font-mono">
                            {info.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-white/50 -mx-6 -mb-6 px-6 py-3">
                      <span className="text-[9px] text-slate-400 flex items-center space-x-1 font-mono uppercase tracking-wider">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-teal shrink-0" />
                        <span>Alertas: Activas</span>
                      </span>

                      {/* Delete Button */}
                      <button
                        id={`btn-delete-${doc.id}`}
                        onClick={() => {
                          if (confirm(`¿Está seguro de que desea eliminar este recordatorio de ${doc.type}? Dejarás de recibir alertas de correo.`)) {
                            onDeleteDocument(doc.id);
                          }
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                        title="Borrar documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Add Document Form Card */}
          <div className="geometric-card p-7" id="add-document-card">
            <div className="mb-5 flex items-center space-x-3 border-b border-slate-200 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-brand-blue-dark">
                  Agregar nuevo documento
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Suma un nuevo DPI o Licencia para recibir avisos de vencimiento automáticos.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4" id="add-document-form">
              
              {formError && (
                <div className="flex items-start space-x-2 rounded bg-red-50 p-3 text-xs font-mono font-semibold text-red-600 border border-red-100">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-start space-x-2 rounded bg-emerald-50 p-3 text-xs font-mono font-semibold text-emerald-700 border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                
                {/* Document Type Selector */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="doc-type">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-select-type-dpi"
                      type="button"
                      onClick={() => setDocType('DPI')}
                      className={`rounded border py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${docType === 'DPI' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue-dark font-black' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                    >
                      DPI
                    </button>
                    <button
                      id="btn-select-type-licencia"
                      type="button"
                      onClick={() => setDocType('Licencia')}
                      className={`rounded border py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${docType === 'Licencia' ? 'border-brand-teal bg-brand-teal/5 text-brand-teal-hover font-black' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                    >
                      Licencia
                    </button>
                  </div>
                </div>

                {/* Expiry Date Selector */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="doc-expiry">
                    Fecha de Vencimiento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="doc-expiry"
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue/30 transition-all font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* Optional Name Label */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="doc-name">
                  Nombre opcional / Descripción corta
                </label>
                <input
                  id="doc-name"
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="ej. Mi DPI de repuesto, Licencia de Moto, DPI Papá"
                  className="w-full rounded border border-slate-200 bg-slate-50/40 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue/30 transition-all font-sans"
                />
                <span className="text-[10px] text-slate-400 font-sans block mt-1.5">
                  Usa una descripción que te ayude a identificar de quién es este documento en tus notificaciones por correo.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  id="btn-add-document-submit"
                  type="submit"
                  className="flex items-center justify-center space-x-2 rounded bg-brand-teal px-5 py-3 text-xs font-mono font-bold text-white uppercase tracking-wider transition-all hover:bg-brand-teal-hover cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Documento y Programar Alertas</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Right 1 column: Helpful Guide & Tips for Guatemalans */}
        <div className="space-y-6">
          
          {/* Quick Stats Summary Card */}
          <div className="geometric-card p-6">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Estado de tu Cobertura
            </h3>
            
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="h-2 w-2 rounded-full bg-brand-teal"></div>
                  <span className="text-xs font-semibold text-slate-600 font-sans">DPI registrados:</span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {userDocuments.filter(d => d.type === 'DPI').length} / 1
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="h-2 w-2 rounded-full bg-brand-blue"></div>
                  <span className="text-xs font-semibold text-slate-600 font-sans">Licencias registradas:</span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {userDocuments.filter(d => d.type === 'Licencia').length} / 1
                </span>
              </div>

              {/* Warnings summary */}
              {userDocuments.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  {userDocuments.some(d => getDocumentStatus(d.expiryDate).daysLeft < 0) ? (
                    <div className="flex items-center space-x-2 rounded bg-red-50 p-2.5 text-[11px] text-red-600 font-mono font-bold border border-red-100 uppercase tracking-wide">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 animate-pulse" />
                      <span>¡DPI/Licencia vencidos!</span>
                    </div>
                  ) : userDocuments.some(d => getDocumentStatus(d.expiryDate).daysLeft <= 90) ? (
                    <div className="flex items-center space-x-2 rounded bg-orange-50 p-2.5 text-[11px] text-brand-orange font-mono font-bold border border-orange-100 uppercase tracking-wide">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-brand-orange" />
                      <span>¡Vencimiento cercano detectado!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 rounded bg-emerald-50 p-2.5 text-[11px] text-emerald-700 font-mono font-bold border border-emerald-100 uppercase tracking-wide">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Cobertura OK 👍</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Guía Rápida de Trámites en Guatemala */}
          <div className="geometric-card p-6 space-y-4">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-3">
              Guía de Renovación GT
            </h3>

            {/* DPI RENAP */}
            <div className="space-y-2.5">
              <span className="inline-flex rounded bg-brand-blue/10 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-blue uppercase border border-brand-blue/10">
                DPI — RENAP
              </span>
              <h4 className="text-xs font-bold text-slate-800">Requisitos básicos para renovación:</h4>
              <ul className="text-xs text-slate-500 list-disc list-inside space-y-1 pl-1 font-sans">
                <li>Pago de <strong>Q100.00</strong> en bancos autorizados (Banrural, etc.).</li>
                <li>Certificado de Nacimiento vigente (si hay cambios de estado civil).</li>
                <li>Boleto de Ornato del año en curso.</li>
                <li>DPI vencido o constancia de robo/pérdida.</li>
              </ul>
              <a 
                href="https://www.renap.gob.gt" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] font-mono font-bold text-brand-blue hover:underline block uppercase tracking-wider"
              >
                Ir a RENAP en línea &rarr;
              </a>
            </div>

            <hr className="border-slate-200/60" />

            {/* Licencia MAYCOM */}
            <div className="space-y-2.5">
              <span className="inline-flex rounded bg-brand-teal/15 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-teal uppercase border border-brand-teal/10">
                Licencia — Maycom
              </span>
              <h4 className="text-xs font-bold text-slate-800">Requisitos básicos para renovación:</h4>
              <ul className="text-xs text-slate-500 list-disc list-inside space-y-1 pl-1 font-sans">
                <li>Examen de la vista emitido por clínica aprobada (Q50.00 apróx).</li>
                <li>DPI vigente original y copia en buen estado.</li>
                <li>Estar solvente de multas de tránsito (SAT y PMTs).</li>
                <li>Pago por años: 1 año Q100, 2 años Q185, 3 años Q260, 4 años Q320.</li>
              </ul>
              <a 
                href="https://licencias.com.gt" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] font-mono font-bold text-brand-teal hover:underline block uppercase tracking-wider"
              >
                Solicitar cita en Maycom &rarr;
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
