import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface Props { verifyToken?: string; resetToken?: string; onDone: () => void; }
export default function AccountActionPage({ verifyToken, resetToken, onDone }: Props) {
  const [message,setMessage]=useState(verifyToken?'Verificando tu correo…':''); const [error,setError]=useState('');
  const [password,setPassword]=useState(''); const [confirmation,setConfirmation]=useState(''); const [busy,setBusy]=useState(Boolean(verifyToken));
  useEffect(()=>{ if(!verifyToken)return; api.verifyEmail(verifyToken).then(result=>setMessage(result.message)).catch(cause=>setError(cause instanceof Error?cause.message:'No fue posible verificar el correo.')).finally(()=>setBusy(false)); },[verifyToken]);
  const reset=async(event:FormEvent)=>{event.preventDefault();setError('');if(password!==confirmation)return setError('Las contraseñas no coinciden.');setBusy(true);try{const result=await api.resetPassword(resetToken!,password);setMessage(result.message);setPassword('');setConfirmation('');}catch(cause){setError(cause instanceof Error?cause.message:'No fue posible actualizar la contraseña.');}finally{setBusy(false);}};
  return <div className="min-h-[70vh] grid place-items-center px-6"><div className="geometric-card w-full max-w-md p-8 text-center">
    {error?<AlertCircle className="mx-auto h-10 w-10 text-red-500"/>:<CheckCircle2 className="mx-auto h-10 w-10 text-brand-teal"/>}
    <h1 className="mt-4 text-2xl font-extrabold text-brand-blue-dark">{verifyToken?'Verificación de correo':'Nueva contraseña'}</h1>
    {message&&<p className="mt-3 text-sm text-slate-600">{message}</p>}{error&&<p className="mt-3 text-sm text-red-600">{error}</p>}
    {resetToken&&!message&&<form onSubmit={reset} className="mt-6 space-y-4 text-left"><label className="text-xs font-bold text-slate-600">Contraseña nueva<input className="mt-2 w-full rounded border p-3" type="password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="text-xs font-bold text-slate-600">Confirmar contraseña<input className="mt-2 w-full rounded border p-3" type="password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button disabled={busy} className="flex w-full justify-center gap-2 rounded bg-brand-teal p-3 text-xs font-bold uppercase text-white"><Lock className="h-4 w-4"/>Actualizar contraseña</button></form>}
    {(message||error)&&!busy&&<button onClick={onDone} className="mt-6 rounded border border-slate-200 px-5 py-2 text-sm font-bold text-brand-blue">Ir a iniciar sesión</button>}
  </div></div>;
}
