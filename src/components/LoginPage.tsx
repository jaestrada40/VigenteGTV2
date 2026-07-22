import { FormEvent, useEffect, useState } from 'react';
import { User, ViewType } from '../types';
import { ShieldCheck, Mail, AlertCircle, LogIn } from 'lucide-react';
import { api } from '../api';
import PasswordInput from './PasswordInput';

interface LoginPageProps { setView: (view: ViewType) => void; onLoginSuccess: (user: User) => Promise<void>; }

export default function LoginPage({ setView, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode,setForgotMode]=useState(false); const [message,setMessage]=useState('');
  const [mfaTicket,setMfaTicket]=useState(''); const [mfaCode,setMfaCode]=useState('');
  const [mfaSecondsLeft,setMfaSecondsLeft]=useState(0);

  useEffect(() => {
    if (!mfaTicket) return;
    setMfaSecondsLeft(300);
    const timer = window.setInterval(() => {
      setMfaSecondsLeft(seconds => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          setMfaTicket(''); setMfaCode('');
          setError('El tiempo para ingresar el código terminó. Inicia sesión nuevamente.');
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mfaTicket]);

  const mfaTime = `${Math.floor(mfaSecondsLeft / 60)}:${String(mfaSecondsLeft % 60).padStart(2, '0')}`;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setSubmitting(true);
    try {
      if (mfaTicket) {
        const { user } = await api.completeMfa(mfaTicket, mfaCode);
        await onLoginSuccess(user);
      } else {
        const result = await api.login(email, password);
        if (result.mfaRequired && result.mfaTicket) { setMfaTicket(result.mfaTicket); setPassword(''); return; }
        if (result.user) await onLoginSuccess(result.user);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible iniciar sesión.'); }
    finally { setSubmitting(false); }
  };
  const handleForgot=async(event:FormEvent)=>{event.preventDefault();setError('');setSubmitting(true);try{const result=await api.forgotPassword(email);setMessage(result.message);}catch(cause){setError(cause instanceof Error?cause.message:'No fue posible procesar la solicitud.');}finally{setSubmitting(false);}};

  return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFBFD] px-6 py-12 geometric-grid">
    <div className="w-full max-w-md">
      <div className="text-center mb-8"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded bg-brand-blue-dark text-white mb-4"><ShieldCheck className="h-5.5 w-5.5 text-brand-teal" /></div><h2 className="font-display text-2xl font-extrabold text-brand-blue-dark">Bienvenido de vuelta</h2><p className="mt-2 text-sm text-slate-500">Ingresa para revisar tus documentos</p></div>
      <div className="geometric-card p-8">
        <form onSubmit={forgotMode?handleForgot:handleSubmit} className="space-y-5">
          {error && <div className="flex gap-2 rounded bg-red-50 p-3.5 text-xs text-red-600 border border-red-100"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {message&&<div className="rounded border border-emerald-100 bg-emerald-50 p-3.5 text-xs text-emerald-700">{message}</div>}
          {!mfaTicket&&<label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Correo electrónico<div className="relative mt-2"><Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm" placeholder="ejemplo@correo.gt"/></div></label>}
          {!forgotMode&&!mfaTicket&&<PasswordInput label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" placeholder="••••••••••" />}
          {mfaTicket&&<label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Código de autenticación o recuperación<input autoFocus required value={mfaCode} onChange={e=>setMfaCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" placeholder="123456" className="mt-2 w-full rounded border border-slate-200 p-3 text-center font-mono text-lg tracking-widest"/><span className={`mt-2 block text-center normal-case ${mfaSecondsLeft<=60?'text-red-600':'text-slate-500'}`}>Esta verificación vence en <strong className="font-mono">{mfaTime}</strong></span></label>}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded bg-brand-teal py-3 text-xs font-mono font-bold text-white uppercase disabled:opacity-60"><LogIn className="h-4 w-4"/>{submitting ? 'Procesando…' : forgotMode?'Enviar enlace':mfaTicket?'Verificar código':'Iniciar sesión'}</button>
          {!mfaTicket&&<button type="button" onClick={()=>{setForgotMode(!forgotMode);setError('');setMessage('');}} className="w-full text-xs font-bold text-brand-blue">{forgotMode?'Volver al inicio de sesión':'¿Olvidaste tu contraseña?'}</button>}
          {mfaTicket&&<button type="button" onClick={()=>{setMfaTicket('');setMfaCode('');setError('');}} className="w-full text-xs font-bold text-brand-blue">Volver al inicio de sesión</button>}
        </form>
      </div>
      <p className="text-center mt-6 text-sm text-slate-500">¿No tienes cuenta? <button onClick={()=>setView('register')} className="font-bold text-brand-teal hover:underline">Regístrate gratis</button></p>
    </div>
  </div>;
}
