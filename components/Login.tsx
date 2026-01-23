
import React, { useState, useEffect } from 'react';
import { Loader2, QrCode, KeyRound } from 'lucide-react';
import { Input } from './ui/Input';

interface LoginProps {
  onLogin: (username: string, pass: string) => Promise<void>;
  initialUsername?: string;
  qrStatusMessage?: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, initialUsername, qrStatusMessage }) => {
  const [username, setUsername] = useState(initialUsername || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialUsername) {
        setUsername(initialUsername);
    }
  }, [initialUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Giriş veya doğrulama başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-100 dark:bg-matrix-900 transition-colors duration-300">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          {/* Logo Container */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white dark:bg-matrix-950 rounded-2xl shadow-xl flex items-center justify-center border border-slate-200 dark:border-matrix-800">
                <QrCode size={40} className="text-matrix-600 dark:text-matrix-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            MatrixC <span className="text-matrix-600 dark:text-matrix-400">Find Me</span>
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm">
             Etiketin üzerindeki QR ID ve PIN ile işlem yapın.
          </p>
        </div>

        {/* Status Message Banner */}
        {qrStatusMessage && (
             <div className="mb-6 bg-matrix-100 dark:bg-matrix-900/50 border border-matrix-200 dark:border-matrix-700 p-4 rounded-xl text-center animate-in slide-in-from-top-2">
                 <p className="text-matrix-800 dark:text-matrix-300 font-medium text-sm">
                     {qrStatusMessage}
                 </p>
             </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="QR Kod ID"
            type="text"
            placeholder="Etiket üzerindeki kod (Örn: MTRX01)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            readOnly={!!initialUsername} 
            className={`bg-white dark:bg-matrix-950 ${initialUsername ? 'opacity-70 cursor-not-allowed bg-slate-50 font-mono font-bold text-center tracking-widest' : ''}`}
          />
          <Input
            label="Güvenlik PIN'i"
            type="password"
            placeholder="****"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white dark:bg-matrix-950 text-center tracking-widest"
            maxLength={6}
            rightElement={<KeyRound size={18} className="text-slate-400" />}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center font-medium animate-in zoom-in-95">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-matrix-600 hover:bg-matrix-500 text-white font-semibold rounded-xl shadow-lg shadow-matrix-900/20 dark:shadow-matrix-900/50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Doğrula ve Devam Et'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-400 dark:text-gray-600">
          Güvenli QR Altyapısı • v2.1.0
        </p>
      </div>
    </div>
  );
};
