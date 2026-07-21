import React, { useState } from 'react';
import { User, ViewType } from '../types';
import { ShieldCheck, Mail, Lock, AlertCircle, CheckCircle, Sparkles, LogIn } from 'lucide-react';

interface LoginPageProps {
  setView: (view: ViewType) => void;
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginPage({ setView, users, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Try finding the user
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!foundUser) {
      setError('No encontramos ninguna cuenta con ese correo electrónico.');
      return;
    }

    // Since this is a high-fidelity mock, we support standard password matching.
    // Let's assume correct password if it matches the mock or is at least 4 characters for convenience.
    if (foundUser.password && foundUser.password !== password) {
      setError('La contraseña ingresada es incorrecta.');
      return;
    }

    setSuccess('¡Inicio de sesión exitoso! Redirigiéndote...');
    
    setTimeout(() => {
      onLoginSuccess(foundUser);
      if (foundUser.isAdmin) {
        setView('admin');
      } else {
        setView('dashboard');
      }
    }, 600);
  };

  const handleQuickLogin = (role: 'user' | 'admin') => {
    setError('');
    setSuccess('');
    
    const targetEmail = role === 'admin' ? 'admin@vigente.gt' : 'javiera.estradag@gmail.com';
    const foundUser = users.find(u => u.email.toLowerCase() === targetEmail);
    
    if (foundUser) {
      setEmail(foundUser.email);
      setPassword(foundUser.password || 'password123');
      
      setSuccess(`¡Ingresando con cuenta de prueba como ${role === 'admin' ? 'Administrador' : 'Ciudadano'}!`);
      setTimeout(() => {
        onLoginSuccess(foundUser);
        setView(role === 'admin' ? 'admin' : 'dashboard');
      }, 700);
    } else {
      setError('La cuenta de prueba no se encontró en el sistema.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFBFD] px-6 py-12 geometric-grid" id="login-page-container">
      <div className="w-full max-w-md">
        
        {/* Brand header above form */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded bg-brand-blue-dark text-white mb-4 border border-brand-blue/20">
            <ShieldCheck className="h-5.5 w-5.5 text-brand-teal" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-brand-blue-dark">
            Bienvenido de vuelta
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-sans">
            Ingresa para revisar el estado de vigencia de tus documentos
          </p>
        </div>

        {/* Card */}
        <div className="geometric-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            
            {error && (
              <div className="flex items-start space-x-2.5 rounded bg-red-50 p-3.5 text-xs font-mono font-semibold text-red-600 border border-red-100">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start space-x-2.5 rounded bg-emerald-50 p-3.5 text-xs font-mono font-semibold text-emerald-700 border border-emerald-100">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="login-email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.gt"
                  className="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-brand-blue focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue/30 font-sans"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider" htmlFor="login-password">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => alert('Para este demo, puedes ingresar usando los accesos rápidos o registrando una cuenta nueva.')}
                  className="text-xs font-mono font-bold text-brand-blue hover:text-brand-blue-dark transition-colors uppercase tracking-wider"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-brand-blue focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue/30 font-sans"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              id="btn-submit-login"
              type="submit"
              className="flex w-full items-center justify-center space-x-2 rounded bg-brand-teal py-3 text-center text-xs font-mono font-bold text-white uppercase tracking-wider transition-all hover:bg-brand-teal-hover active:scale-98 cursor-pointer shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>Iniciar sesión</span>
            </button>
          </form>

          {/* Quick login helper panel */}
          <div className="mt-6 border-t border-slate-200/80 pt-5">
            <div className="flex items-center space-x-1.5 mb-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange animate-bounce" />
              <span>Accesos rápidos de prueba</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              <button
                id="btn-quick-user"
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-50 p-2.5 text-center hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700">Ciudadano Demo</span>
                <span className="text-[10px] font-mono text-slate-450 mt-0.5">Javiera Estrada</span>
              </button>
              
              <button
                id="btn-quick-admin"
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-50 p-2.5 text-center hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold text-brand-blue-dark">Administrador</span>
                <span className="text-[10px] font-mono text-slate-450 mt-0.5">admin@vigente.gt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Redirect Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 font-sans">
            ¿No tienes una cuenta aún?{' '}
            <button
              id="btn-switch-to-register"
              onClick={() => setView('register')}
              className="font-bold text-brand-teal hover:text-brand-teal-hover hover:underline transition-colors cursor-pointer"
            >
              Regístrate gratis aquí
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
