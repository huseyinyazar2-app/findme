
import React from 'react';
import { PetProfile, UserProfile } from '../types';
import { Phone, Mail, MapPin, AlertTriangle, User, ShieldCheck, Heart } from 'lucide-react';
import { ContactPreference } from '../types';

interface FinderViewProps {
  pet: PetProfile;
  owner?: UserProfile; // We might fetch basic owner info (phone/email) to display
  onLoginClick: () => void;
}

export const FinderView: React.FC<FinderViewProps> = ({ pet, owner, onLoginClick }) => {
  const isLost = pet.lostStatus?.isActive;

  // Determine owner contact based on preference
  const showPhone = owner && (owner.contactPreference === ContactPreference.PHONE || owner.contactPreference === ContactPreference.BOTH);
  const showEmail = owner && (owner.contactPreference === ContactPreference.EMAIL || owner.contactPreference === ContactPreference.BOTH);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      {/* Alert Header */}
      <div className="bg-red-600 text-white p-4 pt-8 text-center rounded-b-3xl shadow-lg relative z-10">
        <div className="flex justify-center mb-2">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
               <AlertTriangle size={32} className="text-white" />
           </div>
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-widest">Kayıp İlanı</h1>
        <p className="text-red-100 text-sm mt-1">Lütfen sahibine ulaşın!</p>
      </div>

      <div className="px-4 -mt-6 relative z-20">
        {/* Photo Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-2 shadow-xl border border-slate-100 dark:border-slate-700">
           {pet.photoUrl.value ? (
               <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                   <img src={pet.photoUrl.value} alt={pet.name.value} className="w-full h-full object-cover" />
               </div>
           ) : (
               <div className="aspect-square w-full rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                   <User size={48} className="text-slate-400" />
               </div>
           )}
           
           <div className="text-center mt-4 mb-2">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white">{pet.name.value}</h2>
               <p className="text-slate-500 dark:text-slate-400 font-medium">{pet.type}</p>
           </div>
        </div>

        {/* Message from Owner */}
        {pet.lostStatus?.message && (
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-5 rounded-2xl relative">
                <div className="absolute -top-3 left-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    Sahibinden Not
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed">
                    "{pet.lostStatus.message}"
                </p>
            </div>
        )}

        {/* Pet Details (Public Only) */}
        <div className="mt-6 space-y-3">
             <h3 className="text-slate-900 dark:text-white font-bold px-2">Özellikler</h3>
             <div className="grid grid-cols-2 gap-3">
                 {pet.features?.isPublic && pet.features.value && (
                     <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                         <span className="text-xs text-slate-400 block mb-1">Renk / Desen</span>
                         <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pet.features.value}</span>
                     </div>
                 )}
                 {pet.temperament?.isPublic && pet.temperament.value && (
                     <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                         <span className="text-xs text-slate-400 block mb-1">Huy</span>
                         <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pet.temperament.value}</span>
                     </div>
                 )}
                 {pet.healthWarning?.isPublic && pet.healthWarning.value && (
                     <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 col-span-2">
                         <span className="text-xs text-red-400 block mb-1">Sağlık Uyarısı!</span>
                         <span className="text-sm font-semibold text-red-700 dark:text-red-300">{pet.healthWarning.value}</span>
                     </div>
                 )}
                  {pet.vetInfo?.isPublic && pet.vetInfo.value && (
                     <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 col-span-2 flex justify-between items-center">
                         <div>
                            <span className="text-xs text-slate-400 block mb-1">Veteriner</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pet.vetInfo.value}</span>
                         </div>
                         <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full">
                             <ShieldCheck size={18} className="text-matrix-600 dark:text-matrix-400" />
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* Contact Actions */}
        <div className="mt-8 space-y-3">
            {owner?.phone && showPhone && (
                <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95">
                    <Phone size={24} className="animate-pulse" />
                    Sahibini Ara
                </a>
            )}
            
            {/* If phone isn't available or preferred, show Email */}
            {(!showPhone || showEmail) && owner?.email && (
                 <a href={`mailto:${owner.email}`} className="flex items-center justify-center gap-3 w-full bg-slate-800 dark:bg-slate-700 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95">
                    <Mail size={22} />
                    E-posta Gönder
                </a>
            )}
        </div>

        {/* Not Lost but Scanned? */}
        {!isLost && (
            <div className="mt-8 text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <Heart size={40} className="text-green-500 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Ben Güvendeyim!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                    Merhaba, ben kayıp değilim. Sadece oyun oynuyoruz veya gezintiye çıktık.
                    İlgin için teşekkür ederim!
                </p>
            </div>
        )}

        <div className="mt-12 text-center">
            <button onClick={onLoginClick} className="text-xs text-slate-400 dark:text-slate-600 font-medium underline">
                Sahibi misiniz? Giriş Yapın
            </button>
        </div>
      </div>
    </div>
  );
};
