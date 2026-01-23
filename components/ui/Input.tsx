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
        <label className="block text-sm font-medium text-slate-700 dark:text-matrix-100 mb-1">
          {label} {props.required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full bg-white dark:bg-matrix-950 border border-slate-300 dark:border-gray-700 
            text-slate-900 dark:text-white text-base rounded-lg 
            focus:ring-2 focus:ring-matrix-500 focus:border-matrix-500 block p-3 
            disabled:opacity-50 disabled:cursor-not-allowed
            placeholder-slate-400 dark:placeholder-gray-600
            transition-colors duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};