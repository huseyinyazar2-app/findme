
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
      {/* pb-28: Alt boşluğu artırarak kartın yazıların üzerine binmesini engelliyoruz */}
      <div className={`
          relative w-full pt-12 pb-28 px-4 text-center rounded-b-[3rem] shadow-2xl z-10 overflow-hidden
          ${isLost ? 'bg-gradient-to-b from-red-600 via-red-700 to-rose-800' : 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700'}
      `}>
         {/* Background Pattern */}
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute top-20 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

         <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-top duration-700">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md animate-pulse mb-4 shadow-lg border border-white/30">
                {isLost ? <Siren size={32} className="text-white drop-shadow-md" /> : <Heart size={32} className="text-white drop-shadow-md" />}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-widest leading-none mb-3 text-white drop-shadow-lg">
                {isLost ? 'Kayıp İlanı' : 'Güvendeyim'}
            </h1>
            <div className={`
                px-5 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg
                ${isLost ? 'bg-red-900/30' : 'bg-emerald-900/30'}
            `}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/90">
                    {isLost ? 'Sahibine Ulaşılmalı!' : 'Merhaba, sadece geziyorum.'}
                </p>
            </div>
         </div>
      </div>

      {/* 2. CARD CONTAINER */}
      {/* -mt-20: Kartı yukarı çekerek header ile birleştiriyoruz */}
      <div className="px-4 -mt-20 relative z-20 max-w-md mx-auto space-y-6">
        
        {/* PET IDENTITY CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-white dark:border-slate-700 animate-in slide-in-from-bottom-8 duration-700">
           
           {/* IMAGE CONTAINER */}
           {/* aspect-square: Kare format yaparak gereksiz uzunluğu engelliyoruz */}
           {pet.photoUrl.value ? (
               <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden group">
                   
                   {/* Blurred Background (Fill) */}
                   <div className="absolute inset-0">
                        <img 
                            src={pet.photoUrl.value} 
                            alt="Background Blur"
                            className="w-full h-full object-cover blur-3xl opacity-50 scale-125 dark:opacity-40"
                        />
                   </div>

                   {/* Main Image (Contain) */}
                   <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                        <img 
                            src={pet.photoUrl.value} 
                            alt={pet.name.value} 
                            className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                        />
                   </div>
                   
                   {/* Gradient Overlay at Bottom */}
                   <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 z-20"></div>
               </div>
           ) : (
               <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                   <User size={80} />
                   <p className="font-bold mt-2 text-sm uppercase tracking-wide">Fotoğraf Yok</p>
               </div>
           )}

           {/* INFO HEADER (Overlapping Image) */}
           <div className="relative z-30 -mt-10 text-center px-6 pb-6">
                <div className="inline-block px-6 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black uppercase tracking-widest shadow-lg mb-3 border-2 border-white dark:border-slate-800">
                    {pet.type}
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    {pet.name.value}
                </h2>
           </div>
        </div>

        {/* 3. OWNER MESSAGE */}
        {pet.lostStatus?.message && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
                <div className="flex items-center gap-2 mb-2">
                    <Info size={16} className="text-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Sahibinden Not</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium text-base leading-relaxed italic">
                    "{pet.lostStatus.message}"
                </p>
            </div>
        )}

        {/* 4. PUBLIC INFORMATION GRID */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2 text-lg">
                    <ShieldCheck className="text-matrix-600 dark:text-matrix-400" size={22} />
                    Kimlik Bilgileri
                </h3>
             </div>
             
             <div className="space-y-3">
                 {/* Feature Row 1 */}
                 <div className="grid grid-cols-2 gap-3">
                    {pet.features?.isPublic && pet.features.value && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700/50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Renk / Özellik</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight block">{pet.features.value}</span>
                        </div>
                    )}
                    {pet.sizeInfo?.isPublic && pet.sizeInfo.value && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700/50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Boy / Kilo</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight block">{pet.sizeInfo.value}</span>
                        </div>
                    )}
                 </div>

                 {/* Feature Row 2 */}
                 {pet.temperament?.isPublic && pet.temperament.value && (
                     <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl flex items-center gap-4 border border-blue-100 dark:border-blue-900/20">
                         <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-full text-blue-600 dark:text-blue-400">
                             <Info size={18} />
                         </div>
                         <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Huy Bilgisi</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{pet.temperament.value}</span>
                         </div>
                     </div>
                 )}

                 {/* Health Warning (Emphasis) */}
                 {pet.healthWarning?.isPublic && pet.healthWarning.value && (
                     <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/20 flex items-start gap-4">
                         <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                         </div>
                         <div>
                             <span className="text-xs font-bold text-red-500 block mb-1 uppercase">Sağlık Uyarısı!</span>
                             <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{pet.healthWarning.value}</span>
                         </div>
                     </div>
                 )}

                 {/* Vet Info */}
                 {pet.vetInfo?.isPublic && pet.vetInfo.value && (
                     <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/20 flex justify-between items-center">
                         <div>
                            <span className="text-[10px] uppercase font-bold text-green-600/70 dark:text-green-400/70 block">Veteriner</span>
                            <span className="text-sm font-bold text-green-800 dark:text-green-200">{pet.vetInfo.value}</span>
                         </div>
                         <div className="bg-white/60 dark:bg-black/20 p-2 rounded-full">
                             <ShieldCheck size={20} className="text-green-600 dark:text-green-400" />
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* 5. LOCATION MAP (If Available) */}
        {pet.lostStatus?.lastSeenLocation && (
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-1.5 shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="relative h-64 w-full rounded-[1.5rem] overflow-hidden bg-slate-100">
                     <div ref={mapRef} className="w-full h-full z-0" />
                     {/* Overlay Button */}
                     <button 
                        onClick={openMaps}
                        className="absolute bottom-4 right-4 z-10 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
                     >
                        <Navigation size={14} className="text-white" />
                        Yol Tarifi Al
                     </button>
                     {/* Label */}
                     <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center gap-1.5">
                             <MapPin size={14} className="text-red-500" />
                             <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Son Görülen Konum</span>
                         </div>
                     </div>
                </div>
            </div>
        )}

        {/* 6. PRIMARY CONTACT ACTIONS */}
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1"></div>
                <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">İletişim</p>
                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1"></div>
            </div>
            
            {owner?.phone && showPhone && (
                <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-3 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 dark:shadow-white/5 transition-all active:scale-95 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <Phone size={24} className="text-green-400 dark:text-green-600 group-hover:animate-pulse relative z-10" />
                    <span className="relative z-10">Sahibini Ara</span>
                </a>
            )}
            
            {(!showPhone || showEmail) && owner?.email && (
                 <a href={`mailto:${owner.email}`} className="flex items-center justify-center gap-3 w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-600 py-4 rounded-2xl font-bold text-lg shadow-sm transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-600">
                    <Mail size={22} className="text-slate-500 dark:text-slate-400" />
                    <span>E-posta Gönder</span>
                </a>
            )}
        </div>

        {/* 7. EMERGENCY CONTACT (If Available) */}
        {owner?.emergencyContactName && (owner.emergencyContactPhone || owner.emergencyContactEmail) && (
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 pb-4">
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-900/30">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                             <Users size={18} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">Acil Durum Kişisi (2. Şahıs)</h4>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-lg">{owner.emergencyContactName}</p>
                            <p className="text-xs text-slate-500 font-medium">Sahibine ulaşılamazsa aranabilir.</p>
                        </div>
                        
                        <div className="flex gap-3">
                            {owner.emergencyContactPhone && (
                                <a href={`tel:${owner.emergencyContactPhone.replace(/\s/g, '')}`} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-green-500 hover:text-white dark:hover:bg-green-600 hover:border-green-500 transition-all">
                                    <Phone size={20} />
                                </a>
                            )}
                            {owner.emergencyContactEmail && (
                                <a href={`mailto:${owner.emergencyContactEmail}`} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 hover:border-blue-500 transition-all">
                                    <Mail size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 text-center pb-8">
            <button onClick={onLoginClick} className="text-xs text-slate-400 dark:text-slate-600 font-bold underline hover:text-slate-600 dark:hover:text-slate-400 transition-colors uppercase tracking-wider">
                Yönetici Girişi
            </button>
        </div>
      </div>
    </div>
  );
};
