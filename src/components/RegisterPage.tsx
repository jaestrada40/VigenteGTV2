import { FormEvent, useState } from 'react';
import { User, ViewType } from '../types';
import { ShieldCheck, Mail, AlertCircle, Info } from 'lucide-react';
import { api } from '../api';
import PasswordInput from './PasswordInput';
import { useToast } from './ToastProvider';

interface RegisterPageProps { setView: (view: ViewType) => void; onRegister: (user: User) => Promise<void>; }

export default function RegisterPage({ setView, onRegister }: RegisterPageProps) {
  const { toast } = useToast();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirmation,setConfirmation]=useState('');
  const [accepted,setAccepted]=useState(false);
  const [error,setError]=useState(''); const [submitting,setSubmitting]=useState(false);
  const submit=async(event:FormEvent)=>{event.preventDefault();setError('');if(!accepted)return setError('Debes aceptar los términos, la política de privacidad y las alertas por correo.');if(password!==confirmation)return setError('Las contraseñas no coinciden.');if(password.length<12)return setError('La contraseña debe tener al menos 12 caracteres.');setSubmitting(true);try{const{user,verificationEmailSent}=await api.register(email,password);if(!verificationEmailSent)toast('La cuenta se creó, pero el correo de verificación no pudo enviarse. Podrás reenviarlo desde tu panel.','error');else toast('Cuenta creada. Revisa tu correo para verificarla.','success');await onRegister(user);}catch(cause){setError(cause instanceof Error?cause.message:'No fue posible crear la cuenta.');}finally{setSubmitting(false);}};
  const fieldClass="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm";
  return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFBFD] px-6 py-12 geometric-grid"><div className="w-full max-w-md">
    <div className="text-center mb-8"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded bg-brand-blue-dark mb-4"><ShieldCheck className="h-5.5 w-5.5 text-brand-teal"/></div><h2 className="font-display text-2xl font-extrabold text-brand-blue-dark">Crea tu cuenta gratis</h2><p className="mt-2 text-sm text-slate-500">Programa alertas para tus documentos</p></div>
    <div className="geometric-card p-8"><form onSubmit={submit} className="space-y-5">
      {error&&<div className="flex gap-2 rounded bg-red-50 p-3.5 text-xs text-red-600 border border-red-100"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}
      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Correo electrónico<div className="relative mt-2"><Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={fieldClass}/></div></label>
      <PasswordInput label="Contraseña" value={password} onChange={setPassword} minLength={12} autoComplete="new-password" placeholder="12+ caracteres, mayúscula, minúscula y número" />
      <PasswordInput label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
      <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-600"><input type="checkbox" className="mt-1" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Acepto los <button type="button" onClick={()=>setView('terms')} className="font-bold text-brand-teal underline">términos</button>, la <button type="button" onClick={()=>setView('privacy')} className="font-bold text-brand-teal underline">política de privacidad</button> y el envío de alertas sobre mis documentos.</span></label>
      <button disabled={submitting} className="w-full rounded bg-brand-teal py-3 text-xs font-mono font-bold text-white uppercase disabled:opacity-60">{submitting?'Creando…':'Crear cuenta'}</button>
    </form><div className="mt-6 flex gap-2.5 rounded bg-slate-50 p-3.5 text-[11px] text-slate-500 border"><Info className="h-4 w-4 shrink-0 text-brand-blue"/><span><strong className="text-slate-700">Privacidad:</strong> no solicitamos el número de DPI; únicamente el tipo, una etiqueta y la fecha de vencimiento.</span></div></div>
    <p className="text-center mt-6 text-sm text-slate-500">¿Ya tienes una cuenta? <button onClick={()=>setView('login')} className="font-bold text-brand-teal hover:underline">Inicia sesión</button></p>
  </div></div>;
}
