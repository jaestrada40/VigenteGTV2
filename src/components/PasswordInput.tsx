import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  compact?: boolean;
}

export default function PasswordInput({ label, value, onChange, autoComplete, placeholder, minLength, compact = false }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return <label className={`block font-bold text-slate-600 ${compact ? 'text-xs' : 'text-[10px] font-mono uppercase'}`}>
    {label}
    <div className="relative mt-2">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-11 text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/30"
      />
      <button
        type="button"
        onClick={() => setVisible(previous => !previous)}
        aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </label>;
}
