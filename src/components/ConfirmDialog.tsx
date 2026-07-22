import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Eliminar', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onCancel();}}>
    <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5"/></div>
        <button type="button" onClick={onCancel} disabled={busy} aria-label="Cerrar confirmación" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5"/></button>
      </div>
      <h2 id="confirm-dialog-title" className="mt-5 text-xl font-extrabold text-brand-blue-dark">{title}</h2>
      <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={busy} className="rounded border border-slate-200 px-4 py-2.5 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
        <button type="button" onClick={onConfirm} disabled={busy} autoFocus className="rounded bg-red-600 px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-red-700 disabled:opacity-60">{busy?'Procesando…':confirmLabel}</button>
      </div>
    </div>
  </div>;
}
