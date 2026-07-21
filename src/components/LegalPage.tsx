import { ViewType } from '../types';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface LegalPageProps { type: 'privacy' | 'terms'; setView: (view: ViewType) => void; }

export default function LegalPage({ type, setView }: LegalPageProps) {
  const privacy = type === 'privacy';
  return <article className="mx-auto max-w-3xl px-6 py-14 text-slate-700">
    <button onClick={() => setView('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand-teal"><ArrowLeft className="h-4 w-4"/>Volver</button>
    <div className="mb-8 flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-brand-teal"/><div><h1 className="text-3xl font-extrabold text-brand-blue-dark">{privacy ? 'Política de privacidad' : 'Términos de servicio'}</h1><p className="text-sm text-slate-500">Versión 21 de julio de 2026</p></div></div>
    {privacy ? <div className="space-y-6 leading-relaxed">
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Datos que tratamos</h2><p>Conservamos tu correo electrónico, contraseña cifrada, tipo y nombre descriptivo del documento, fecha de vencimiento, consentimientos, historial de seguridad y entregas de correo. No solicitamos ni necesitamos el número de DPI o licencia.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Finalidad y base</h2><p>Usamos estos datos para autenticar tu cuenta, calcular vencimientos, enviar alertas solicitadas, proteger el servicio y atender soporte. El registro conserva evidencia de tu consentimiento a términos, privacidad y alertas.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Proveedores y conservación</h2><p>El servicio utiliza infraestructura administrada por el responsable, PostgreSQL y el proveedor de correo configurado. Conservamos la cuenta mientras esté activa y los registros técnicos durante el plazo necesario para seguridad, auditoría y obligaciones aplicables.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Tus derechos</h2><p>Puedes solicitar acceso, corrección o eliminación de tus datos contactando al correo de soporte publicado para el servicio. Una eliminación puede conservar únicamente registros exigidos legalmente o necesarios para prevenir abuso.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Seguridad y contacto</h2><p>Aplicamos cifrado en tránsito, hash de contraseñas, sesiones protegidas, control de acceso y registros operativos. Ningún sistema elimina totalmente el riesgo. Configura <strong>PRIVACY_CONTACT</strong> con el correo responsable antes de publicar.</p></section>
    </div> : <div className="space-y-6 leading-relaxed">
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Objeto del servicio</h2><p>Vigente GT ayuda a registrar fechas y enviar recordatorios. No sustituye avisos oficiales, asesoría legal ni la obligación personal de comprobar y renovar documentos ante la autoridad correspondiente.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Cuenta y uso aceptable</h2><p>Debes proporcionar un correo propio, proteger tus credenciales y registrar información lícita. Se prohíbe intentar acceder a cuentas ajenas, automatizar abuso, interferir con el servicio o usarlo para enviar contenido no solicitado.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Disponibilidad</h2><p>Los recordatorios dependen de la información ingresada, conectividad y entrega de terceros. No garantizamos recepción absoluta. Debes mantener un método independiente para verificar vencimientos.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Suspensión y cambios</h2><p>Podemos limitar cuentas que comprometan la seguridad o incumplan estas condiciones. Los cambios materiales a estos términos requerirán una nueva aceptación cuando corresponda.</p></section>
      <section><h2 className="text-xl font-bold text-brand-blue-dark">Responsable</h2><p>Antes de publicar, reemplaza esta sección con el nombre legal, dirección de contacto y jurisdicción del responsable del servicio.</p></section>
    </div>}
    <p className="mt-10 rounded border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">Este texto es una base operativa y debe ser revisado por un profesional jurídico de Guatemala antes del lanzamiento público.</p>
  </article>;
}
