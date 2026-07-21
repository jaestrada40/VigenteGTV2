import React, { useState } from 'react';
import { User, ViewType } from '../types';
import { ShieldCheck, Mail, Lock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface RegisterPageProps {
  setView: (view: ViewType) => void;
  users: User[];
  onRegister: (newUser: User) => void;
}

export default function RegisterPage({ setView, users, onRegister }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingrese un correo electrónico válido (ej. juan@correo.gt).');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    // Check if user already exists
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      setError('Este correo electrónico ya se encuentra registrado.');
      return;
    }

    // Register user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: email.trim().toLowerCase(),
      password: password,
      createdAt: new Date().toISOString().split('T')[0],
      isAdmin: email.toLowerCase() === 'admin@vigente.gt' || email.toLowerCase().includes('admin')
    };

    onRegister(newUser);
    setSuccess('¡Cuenta creada con éxito! Redirigiéndote a tu panel de control...');
    
    // Clear inputs
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFBFD] px-6 py-12 geometric-grid" id="register-page-container">
      <div className="w-full max-w-md">
        
        {/* Brand header above form */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded bg-brand-blue-dark text-white mb-4 border border-brand-blue/20">
            <ShieldCheck className="h-5.5 w-5.5 text-brand-teal" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-brand-blue-dark">
            Crea tu cuenta gratis
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-sans">
            Regístrate para programar alertas de tus documentos de identidad
          </p>
        </div>

        {/* Card */}
        <div className="geometric-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
            
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
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="reg-email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="reg-email"
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
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="reg-password">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-brand-blue focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue/30 font-sans"
                />
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="reg-confirm-password">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-brand-blue focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue/30 font-sans"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              id="btn-submit-register"
              type="submit"
              className="w-full rounded bg-brand-teal py-3 text-center text-xs font-mono font-bold text-white uppercase tracking-wider transition-all hover:bg-brand-teal-hover active:scale-98 cursor-pointer shadow-sm"
            >
              Crear cuenta
            </button>
          </form>

          {/* Privacy statement / disclaimer */}
          <div className="mt-6 flex items-start space-x-2.5 rounded bg-slate-50 p-3.5 text-[11px] text-slate-500 border border-slate-200 font-sans">
            <Info className="h-4 w-4 shrink-0 text-brand-blue mt-0.5" />
            <span>
              <strong className="font-semibold text-slate-700">Privacidad garantizada:</strong> No solicitamos tu número completo de DPI ni datos bancarios. Solo monitoreamos las fechas de vencimiento para enviarte avisos privados.
            </span>
          </div>
        </div>

        {/* Redirect Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 font-sans">
            ¿Ya tienes una cuenta?{' '}
            <button
              id="btn-switch-to-login"
              onClick={() => setView('login')}
              className="font-bold text-brand-teal hover:text-brand-teal-hover hover:underline transition-colors cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
