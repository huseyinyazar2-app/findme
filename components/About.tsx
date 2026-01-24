
import React from 'react';
import { QrCode, Siren, ShieldCheck, HeartHandshake, Share2, Info } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="pb-32 pt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 px-1">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 text-matrix-600 dark:text-matrix-400">
          <Info size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Hakkında
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wide">v2.1.0 • MatrixC Project</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-matrix-600 to-matrix-800 rounded-3xl p-8 text-white shadow-xl shadow-matrix-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-3 tracking-tight">MatrixC Find Me</h3>
            <p className="text-matrix-50 text-sm leading-relaxed font-medium opacity-90">
              Bu uygulama, can dostlarımızın güvenliği için geliştirilmiş, gönüllülük esasına dayalı ücretsiz bir sosyal sorumluluk projesidir. Amacımız, kayıp dostlarımızı sahiplerine en hızlı şekilde ulaştırmaktır.
            </p>
          </div>
          <HeartHandshake className="absolute -bottom-6 -right-6 text-white opacity-10 rotate-12" size={160} />
        </div>

        {/* How it Works Section */}
        <div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider px-1">
             <Share2 size={16} className="text-matrix-600" /> Nasıl Çalışır?
           </h3>
           
           <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl shrink-0 text-slate-600 dark:text-slate-300">
                      <QrCode size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">1. Eşleştirme ve Kayıt</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">
                          Sizin için özel üretilen QR kod okutulur. Dostumuzun fotoğrafı, kimlik bilgileri ve iletişim tercihleri sisteme güvenle kaydedilir.
                      </p>
                  </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl shrink-0 text-red-600 dark:text-red-400">
                      <Siren size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">2. Acil Durum Modu</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">
                          Olası bir kayıp durumunda "Kayıp" modunu açarsınız. QR kod tarandığında anında kırmızı alarm ekranı ve iletişim butonları belirir.
                      </p>
                  </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl shrink-0 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">3. Güvenli Kavuşma</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed font-medium">
                          Dostumuzu bulan kişi QR kodu okutur. Sadece sizin izin verdiğiniz "Herkese Açık" bilgileri görerek size doğrudan ulaşır.
                      </p>
                  </div>
              </div>
           </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-8 pb-4">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                MatrixC Software Solutions &copy; 2024
            </p>
        </div>

      </div>
    </div>
  );
};
