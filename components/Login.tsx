
import React, { useState, useEffect } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-slate-50 dark:bg-matrix-950">
      
      {/* Ambient Background Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-matrix-200/50 dark:bg-matrix-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/50 dark:bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        
        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl rounded-3xl p-8">
            
            {/* Header / Logo */}
            <div className="mb-8 text-center flex flex-col items-center">
                <div className="w-24 h-24 mb-4 drop-shadow-lg">
                    <img 
                        src="/logo.png" 
                        alt="MatrixC Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            // Fallback if logo fails
                            const parent = e.currentTarget.parentElement;
                            if(parent) parent.innerHTML = '<div class="w-20 h-20 bg-matrix-100 rounded-2xl flex items-center justify-center text-matrix-600 font-bold">Logo</div>'
                        }}
                    />
                </div>
                
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">
                    MatrixC <span className="text-matrix-600">Find Me</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Güvenli Evcil Hayvan Takip Sistemi
                </p>
            </div>

            {/* Status Message Banner */}
            {qrStatusMessage && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                    <p className="text-blue-800 dark:text-blue-200 font-medium text-sm leading-relaxed">
                        {qrStatusMessage}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="QR Kod ID"
                    type="text"
                    placeholder="Etiket üzerindeki kod (Örn: MTRX01)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    readOnly={!!initialUsername} 
                    className={`font-mono text-center tracking-wider font-bold ${initialUsername ? 'bg-slate-50 text-slate-500 border-slate-200' : ''}`}
                />
                <Input
                    label="Güvenlik PIN'i"
                    type="password"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-center tracking-[0.5em] font-bold text-lg"
                    maxLength={6}
                    rightElement={<KeyRound size={20} className="text-slate-400" />}
                />

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-300 text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-matrix-600 to-matrix-700 hover:from-matrix-500 hover:to-matrix-600 text-white font-bold rounded-xl shadow-lg shadow-matrix-500/30 dark:shadow-matrix-900/50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Sisteme Giriş Yap'}
                </button>
            </form>
        </div>

        <p className="mt-8 text-center text-[11px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-widest opacity-60">
          Secure QR Infrastructure • v2.1.0
        </p>
      </div>
    </div>
  );
};
