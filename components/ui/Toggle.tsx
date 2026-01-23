import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PrivacyToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  label?: string;
}

export const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ isPublic, onChange, label }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!isPublic)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
        ${isPublic 
          ? 'bg-matrix-100 border-matrix-200 text-matrix-700 dark:bg-matrix-900/50 dark:border-matrix-500 dark:text-matrix-400' 
          : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}
      `}
    >
      {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
      {label || (isPublic ? 'Herkese Açık' : 'Gizli')}
    </button>
  );
};