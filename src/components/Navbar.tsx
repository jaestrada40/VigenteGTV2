import React from 'react';
import { ViewType, User } from '../types';
import { ShieldAlert, LogOut, ShieldCheck, LayoutDashboard, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export default function Navbar({ currentView, setView, currentUser, setCurrentUser }: NavbarProps) {
  const handleLogout = () => {
    setCurrentUser(null);
    setView('landing');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setView('landing')} 
          className="flex cursor-pointer items-center space-x-3 transition-all hover:opacity-95"
          id="nav-logo-container"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-dark text-white border border-brand-blue/20">
            <ShieldCheck className="h-5 w-5 text-brand-teal" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-display text-xl font-bold tracking-tight text-brand-blue-dark">
                Vigente
              </span>
              <span className="rounded bg-brand-teal/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-teal tracking-wider">
                GT
              </span>
            </div>
            <span className="text-[9px] font-mono font-medium tracking-wider text-slate-400 uppercase">
              Control Ciudadano
            </span>
          </div>
        </div>

        {/* Flag Accent Detail (Guatemala blue-white-blue stripes with precise geometry) */}
        <div className="hidden h-2 w-10 overflow-hidden rounded bg-slate-100 lg:flex border border-slate-200">
          <div className="h-full w-1/3 bg-[#4997D0]"></div>
          <div className="h-full w-1/3 bg-white"></div>
          <div className="h-full w-1/3 bg-[#4997D0]"></div>
        </div>

        {/* Dynamic Navigation Options */}
        <nav className="flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-4">
              {/* If user is Admin */}
              {currentUser.isAdmin ? (
                <>
                  <span className="flex items-center space-x-1.5 rounded bg-brand-blue-dark/5 px-3 py-1 font-mono text-[11px] font-medium text-brand-blue-dark border border-brand-blue/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-teal animate-pulse"></span>
                    <span>ADMIN: <strong className="font-bold">{currentUser.email}</strong></span>
                  </span>
                  
                  {currentView === 'admin' ? (
                    <button
                      id="btn-nav-dashboard"
                      onClick={() => setView('dashboard')}
                      className="flex items-center space-x-1.5 text-xs font-mono font-bold text-brand-blue hover:text-brand-blue-dark transition-colors uppercase tracking-wider"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>Mi Dashboard</span>
                    </button>
                  ) : (
                    <button
                      id="btn-nav-admin"
                      onClick={() => setView('admin')}
                      className="flex items-center space-x-1.5 text-xs font-mono font-bold text-brand-teal hover:text-brand-teal-hover transition-colors uppercase tracking-wider"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Panel Admin</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-500 bg-slate-50 px-3 py-1 rounded border border-slate-150">
                    <UserCheck className="h-3.5 w-3.5 text-brand-teal" />
                    <span>USER: <strong className="font-medium text-slate-700">{currentUser.email}</strong></span>
                  </span>
                  
                  {/* Option to view Admin Panel directly for testing purposes */}
                  <button
                    id="btn-nav-admin-shortcut"
                    onClick={() => {
                      setView('admin');
                    }}
                    className="font-mono text-[10px] font-medium text-slate-400 hover:text-brand-blue transition-colors px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200"
                    title="Simular vista de administrador"
                  >
                    Simular Admin
                  </button>

                  <button
                    id="btn-nav-dashboard"
                    onClick={() => setView('dashboard')}
                    className="text-xs font-mono font-bold text-brand-blue hover:text-brand-blue-dark uppercase tracking-wider transition-colors"
                  >
                    Mi Dashboard
                  </button>
                </>
              )}

              {/* Log Out CTA */}
              <button
                id="btn-nav-logout"
                onClick={handleLogout}
                className="flex items-center space-x-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                id="btn-nav-to-login"
                onClick={() => setView('login')}
                className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider transition-colors hover:text-brand-blue-dark cursor-pointer"
              >
                Iniciar Sesión
              </button>
              
              <button
                id="btn-nav-to-register"
                onClick={() => setView('register')}
                className="rounded bg-brand-teal px-4 py-2 text-xs font-mono font-bold text-white uppercase tracking-wider transition-all hover:bg-brand-teal-hover hover:shadow-sm active:scale-95 cursor-pointer"
              >
                Crear cuenta gratis
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
