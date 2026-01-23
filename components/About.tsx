import React from 'react';
import { QrCode, Siren, ShieldCheck, HeartHandshake, ChevronRight, Share2 } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-matrix-100 dark:bg-matrix-900/50 rounded-full flex items-center justify-center text-matrix-600 dark:text-matrix-400">
          <InfoIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
              Hakkında
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">v2.0.0 • MatrixC Project</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-matrix-600 to-matrix-800 rounded-2xl p-6 text-white shadow-lg shadow-matrix-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">MatrixC Find Me</h3>
            <p className="text-matrix-100 text-sm leading-relaxed opacity-90">
              Bu uygulama, can dostlarımızın güvenliği için geliştirilmiş, gönüllülük esasına dayalı ücretsiz bir sosyal sorumluluk projesidir.
            </p>
          </div>
          <HeartHandshake className="absolute -bottom-4 -right-4 text-white opacity-10" size={120} />
        </div>

        {/* How it Works Section */}
        <div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
             <Share2 size={16} className="text-matrix-500" /> Nasıl Çalışır?
           </h3>
           
           <div className="space-y-3">
              {/* Step 1 */}
              <div className="bg-white dark:bg-dark-surface/50 p-4 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm flex gap-4 items-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full shrink-0 text-slate-600 dark:text-gray-300">
                      <QrCode size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">1. Eşleştirme ve Kayıt</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Sizin için özel üretilen QR kod okutulur ve uygulama açılır. Dostumuzun fotoğrafı, kimlik bilgileri ve iletişim tercihleri sisteme kaydedilir.
                      </p>
                  </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-dark-surface/50 p-4 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm flex gap-4 items-start">
                  <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-full shrink-0 text-red-500">
                      <Siren size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">2. Acil Durum Modu</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Olası bir kayıp durumunda "Kayıp" modunu açarsınız. Sistem anında bölgedeki gönüllüleri uyarır ve dostumuzu kayıp listesine ekler.
                      </p>
                  </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-dark-surface/50 p-4 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm flex gap-4 items-start">
                  <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded-full shrink-0 text-green-600 dark:text-green-400">
                      <ShieldCheck size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">3. Güvenli Kavuşma</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Dostumuzu bulan kişi tasmadaki QR kodu okutur. Sadece sizin izin verdiğiniz "Herkese Açık" bilgileri görerek size güvenle ulaşır.
                      </p>
                  </div>
              </div>
           </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-6 pb-2">
            <p className="text-xs text-slate-400 dark:text-gray-600">
                MatrixC Software Solutions &copy; 2024
            </p>
            <p className="text-[10px] text-slate-300 dark:text-gray-700 mt-1">
                Sevgiyle kodlandı.
            </p>
        </div>

      </div>
    </div>
  );
};

// Helper icon component locally to avoid import errors if Info is used elsewhere
const InfoIcon = ({ size }: { size: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
    </svg>
);
