
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mask?: string;
  // Added icon prop to support search icons and other visual decorators in input fields
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>}
      <div className="relative">
        {/* Render the icon inside the input if provided */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-zinc-400">
            {icon}
          </div>
        )}
        <input 
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2 bg-white border rounded-lg text-zinc-900 text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 ${
            error ? 'border-red-500' : 'border-zinc-200'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default Input;
