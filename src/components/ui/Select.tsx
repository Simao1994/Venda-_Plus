
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  options?: { value: string | number; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, error, icon, className, children, options, ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 italic flex items-center gap-2">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-gold-primary/40 group-focus-within:text-gold-primary transition-colors">
            {icon}
          </div>
        )}
        <select
          className={`w-full ${icon ? 'pl-12' : 'px-6'} py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-gold-primary/20 focus:border-gold-primary/40 appearance-none cursor-pointer ${error ? 'border-red-500/50 focus:ring-red-500/10 focus:border-red-500/30' : ''
            } ${className}`}
          {...props}
        >
          {children || (options && options.map((opt, idx) => (
            <option key={idx} value={opt.value} className="bg-bg-deep text-white">
              {opt.label}
            </option>
          )))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gold-primary/[0.01] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
      </div>
      {error && <span className="text-[10px] font-black text-red-500/60 uppercase tracking-widest ml-1 italic">{error}</span>}
    </div>
  );
};

export default Select;
