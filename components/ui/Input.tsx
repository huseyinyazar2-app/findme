
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, rightElement, className, ...props }) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-xs font-bold text-slate-600 dark:text-matrix-200 mb-1.5 uppercase tracking-wide ml-1">
          {label} {props.required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
      )}
      <div className="relative group">
        <input
          className={`
            w-full bg-white dark:bg-slate-900/50 
            border border-slate-300 dark:border-slate-700
            text-slate-900 dark:text-white text-base rounded-xl
            focus:ring-[3px] focus:ring-matrix-100 dark:focus:ring-matrix-900/50 
            focus:border-matrix-500 dark:focus:border-matrix-400
            block p-3.5 shadow-sm
            disabled:opacity-60 disabled:cursor-not-allowed
            placeholder-slate-400 dark:placeholder-slate-500
            transition-all duration-200
            hover:border-slate-400 dark:hover:border-slate-600
            ${error ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500 dark:text-red-400 animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
};
