
import React, { useEffect, useRef } from 'react';
import { PetProfile, UserProfile } from '../types';
import { Phone, Mail, MapPin, AlertTriangle, User, ShieldCheck, Heart, Navigation, Info, Siren, Users, Calendar } from 'lucide-react';
import { ContactPreference } from '../types';
import L from 'leaflet';

interface FinderViewProps {
  pet: PetProfile;
  owner?: UserProfile;
  onLoginClick: () => void;
}

// Leaflet Icon Setup
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

  const showPhone = owner && (owner.contactPreference === ContactPreference.PHONE || owner.contactPreference === ContactPreference.BOTH);
  const showEmail = owner && (owner.contactPreference === ContactPreference.EMAIL || owner.contactPreference === ContactPreference.BOTH);

  // Initialize Map
  useEffect(() => {
    if (pet.lostStatus?.lastSeenLocation && mapRef.current && !leafletMap.current) {
        const { lat, lng } = pet.lostStatus.lastSeenLocation;
        
        leafletMap.current = L.map(mapRef.current, {
            dragging: true,        // Harita hareket ettirilebilir
            touchZoom: true,       // Dokunarak zoom yapılabilir
            scrollWheelZoom: false, // Sayfa kaydırmayı engellememesi için tekerlek kapalı
            doubleClickZoom: true,
            zoomControl: true,
            attributionControl: false
        }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap.current);
        L.marker([lat, lng]).addTo(leafletMap.current);
    }

    // Cleanup
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

  // Format Date Helper
  const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-12">
      
      {/* 1. HEADER SECTION (Acil Durum Havası) */}
      <div className="w-full">
          {/* Main Title Bar */}
          <div className={`${isLost ? 'bg-red-700' : 'bg-emerald-600'} text-white py-5 px-4 text-center shadow-md relative z-20`}>
              <div className="flex items-center justify-center gap-3">
                  {isLost ? <Siren size={28} className="animate-pulse" /> : <ShieldCheck size={28} />}
                  <h1 className="text-2xl font-black tracking-widest uppercase">
                      {isLost ? 'KAYIP İLANI' : 'GÜVENDE'}
                  </h1>
              </div>
          </div>

          {/* Action Instruction Bar */}
          <div className={`${isLost ? 'bg-red-50 text-red-900 border-b border-red-100' : 'bg-emerald-50 text-emerald-900 border-b border-emerald-100'} py-3 px-6 text-center`}>
              <p className="text-sm font-semibold leading-relaxed">
                  {isLost 
                    ? "Bu evcil hayvan kaybolmuştur. Lütfen aşağıdaki bilgileri inceleyerek sahibine ulaşınız."
                    : "Merhaba, ben güvendeyim. Sadece geziyorum, endişelenmeyin."
                  }
              </p>
          </div>
      </div>

      <div className="max-w-lg mx-auto bg-white">
        
        {/* 2. PHOTO SECTION (Clean & Simple) */}
        <div className="w-full bg-slate-50 border-b border-slate-100">
           {pet.photoUrl.value ? (
               <div className="w-full h-[400px] relative">
                   <img 
                       src={pet.photoUrl.value} 
                       alt={pet.name.value} 
                       className="w-full h-full object-contain p-2" 
                   />
               </div>
           ) : (
               <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                   <User size={64} />
                   <p className="text-sm font-bold mt-2">Fotoğraf Yok</p>
               </div>
           )}
        </div>

        {/* 3. BASIC INFO (Name & Type) */}
        <div className="px-6 py-6 text-center border-b border-slate-100">
            <h2 className="text-4xl font-black text-slate-900 mb-1 uppercase tracking-tight">{pet.name.value}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-bold uppercase tracking-wider">
                {pet.type}
            </div>
            
            {/* Owner Note - Highlighted */}
            {pet.lostStatus?.message && (
                <div className="mt-6 text-left bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Sahibinden Mesaj:</p>
                    <p className="text-slate-800 italic font-medium">"{pet.lostStatus.message}"</p>
                </div>
            )}
        </div>

        {/* 4. DETAILS LIST (Minimalist Grid) */}
        <div className="px-6 py-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={16} /> Fiziksel Özellikler
            </h3>
            
            <div className="grid grid-cols-1 gap-y-4">
                {pet.features?.isPublic && pet.features.value && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500 font-medium">Renk / Özellik</span>
                        <span className="text-sm text-slate-900 font-bold">{pet.features.value}</span>
                    </div>
                )}
                {pet.sizeInfo?.isPublic && pet.sizeInfo.value && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500 font-medium">Boy / Kilo</span>
                        <span className="text-sm text-slate-900 font-bold">{pet.sizeInfo.value}</span>
                    </div>
                )}
                {pet.temperament?.isPublic && pet.temperament.value && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500 font-medium">Huy Bilgisi</span>
                        <span className="text-sm text-slate-900 font-bold">{pet.temperament.value}</span>
                    </div>
                )}
                {pet.healthWarning?.isPublic && pet.healthWarning.value && (
                    <div className="flex justify-between items-start py-3 bg-red-50 px-3 rounded-lg mt-2">
                        <span className="text-sm text-red-600 font-bold flex items-center gap-1">
                            <AlertTriangle size={16} /> Sağlık Uyarısı
                        </span>
                        <span className="text-sm text-red-800 font-bold text-right max-w-[60%]">{pet.healthWarning.value}</span>
                    </div>
                )}
            </div>
        </div>

        {/* 5. INTERACTIVE MAP */}
        {pet.lostStatus?.lastSeenLocation && (
            <div className="w-full h-80 relative z-10 border-t border-b border-slate-200">
                <div ref={mapRef} className="w-full h-full z-0" />
                
                {/* Floating Map Button */}
                <div className="absolute bottom-4 left-4 right-4 z-[400]">
                    <button 
                        onClick={openMaps}
                        className="w-full bg-slate-900/90 backdrop-blur text-white py-3 px-4 rounded-xl shadow-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                        <Navigation size={18} />
                        Google Haritalar'da Aç
                    </button>
                </div>
                
                <div className="absolute top-4 left-4 z-[400] bg-white/90 px-3 py-1 rounded-md shadow-sm border border-slate-200">
                     <p className="text-xs font-bold text-slate-600">Son Görülen Konum</p>
                     <p className="text-[10px] text-slate-400">{formatDate(pet.lostStatus.lostDate)}</p>
                </div>
            </div>
        )}

        {/* 6. CONTACT ACTIONS (Fixed Bottom or Inline) */}
        <div className="p-6 space-y-4 bg-slate-50">
            <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">İletişim Bilgileri</h3>
            
            {owner?.phone && showPhone && (
                <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-3 w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 active:scale-95 transition-all">
                    <Phone size={24} />
                    Sahibini Ara
                </a>
            )}
            
            {(!showPhone || showEmail) && owner?.email && (
                 <a href={`mailto:${owner.email}`} className="flex items-center justify-center gap-3 w-full bg-white text-slate-800 border-2 border-slate-200 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 active:scale-95 transition-all">
                    <Mail size={22} className="text-slate-500" />
                    E-posta Gönder
                </a>
            )}

            {/* Emergency Contact */}
            {owner?.emergencyContactName && (owner.emergencyContactPhone || owner.emergencyContactEmail) && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-3 justify-center text-slate-500">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase">Acil Durum Kişisi (Yedek)</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-900">{owner.emergencyContactName}</p>
                            <p className="text-xs text-slate-400">2. Şahıs</p>
                        </div>
                        <div className="flex gap-2">
                             {owner.emergencyContactPhone && (
                                <a href={`tel:${owner.emergencyContactPhone}`} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                                    <Phone size={18} />
                                </a>
                             )}
                             {owner.emergencyContactEmail && (
                                <a href={`mailto:${owner.emergencyContactEmail}`} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                                    <Mail size={18} />
                                </a>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 pb-8 text-center">
            <button onClick={onLoginClick} className="text-xs text-slate-400 font-bold underline uppercase">
                Yönetici Girişi
            </button>
        </div>

      </div>
    </div>
  );
};
