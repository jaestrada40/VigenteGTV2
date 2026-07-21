import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });
let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts(previous => previous.filter(item => item.id !== id)), []);
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(previous => [...previous, { id, message, type }]);
    window.setTimeout(() => dismiss(id), type === 'error' ? 6500 : 4500);
  }, [dismiss]);

  return <ToastContext.Provider value={{ toast }}>
    {children}
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3" aria-live="polite" aria-atomic="false">
      {toasts.map(item => {
        const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? AlertCircle : Info;
        const colors = item.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : item.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-brand-blue-dark';
        return <div key={item.id} role={item.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg ${colors}`}>
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm font-semibold leading-relaxed">{item.message}</p>
          <button onClick={() => dismiss(item.id)} aria-label="Cerrar notificación" className="rounded p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
