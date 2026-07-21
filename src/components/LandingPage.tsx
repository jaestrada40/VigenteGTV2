import React from 'react';
import { ShieldAlert, CreditCard, Clock, CheckCircle2, ArrowRight, ShieldCheck, Mail, Sparkles, Building2 } from 'lucide-react';

interface LandingPageProps {
  setView: (view: string) => void;
}

export default function LandingPage({ setView }: LandingPageProps) {
  return (
    <div className="flex flex-col bg-[#FAFBFD] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-white border-b border-slate-200/80 geometric-grid" id="hero-section">
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center space-x-1.5 rounded bg-brand-blue-dark/5 px-3.5 py-1 text-xs font-mono font-bold text-brand-blue-dark border border-brand-blue/15 uppercase tracking-wider">
            <span className="flex h-2 w-2 items-center justify-center rounded-full bg-brand-teal">
              <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-brand-teal opacity-75"></span>
            </span>
            <span>Evita multas y dolores de cabeza en Guatemala</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold tracking-tight text-brand-blue-dark sm:text-5xl md:text-6xl leading-[1.15]">
            Que no se te pase la fecha. Mantén tu <span className="text-brand-teal">DPI y Licencia</span> vigentes.
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 font-sans">
            Recibe avisos automáticos y claros por correo electrónico antes de que expiren tus documentos de identidad y de conducir en Guatemala. Todo gratis, seguro y libre de burocracia.
          </p>

          {/* Call to Action */}
          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <button
              id="hero-cta-btn"
              onClick={() => setView('register')}
              className="group flex items-center space-x-2 rounded bg-brand-teal px-7 py-3.5 text-sm font-mono font-bold text-white uppercase tracking-wider transition-all hover:bg-brand-teal-hover hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm"
            >
              <span>Crear cuenta gratis</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              id="hero-sec-btn"
              onClick={() => setView('login')}
              className="rounded border border-slate-300 bg-white px-7 py-3.5 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider transition-all hover:bg-slate-50 hover:text-slate-950 hover:border-slate-400 active:scale-98 cursor-pointer shadow-xs"
            >
              Iniciar sesión
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 sm:space-x-8 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-brand-teal shrink-0" />
              <span>Sin almacenar números críticos</span>
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-300"></span>
            <span className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-brand-teal shrink-0" />
              <span>Notificaciones configurables</span>
            </span>
            <span className="hidden sm:block h-4 w-px bg-slate-300"></span>
            <span className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-brand-teal shrink-0" />
              <span>100% Diseñado para Guatemala</span>
            </span>
          </div>
        </div>
      </section>

      {/* The Problem Section (3 Cards) */}
      <section className="py-20 bg-[#FAFBFD] border-b border-slate-200/50" id="problem-section">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-blue-dark sm:text-4xl">
              El problema de olvidar renovar en Guatemala
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 font-sans text-sm">
              Un olvido inofensivo puede complicar tu rutina diaria, tus finanzas y tu capacidad legal en cuestión de minutos.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Card 1: Multas */}
            <div className="flex flex-col justify-between geometric-card p-8">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded bg-orange-100 text-brand-orange mb-6 border border-brand-orange/10">
                  <ShieldAlert className="h-5.5 w-5.5" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-blue-dark">
                  Multas de Tránsito Directas
                </h3>
                <p className="mt-3 text-slate-600 leading-relaxed text-sm font-sans">
                  Conducir con una licencia vencida amerita una multa fija de <strong>Q300.00</strong> por la PMT. Además, corres el riesgo de que retengan tu vehículo y tu licencia físicamente si un oficial te detiene.
                </p>
              </div>
              <div className="mt-6 flex items-center font-mono text-[10px] font-bold text-brand-orange bg-orange-50/60 p-3 rounded border border-orange-100/50 uppercase tracking-wider">
                <span>⚠️ LEY DE TRÁNSITO ART. 175 Y 176</span>
              </div>
            </div>

            {/* Card 2: Trámites Bloqueados */}
            <div className="flex flex-col justify-between geometric-card p-8">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded bg-red-100 text-red-600 mb-6 border border-red-200/10">
                  <Building2 className="h-5.5 w-5.5" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-blue-dark">
                  Trámites y Bancos Bloqueados
                </h3>
                <p className="mt-3 text-slate-600 leading-relaxed text-sm font-sans">
                  Si tu DPI vence, quedas civilmente inactivo. No podrás cobrar cheques, retirar dinero en ventanilla, renovar contratos de alquiler, realizar traspasos en la SAT, ni renovar tu pasaporte en Migración.
                </p>
              </div>
              <div className="mt-6 flex items-center font-mono text-[10px] font-bold text-red-600 bg-red-50/50 p-3 rounded border border-red-100/50 uppercase tracking-wider">
                <span>🚫 BLOQUEO INMEDIATO EN SISTEMA BANCARIO</span>
              </div>
            </div>

            {/* Card 3: Todo es Presencial */}
            <div className="flex flex-col justify-between geometric-card p-8">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded bg-blue-100 text-brand-blue mb-6 border border-brand-blue/10">
                  <Clock className="h-5.5 w-5.5" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-blue-dark">
                  Trámites 100% Presenciales
                </h3>
                <p className="mt-3 text-slate-600 leading-relaxed text-sm font-sans">
                  Renovar tu DPI en RENAP o tu licencia en Maycom requiere que asistas físicamente. Si esperas a que venza, las filas son más lentas por cargos de mora y papeleo adicional de penalización.
                </p>
              </div>
              <div className="mt-6 flex items-center font-mono text-[10px] font-bold text-brand-blue bg-blue-50/60 p-3 rounded border border-blue-100/50 uppercase tracking-wider">
                <span>⏱️ PÉRDIDA ESTIMADA DE HASTA 6 HORAS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section (3 Steps) */}
      <section className="py-20 bg-white border-y border-slate-200/60" id="how-it-works-section">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-blue-dark sm:text-4xl">
              Cómo funciona Vigente GT en 3 pasos
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 font-sans text-sm">
              Automatizamos el seguimiento de tus fechas límite sin fricciones ni complicaciones técnicas.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3 relative">
            {/* Visual connector lines for desktop */}
            <div className="hidden lg:block absolute top-1/3 left-[15%] right-[15%] h-px bg-slate-200/80 -z-10"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-blue-dark text-white font-mono text-xl font-bold border border-brand-blue-dark shadow-sm">
                01
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-brand-blue-dark">
                Registra tus fechas
              </h3>
              <p className="mt-3 max-w-xs text-sm text-slate-600 leading-relaxed font-sans">
                Ingresa la fecha de expiración que aparece al reverso de tu DPI o en la esquina frontal de tu licencia. Solo te tomará 1 minuto.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-teal text-white font-mono text-xl font-bold border border-brand-teal shadow-sm">
                02
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-brand-blue-dark">
                Monitoreo Silencioso
              </h3>
              <p className="mt-3 max-w-xs text-sm text-slate-600 leading-relaxed font-sans">
                Nuestros servidores calculan los plazos óptimos de renovación diaria y preparan las alertas personalizadas para ti.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-orange text-white font-mono text-xl font-bold border border-brand-orange shadow-sm">
                03
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-brand-blue-dark">
                Recibe Correo de Alerta
              </h3>
              <p className="mt-3 max-w-xs text-sm text-slate-600 leading-relaxed font-sans">
                Te enviamos correos específicos a los 90, 60 y 30 días de anticipación con los requisitos y guías exactas de trámite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section (Gratis vs Premium en construcción) */}
      <section className="py-20 bg-[#FAFBFD]" id="plans-section">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-blue-dark sm:text-4xl">
              Planes simples y justos
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 font-sans text-sm">
              Ofrecemos una protección básica gratuita para siempre y preparamos opciones avanzadas para grupos familiares.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Plan 1: Gratis */}
            <div className="relative geometric-card p-8 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                  Básico
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold text-brand-blue-dark">Para un ciudadano</h3>
                <p className="mt-2 text-sm text-slate-500 font-sans">Perfecto para mantener tus dos documentos personales bajo control.</p>
                
                {/* Price */}
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-mono font-extrabold text-brand-blue-dark">Q0.00</span>
                  <span className="ml-1.5 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">/ para siempre</span>
                </div>

                <hr className="my-6 border-slate-100" />

                {/* Features */}
                <ul className="space-y-4">
                  {[
                    'Monitoreo de hasta 2 documentos activos',
                    'Alertas por Correo Electrónico gratuitas',
                    'Avisos anticipados a 90, 60 y 30 días',
                    'Acceso a guías de requisitos oficiales',
                    'Soporte técnico por correo'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3 text-sm text-slate-600 font-sans">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-teal" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  id="btn-plan-free-cta"
                  onClick={() => setView('register')}
                  className="w-full rounded bg-brand-blue-dark py-3 text-center text-xs font-mono font-bold text-white uppercase tracking-wider transition-all hover:bg-brand-blue active:scale-98 cursor-pointer shadow-sm"
                >
                  Registrarme Gratis
                </button>
              </div>
            </div>

            {/* Plan 2: Premium (En construcción) */}
            <div className="relative geometric-card border-dashed p-8 flex flex-col justify-between bg-slate-50/40">
              {/* Badge Construction */}
              <div className="absolute top-4 right-4 rounded bg-brand-orange/15 px-2.5 py-0.5 text-[9px] font-mono font-bold text-brand-orange uppercase tracking-wider animate-pulse border border-brand-orange/20">
                En Construcción 🚀
              </div>
              
              <div>
                <span className="inline-block rounded bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-brand-blue uppercase tracking-wider border border-brand-blue/20">
                  Familiar Pro
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold text-brand-blue-dark">Para toda la familia</h3>
                <p className="mt-2 text-sm text-slate-500 font-sans">Administra los documentos de tus padres, cónyuge e hijos desde un panel.</p>
                
                {/* Price */}
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-mono font-extrabold text-slate-400">Q19.00</span>
                  <span className="ml-1.5 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">/ mes (estimado)</span>
                </div>

                <hr className="my-6 border-slate-200/50" />

                {/* Features */}
                <ul className="space-y-4">
                  {[
                    'Documentos ilimitados para la familia',
                    'Alertas inmediatas por WhatsApp',
                    'Alertas por SMS de seguridad',
                    'Gestión automatizada de citas en Maycom / RENAP',
                    'Recordatorios semanales inteligentes'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3 text-sm text-slate-450 font-sans">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-200" />
                      <span className="line-through decoration-slate-300/60">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  disabled
                  className="w-full rounded border border-dashed border-slate-300 bg-slate-50 py-3 text-center text-xs font-mono font-bold text-slate-400 cursor-not-allowed uppercase tracking-wider"
                >
                  Próximamente disponible
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-12" id="landing-footer">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-blue-dark text-white border border-brand-blue/20">
              <ShieldCheck className="h-4 w-4 text-brand-teal" />
            </div>
            <span className="font-display text-base font-bold text-brand-blue-dark">Vigente GT</span>
          </div>

          <p className="text-xs text-slate-400 font-medium font-sans text-center md:text-left max-w-xl leading-relaxed">
            &copy; {new Date().getFullYear()} Vigente GT. Todos los derechos reservados. No somos una entidad gubernamental ni de afiliación oficial. Facilitamos el control privado de alertas.
          </p>

          <div className="flex space-x-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            <a href="https://www.renap.gob.gt" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors">RENAP</a>
            <span className="text-slate-200">|</span>
            <a href="https://licencias.com.gt" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors">Maycom</a>
            <span className="text-slate-200">|</span>
            <a href="https://portal.sat.gob.gt" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors">SAT</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
