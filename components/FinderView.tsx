
import React, { useEffect, useRef } from 'react';
import { PetProfile, UserProfile } from '../types';
import { Phone, Mail, MapPin, AlertTriangle, User, ShieldCheck, Heart, Navigation, Info, ExternalLink, Siren, Users } from 'lucide-react';
import { ContactPreference } from '../types';
import L from 'leaflet';

interface FinderViewProps {
  pet: PetProfile;
  owner?: UserProfile;
  onLoginClick: () => void;
}

// Leaflet Icon Setup (Same as LostMode to ensure markers load)
const setupLeafletIcons = () => {
    try {
      const markerPrototype = L.Marker.prototype as any;
      delete markerPrototype._getIconUrl;
      
      L.Marker.prototype.options.icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
      });
    } catch (e) {
      console.warn("Leaflet icon setup warning", e);
    }
  };
  
setupLeafletIcons();

export const FinderView: React.FC<FinderViewProps> = ({ pet, owner, onLoginClick }) => {
  const isLost = pet.lostStatus?.isActive;
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  // Determine owner contact based on preference
  const showPhone = owner && (owner.contactPreference === ContactPreference.PHONE || owner.contactPreference === ContactPreference.BOTH);
  const showEmail = owner && (owner.contactPreference === ContactPreference.EMAIL || owner.contactPreference === ContactPreference.BOTH);

  // Initialize Map if location exists
  useEffect(() => {
    if (pet.lostStatus?.lastSeenLocation && mapRef.current && !leafletMap.current) {
        const { lat, lng } = pet.lostStatus.lastSeenLocation;
        
        leafletMap.current = L.map(mapRef.current, {
            dragging: false, // Static map behavior
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap.current);
        L.marker([lat, lng]).addTo(leafletMap.current);
    }

    return () => {
        if (leafletMap.current) {
            leafletMap.current.remove();
            leafletMap.current = null;
        }
    };
  }, [pet.lostStatus?.lastSeenLocation]);

  const openMaps = () => {
      if (pet.lostStatus?.lastSeenLocation) {
          const { lat, lng } = pet.lostStatus.lastSeenLocation;
          window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      
      {/* 1. ALERT HEADER */}
      <div className={`
          p-6 pt-10 text-center rounded-b-[2.5rem] shadow-xl relative z-10 overflow-hidden
          ${isLost ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}
      `}>
         {/* Background Pattern */}
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse mb-3 shadow-lg">
                {isLost ? <Siren size={32} className="text-white" /> : <Heart size={32} className="text-white" />}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-widest leading-none mb-2">
                {isLost ? 'Kayıp İlanı' : 'Güvendeyim'}
            </h1>
            <p className={`text-sm font-medium px-4 py-1 rounded-full ${isLost ? 'bg-red-700 text-red-100' : 'bg-green-700 text-green-100'}`}>
                {isLost ? 'Sahibine Ulaşılmalı!' : 'Merhaba, sadece geziyorum.'}
            </p>
         </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 max-w-lg mx-auto space-y-6">
        
        {/* 2. PET PHOTO & IDENTITY CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-3 shadow-xl border border-slate-100 dark:border-slate-700">
           {pet.photoUrl.value ? (
               <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                   <img src={pet.photoUrl.value} alt={pet.name.value} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" />
                   {/* Name Overlay */}
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                        <h2 className="text-3xl font-bold text-white leading-none">{pet.name.value}</h2>
                        <p className="text-slate-200 text-sm font-medium mt-1">{pet.type}</p>
                   </div>
               </div>
           ) : (
               <div className="aspect-square w-full rounded-2xl bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-400">
                   <User size={64} />
                   <p>Fotoğraf Yok</p>
               </div>
           )}
        </div>

        {/* 3. OWNER MESSAGE */}
        {pet.lostStatus?.message && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-600 p-5 rounded-r-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-300">Sahibinden Not</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed">
                    "{pet.lostStatus.message}"
                </p>
            </div>
        )}

        {/* 4. PUBLIC INFORMATION GRID */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                 <ShieldCheck className="text-matrix-500" size={20} />
                 Kimlik Bilgileri
             </h3>
             
             <div className="space-y-3">
                 {/* Feature Row 1 */}
                 <div className="grid grid-cols-2 gap-3">
                    {pet.features?.isPublic && pet.features.value && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Renk / Özellik</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight block">{pet.features.value}</span>
                        </div>
                    )}
                    {pet.sizeInfo?.isPublic && pet.sizeInfo.value && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Boy / Kilo</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight block">{pet.sizeInfo.value}</span>
                        </div>
                    )}
                 </div>

                 {/* Feature Row 2 */}
                 {pet.temperament?.isPublic && pet.temperament.value && (
                     <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl flex items-center gap-3">
                         <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
                             <Info size={16} />
                         </div>
                         <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Huy Bilgisi</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pet.temperament.value}</span>
                         </div>
                     </div>
                 )}

                 {/* Health Warning (Emphasis) */}
                 {pet.healthWarning?.isPublic && pet.healthWarning.value && (
                     <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                         <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                         <div>
                             <span className="text-xs font-bold text-red-400 block mb-1 uppercase">Sağlık Uyarısı!</span>
                             <span className="text-sm font-bold text-red-700 dark:text-red-300">{pet.healthWarning.value}</span>
                         </div>
                     </div>
                 )}

                 {/* Vet Info */}
                 {pet.vetInfo?.isPublic && pet.vetInfo.value && (
                     <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30 flex justify-between items-center">
                         <div>
                            <span className="text-[10px] uppercase font-bold text-green-600/70 dark:text-green-400/70 block">Veteriner</span>
                            <span className="text-sm font-semibold text-green-800 dark:text-green-200">{pet.vetInfo.value}</span>
                         </div>
                         <div className="bg-white/50 dark:bg-black/20 p-2 rounded-full">
                             <ShieldCheck size={18} className="text-green-600 dark:text-green-400" />
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* 5. LOCATION MAP (If Available) */}
        {pet.lostStatus?.lastSeenLocation && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100">
                     <div ref={mapRef} className="w-full h-full z-0" />
                     {/* Overlay Button */}
                     <button 
                        onClick={openMaps}
                        className="absolute bottom-3 right-3 z-10 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                     >
                        <Navigation size={14} className="text-blue-500" />
                        Yol Tarifi Al
                     </button>
                     {/* Label */}
                     <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center gap-1.5">
                             <MapPin size={12} className="text-red-500" />
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Son Görülen Konum</span>
                         </div>
                     </div>
                </div>
            </div>
        )}

        {/* 6. PRIMARY CONTACT ACTIONS */}
        <div className="space-y-3 pt-2">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">İletişim Seçenekleri</p>
            
            {owner?.phone && showPhone && (
                <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-3 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-95 group">
                    <Phone size={24} className="text-green-400 dark:text-green-600 group-hover:animate-pulse" />
                    <span>Sahibini Ara</span>
                </a>
            )}
            
            {(!showPhone || showEmail) && owner?.email && (
                 <a href={`mailto:${owner.email}`} className="flex items-center justify-center gap-3 w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 py-4 rounded-2xl font-bold shadow-sm transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-600">
                    <Mail size={22} className="text-slate-500 dark:text-slate-400" />
                    <span>E-posta Gönder</span>
                </a>
            )}
        </div>

        {/* 7. EMERGENCY CONTACT (If Available) */}
        {owner?.emergencyContactName && (owner.emergencyContactPhone || owner.emergencyContactEmail) && (
            <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={18} className="text-orange-500" />
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Acil Durum Kişisi (2. Şahıs)</h4>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{owner.emergencyContactName}</p>
                            <p className="text-xs text-slate-500">Alternatif İletişim</p>
                        </div>
                        
                        <div className="flex gap-2">
                            {owner.emergencyContactPhone && (
                                <a href={`tel:${owner.emergencyContactPhone.replace(/\s/g, '')}`} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-colors">
                                    <Phone size={18} />
                                </a>
                            )}
                            {owner.emergencyContactEmail && (
                                <a href={`mailto:${owner.emergencyContactEmail}`} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors">
                                    <Mail size={18} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* FOOTER */}
        <div className="mt-12 text-center pb-8">
            <button onClick={onLoginClick} className="text-xs text-slate-400 dark:text-slate-600 font-medium underline hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                Sahibi misiniz? Yönetici Girişi
            </button>
        </div>
      </div>
    </div>
  );
};
