
import React, { useState, useEffect, useRef } from 'react';
import { PetProfile, LostStatus, UserProfile } from '../types';
import { Siren, MapPin, Save, Info, Lock, Unlock, Hand, ShieldCheck, KeyRound, CheckCircle2, Navigation, AlertTriangle, Radar } from 'lucide-react';
import { Input } from './ui/Input';
import L from 'leaflet';

// Leaflet Icon Setup - fixed for TypeScript without needing @ts-ignore
const setupLeafletIcons = () => {
  try {
    // Cast to any to access the private property _getIconUrl safely
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

interface LostModeProps {
  user: UserProfile;
  pet: PetProfile;
  onSavePet: (pet: PetProfile) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const LostMode: React.FC<LostModeProps> = ({ user, pet, onSavePet, setHasUnsavedChanges }) => {
  // Local state initialized from prop
  const [isActive, setIsActive] = useState(pet.lostStatus?.isActive || false);
  const [message, setMessage] = useState(pet.lostStatus?.message || '');
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(
    pet.lostStatus?.lastSeenLocation
  );
  
  // Local dirty state for UI rendering
  const [localHasChanges, setLocalHasChanges] = useState(false);

  // Security State
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');

  // UX State: Map Interaction Lock
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  
  // Modal state
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showSafeModal, setShowSafeModal] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Dirty State Logic
  useEffect(() => {
    const savedActive = pet.lostStatus?.isActive || false;
    const savedMessage = pet.lostStatus?.message || '';
    const savedLat = pet.lostStatus?.lastSeenLocation?.lat;
    const savedLng = pet.lostStatus?.lastSeenLocation?.lng;
    const currentLat = location?.lat;
    const currentLng = location?.lng;

    // Deep comparison for location
    const locationChanged = (savedLat !== currentLat) || (savedLng !== currentLng);
    
    const isDirty = 
        isActive !== savedActive || 
        message !== savedMessage || 
        locationChanged;

    setLocalHasChanges(isDirty);
    setHasUnsavedChanges(isDirty);
  }, [isActive, message, location, pet.lostStatus, setHasUnsavedChanges]);


  // 1. Effect: Initialize Map (Only when isActive is TRUE)
  useEffect(() => {
    if (isActive && mapRef.current && !leafletMap.current) {
        // Default center
        const initialLat = location?.lat || 39.9334;
        const initialLng = location?.lng || 32.8597;
        const initialZoom = location ? 15 : 6;

        // Initialize map
        leafletMap.current = L.map(mapRef.current, {
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false
        }).setView([initialLat, initialLng], initialZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap.current);

        // Click listener
        leafletMap.current.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setLocation({ lat, lng });
        });

        // Fix map size
        setTimeout(() => {
            leafletMap.current?.invalidateSize();
        }, 200);
    } else if (!isActive && leafletMap.current) {
         // If turned off, remove map
         leafletMap.current.remove();
         leafletMap.current = null;
         markerRef.current = null;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // 2. Effect: Handle Marker & View Updates
  useEffect(() => {
      if (!location || !leafletMap.current) return;

      if (!markerRef.current) {
        markerRef.current = L.marker([location.lat, location.lng], { draggable: true })
            .addTo(leafletMap.current)
            .bindPopup("Kaybolduğu Konum")
            .openPopup();

        markerRef.current.on('dragend', function(event) {
            const marker = event.target;
            const position = marker.getLatLng();
            setLocation({ lat: position.lat, lng: position.lng });
        });
        
        leafletMap.current.setView([location.lat, location.lng], 16);
     } else {
         markerRef.current.setLatLng([location.lat, location.lng]);
     }
  }, [location]);

  // 3. Effect: Handle Map Interaction Lock
  useEffect(() => {
    if (leafletMap.current) {
        if (isMapInteractive) {
            leafletMap.current.dragging.enable();
            leafletMap.current.touchZoom.enable();
            leafletMap.current.scrollWheelZoom.enable();
            leafletMap.current.doubleClickZoom.enable();
        } else {
            leafletMap.current.dragging.disable();
            leafletMap.current.touchZoom.disable();
            leafletMap.current.scrollWheelZoom.disable();
            leafletMap.current.doubleClickZoom.disable();
        }
    }
  }, [isMapInteractive]);

  const toggleStatus = (newState: boolean) => {
    setIsActive(newState);
    if (newState) {
        // Turning ON: Try to get location
        getUserLocation();
        setPassword(''); // Reset pass if toggling back on
    } else {
        // Turning OFF: Reset map interactions, UI will show password input
        setIsMapInteractive(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                
                if (leafletMap.current) {
                    leafletMap.current.setView([latitude, longitude], 16);
                }
            },
            (error) => {
                console.error("Konum alınamadı", error);
            }
        );
    }
  };

  const handleSave = () => {
    setPassError('');

    if (isActive) {
        // --- SAVING AS LOST ---
        const status: LostStatus = {
            isActive: true,
            lostDate: pet.lostStatus?.lostDate || new Date().toISOString(),
            lastSeenLocation: location,
            message: message
        };

        const updatedPet = { ...pet, lostStatus: status };
        
        // Update Prop
        onSavePet(updatedPet);
        
        // Explicitly clear dirty state since we saved
        setHasUnsavedChanges(false);
        setLocalHasChanges(false);
        
        setShowActiveModal(true);

    } else {
        // --- SAVING AS SAFE (REQUIRES PASSWORD) ---
        
        // 1. Verify Password
        const actualPass = user.password || "1234";
        if (password !== actualPass) {
            setPassError("Şifre hatalı. Kayıp durumunu kapatmak için giriş şifrenizi girmelisiniz.");
            return;
        }

        // 2. Prepare Data (Clean State)
        const status: LostStatus = {
            isActive: false,
            lostDate: undefined,
            lastSeenLocation: undefined,
            message: ''
        };

        const updatedPet = { ...pet, lostStatus: status };
        
        // Update Prop
        onSavePet(updatedPet);

        setMessage('');
        setLocation(undefined);
        setHasUnsavedChanges(false);
        setLocalHasChanges(false);

        setShowSafeModal(true);
    }
  };

  return (
    <div className="pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* 1. DYNAMIC HEADER */}
      <div className={`
          relative w-full pb-10 pt-8 px-6 rounded-b-[2.5rem] shadow-xl overflow-hidden transition-all duration-500
          ${isActive 
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-rose-800' 
            : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700'}
      `}>
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-white/20 backdrop-blur-md
                  ${isActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}
              `}>
                  {isActive ? <Siren size={40} className="text-white" /> : <ShieldCheck size={40} className="text-white" />}
              </div>
              
              <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                      {isActive ? 'Kayıp Modu Aktif!' : 'Durum: Güvende'}
                  </h2>
                  <p className="text-white/80 text-sm font-medium mt-1 max-w-xs mx-auto">
                      {isActive 
                          ? 'Acil durum sinyali yayılıyor. Konum ve mesajınız herkese açık.' 
                          : 'Dostumuz yanınızda ve güvende. Herhangi bir tehlike yok.'}
                  </p>
              </div>

              {/* TOGGLE SWITCH (Large Interaction Area) */}
              <div className="mt-4">
                  <button
                      onClick={() => toggleStatus(!isActive)}
                      className={`
                          group relative flex items-center px-1 py-1 w-64 h-16 rounded-full shadow-inner transition-colors duration-300
                          ${isActive ? 'bg-red-900/40 border border-red-400/30' : 'bg-emerald-900/30 border border-emerald-400/30'}
                      `}
                  >
                      <span className={`absolute left-0 w-full text-center text-xs font-bold tracking-widest uppercase transition-opacity duration-300 ${isActive ? 'opacity-0' : 'text-white/70 opacity-100'}`}>
                          Kaydır &rarr; Aktif Et
                      </span>
                       <span className={`absolute left-0 w-full text-center text-xs font-bold tracking-widest uppercase transition-opacity duration-300 ${isActive ? 'text-white/70 opacity-100' : 'opacity-0'}`}>
                          Kapatmak İçin &larr;
                      </span>

                      <div className={`
                          w-14 h-14 bg-white rounded-full shadow-lg transform transition-all duration-300 flex items-center justify-center
                          ${isActive ? 'translate-x-[12.2rem]' : 'translate-x-0'}
                      `}>
                          {isActive 
                            ? <Siren size={20} className="text-red-600" /> 
                            : <CheckCircle2 size={24} className="text-emerald-600" />}
                      </div>
                  </button>
              </div>
          </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 max-w-lg mx-auto space-y-6">

          {/* --- ACTIVE (LOST) FORM AREA --- */}
          {isActive && (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
                  
                  {/* Info Card */}
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
                      <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded-full shrink-0">
                        <Radar className="text-red-600 dark:text-red-400" size={20} />
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                          Aşağıdaki bilgileri doldurup <strong>Bildirimi Güncelle</strong> butonuna basarak QR kod okutulduğunda görünecek verileri güncelleyin.
                      </p>
                  </div>

                  {/* Map Section */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-lg border border-slate-200 dark:border-slate-700">
                      <div className="px-5 py-4 flex justify-between items-center">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-gray-200">
                              <MapPin className="text-red-500" size={18} />
                              Son Görülen Konum
                          </label>
                          <button 
                            onClick={getUserLocation}
                            className="text-xs flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition-colors font-semibold"
                          >
                              <Navigation size={12} /> Konumumu Al
                          </button>
                      </div>
                      
                      <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 touch-none">
                          <div id="map" ref={mapRef} className="w-full h-full z-10" />
                          
                          {/* Map Overlay Controls */}
                          {!isMapInteractive && (
                              <div className="absolute inset-0 z-[50] bg-slate-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center transition-opacity">
                                  <button 
                                    onClick={() => setIsMapInteractive(true)}
                                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
                                  >
                                      <Hand size={16} className="text-red-500" /> Haritaya Müdahale Et
                                  </button>
                              </div>
                          )}
                          
                          {isMapInteractive && (
                              <button 
                                onClick={() => setIsMapInteractive(false)}
                                className="absolute top-3 right-3 z-[50] bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl shadow-lg text-slate-700 dark:text-gray-200 hover:bg-slate-100"
                              >
                                  <Lock size={18} />
                              </button>
                          )}
                      </div>

                      {location && (
                         <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl flex justify-between items-center">
                             <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                                 KOORDİNAT: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                             </p>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                 {isMapInteractive ? <Unlock size={10} /> : <Lock size={10} />}
                                 <span>{isMapInteractive ? 'DÜZENLENEBİLİR' : 'KİLİTLİ'}</span>
                             </div>
                         </div>
                      )}
                  </div>

                  {/* Note Section */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <Info size={18} className="text-blue-500" />
                          Bulan Kişi İçin Not
                      </label>
                      <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[120px] resize-none leading-relaxed"
                        placeholder="Örn: İsmi Pamuk. Sol arka ayağı aksıyor, ürkek davranabilir. Lütfen yaklaşırken adıyla seslenin..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                  </div>
              </div>
          )}

          {/* --- SAFE VERIFICATION FORM AREA --- */}
          {!isActive && pet.lostStatus?.isActive && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-green-100 dark:border-green-900/50 shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex flex-col items-center mb-6 text-center relative z-10">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3 text-green-600 dark:text-green-400">
                        <KeyRound size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Güvenlik Kontrolü</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 max-w-[200px]">
                        Alarmı kapatmak için lütfen giriş şifrenizi doğrulayın.
                    </p>
                </div>

                <div className="space-y-4 relative z-10">
                    <Input
                        type="password"
                        placeholder="Hesap Şifresi"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={passError}
                        className="!bg-slate-50 dark:!bg-slate-900 text-center tracking-widest font-bold"
                    />
                </div>
             </div>
          )}
          
          {/* Dynamic Save Button - ONLY SHOW IF CHANGES EXIST */}
          {localHasChanges && (
              <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-2 fade-in">
                 <button 
                    onClick={handleSave}
                    disabled={!isActive && !password && pet.lostStatus?.isActive}
                    className={`
                        w-full py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all font-bold text-white text-lg
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isActive 
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/40' 
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/40'}
                    `}
                  >
                      {isActive ? <Save size={24} /> : <ShieldCheck size={24} />}
                      {isActive ? 'BİLDİRİMİ GÜNCELLE' : 'GÜVENLİ OLARAK İŞARETLE'}
                  </button>
              </div>
          )}

      </div>

      {/* --- MODAL 1: LOST ACTIVATED --- */}
      {showActiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                 <div className="bg-red-500 h-2 w-full"></div>
                 <div className="p-6">
                     <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5 mx-auto text-red-600 dark:text-red-400">
                        <Siren size={32} className="animate-pulse" />
                     </div>
                     
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">
                         Kayıp Bildirimi Yayınlandı
                     </h3>
                     
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-center">
                            <span className="font-bold text-black dark:text-white">{pet.name.value}</span> için acil durum kaydı oluşturuldu.
                        </p>
                     </div>

                     <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex gap-3 items-start">
                            <CheckCircle2 size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p>QR kod okutulduğunda "Kayıp" uyarısı ve iletişim bilgileri gösterilecek.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                             <CheckCircle2 size={16} className="text-red-500 shrink-0 mt-0.5" />
                             <p>İletişim bilgilerinizin ve 2. şahıs numarasının güncel olduğundan emin olun.</p>
                        </div>
                     </div>

                     <button 
                        onClick={() => setShowActiveModal(false)}
                        className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                     >
                        Tamam, Anlaşıldı
                     </button>
                 </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: SAFE CONFIRMED --- */}
      {showSafeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                 <div className="bg-emerald-500 h-2 w-full"></div>
                 <div className="p-6">
                     <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-5 mx-auto text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={36} />
                     </div>
                     
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                         Tehlike Geçti!
                     </h3>
                     <p className="text-center text-slate-500 dark:text-gray-400 mb-6 text-sm">
                         Dostumuzun güvende olmasına çok sevindik.
                     </p>
                     
                     <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 mb-4 flex gap-3 items-center">
                        <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                            Kayıp ilanı başarıyla kaldırıldı. Sistem normale döndü.
                        </p>
                     </div>

                     <button 
                        onClick={() => setShowSafeModal(false)}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                     >
                        Ana Sayfaya Dön
                     </button>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};
