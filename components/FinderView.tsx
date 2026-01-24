
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
            dragging: true,        
            touchZoom: true,       
            scrollWheelZoom: false,
            doubleClickZoom: true,
            zoomControl: true,
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

  const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-12">
      
      {/* 1. HEADER SECTION */}
      <div className="w-full">
          <div className={`${isLost ? 'bg-red-700' : 'bg-emerald-600'} text-white py-4 px-4 text-center shadow-md relative z-20`}>
              <div className="flex items-center justify-center gap-2">
                  {isLost ? <Siren size={24} className="animate-pulse" /> : <ShieldCheck size={24} />}
                  <h1 className="text-xl font-black tracking-widest uppercase">
                      {isLost ? 'KAYIP İLANI' : 'GÜVENDE'}
                  </h1>
              </div>
          </div>

          <div className={`${isLost ? 'bg-red-50 text-red-900 border-b border-red-100' : 'bg-emerald-50 text-emerald-900 border-b border-emerald-100'} py-2 px-4 text-center`}>
              <p className="text-xs font-semibold leading-relaxed">
                  {isLost 
                    ? "Kayıp evcil hayvan. Lütfen sahibine ulaşın."
                    : "Merhaba, ben güvendeyim. Sadece geziyorum."
                  }
              </p>
          </div>
      </div>

      <div className="max-w-lg mx-auto bg-white shadow-sm">
        
        {/* 2. COMPACT HERO SECTION (Image + Overlay Name) */}
        <div className="relative w-full h-96 bg-slate-100 overflow-hidden group">
            {pet.photoUrl.value ? (
                <>
                    {/* Blurred Background to fill space */}
                    <div className="absolute inset-0">
                        <img src={pet.photoUrl.value} className="w-full h-full object-cover blur-xl opacity-50 scale-110" alt="" />
                    </div>
                    {/* Main Image */}
                    <img 
                        src={pet.photoUrl.value} 
                        alt={pet.name.value} 
                        className="relative z-10 w-full h-full object-contain" 
                    />
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                    <User size={64} />
                    <p className="text-sm font-bold mt-2">Fotoğraf Yok</p>
                </div>
            )}

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20"></div>

            {/* Text Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-30 text-white">
                 <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tight leading-none shadow-black drop-shadow-md mb-1">
                            {pet.name.value}
                        </h2>
                        <span className="inline-block px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-wider">
                            {pet.type}
                        </span>
                    </div>
                 </div>
            </div>
        </div>

        {/* 3. OWNER NOTE (Immediately Below) */}
        {pet.lostStatus?.message && (
            <div className="bg-yellow-50 border-b border-yellow-100 p-5">
                <div className="flex items-start gap-3">
                    <Info className="text-yellow-600 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Sahibinden Mesaj</p>
                        <p className="text-slate-800 font-medium italic leading-relaxed">"{pet.lostStatus.message}"</p>
                    </div>
                </div>
            </div>
        )}

        {/* 4. DETAILS LIST */}
        <div className="px-6 py-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                Kimlik Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 gap-y-3">
                {pet.features?.isPublic && pet.features.value && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Renk / Özellik</span>
                        <span className="text-slate-900 font-bold">{pet.features.value}</span>
                    </div>
                )}
                {pet.sizeInfo?.isPublic && pet.sizeInfo.value && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Boy / Kilo</span>
                        <span className="text-slate-900 font-bold">{pet.sizeInfo.value}</span>
                    </div>
                )}
                {pet.temperament?.isPublic && pet.temperament.value && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Huy Bilgisi</span>
                        <span className="text-slate-900 font-bold">{pet.temperament.value}</span>
                    </div>
                )}
                {pet.healthWarning?.isPublic && pet.healthWarning.value && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="block text-xs font-bold text-red-600 uppercase mb-0.5">Sağlık Uyarısı</span>
                            <span className="block text-sm font-bold text-red-900 leading-tight">{pet.healthWarning.value}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 5. INTERACTIVE MAP */}
        {pet.lostStatus?.lastSeenLocation && (
            <div className="w-full h-72 relative z-10 border-t border-b border-slate-200 mt-2">
                <div ref={mapRef} className="w-full h-full z-0" />
                
                {/* Floating Map Button */}
                <div className="absolute bottom-4 left-4 right-4 z-[400]">
                    <button 
                        onClick={openMaps}
                        className="w-full bg-slate-900/90 backdrop-blur text-white py-3 px-4 rounded-xl shadow-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                        <Navigation size={18} />
                        Yol Tarifi Al
                    </button>
                </div>
                
                <div className="absolute top-4 left-4 z-[400] bg-white/90 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                     <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <MapPin size={12} className="text-red-500" /> Son Konum
                     </p>
                     <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(pet.lostStatus.lostDate)}</p>
                </div>
            </div>
        )}

        {/* 6. CONTACT ACTIONS */}
        <div className="p-6 space-y-3 bg-slate-50">
            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">İletişim</h3>
            
            {owner?.phone && showPhone && (
                <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-3 w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 active:scale-95 transition-all">
                    <Phone size={24} />
                    Sahibini Ara
                </a>
            )}
            
            {(!showPhone || showEmail) && owner?.email && (
                 <a href={`mailto:${owner.email}`} className="flex items-center justify-center gap-3 w-full bg-white text-slate-800 border-2 border-slate-200 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 active:scale-95 transition-all">
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
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="font-bold text-slate-900 text-sm">{owner.emergencyContactName}</p>
                            <p className="text-[10px] text-slate-400">2. Şahıs</p>
                        </div>
                        <div className="flex gap-2">
                             {owner.emergencyContactPhone && (
                                <a href={`tel:${owner.emergencyContactPhone}`} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-green-100 hover:text-green-600 transition-colors">
                                    <Phone size={18} />
                                </a>
                             )}
                             {owner.emergencyContactEmail && (
                                <a href={`mailto:${owner.emergencyContactEmail}`} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                    <Mail size={18} />
                                </a>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 pb-8 text-center border-t border-slate-200/50 pt-4">
            <button onClick={onLoginClick} className="text-xs text-slate-400 font-bold underline uppercase hover:text-slate-600">
                Yönetici Girişi
            </button>
        </div>

      </div>
    </div>
  );
};
