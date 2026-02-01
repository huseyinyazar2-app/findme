
import React, { useState, useEffect, useRef } from 'react';
import { PetProfile, LostStatus, UserProfile } from '../types';
import { Siren, MapPin, Save, Info, Lock, Unlock, Hand, ShieldCheck, KeyRound, CheckCircle2, Navigation, AlertTriangle, Radar, FileCheck } from 'lucide-react';
import { Input } from './ui/Input';
import L from 'leaflet';

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

interface LostModeProps {
  user: UserProfile;
  pet: PetProfile;
  onSavePet: (pet: PetProfile) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const LostMode: React.FC<LostModeProps> = ({ user, pet, onSavePet, setHasUnsavedChanges }) => {
  const [isActive, setIsActive] = useState(pet.lostStatus?.isActive || false);
  const [message, setMessage] = useState(pet.lostStatus?.message || '');
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(
    pet.lostStatus?.lastSeenLocation
  );
  
  const [localHasChanges, setLocalHasChanges] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showSafeModal, setShowSafeModal] = useState(false);
  
  // KVKK Consent State
  const [consentGiven, setConsentGiven] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const savedActive = pet.lostStatus?.isActive || false;
    const savedMessage = pet.lostStatus?.message || '';
    const savedLat = pet.lostStatus?.lastSeenLocation?.lat;
    const savedLng = pet.lostStatus?.lastSeenLocation?.lng;
    const currentLat = location?.lat;
    const currentLng = location?.lng;

    const locationChanged = (savedLat !== currentLat) || (savedLng !== currentLng);
    
    const isDirty = 
        isActive !== savedActive || 
        message !== savedMessage || 
        locationChanged;

    setLocalHasChanges(isDirty);
    setHasUnsavedChanges(isDirty);
  }, [isActive, message, location, pet.lostStatus, setHasUnsavedChanges]);


  useEffect(() => {
    if (isActive && mapRef.current && !leafletMap.current) {
        const initialLat = location?.lat || 39.9334;
        const initialLng = location?.lng || 32.8597;
        const initialZoom = location ? 15 : 6;

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

        leafletMap.current.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setLocation({ lat, lng });
        });

        setTimeout(() => {
            leafletMap.current?.invalidateSize();
        }, 200);
    } else if (!isActive && leafletMap.current) {
         leafletMap.current.remove();
         leafletMap.current = null;
         markerRef.current = null;
    }
  }, [isActive]);

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
        getUserLocation();
        setPassword('');
        setConsentGiven(false); // Reset consent when activating
    } else {
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
        const status: LostStatus = {
            isActive: true,
            lostDate: pet.lostStatus?.lostDate || new Date().toISOString(),
            lastSeenLocation: location,
            message: message
        };
        const updatedPet = { ...pet, lostStatus: status };
        onSavePet(updatedPet);
        setHasUnsavedChanges(false);
        setLocalHasChanges(false);
        setShowActiveModal(true);
    } else {
        const actualPass = user.password || "1234";
        if (password !== actualPass) {
            setPassError("Şifre hatalı. Kayıp durumunu kapatmak için giriş şifrenizi girmelisiniz.");
            return;
        }
        const status: LostStatus = {
            isActive: false,
            lostDate: undefined,
            lastSeenLocation: undefined,
            message: ''
        };
        const updatedPet = { ...pet, lostStatus: status };
        onSavePet(updatedPet);
        setMessage('');
        setLocation(undefined);
        setHasUnsavedChanges(false);
        setLocalHasChanges(false);
        setShowSafeModal(true);
    }
  };

  return (
    <div className="pb-40 bg-slate-50 dark:bg-matrix-950 min-h-screen">
      
      {/* 1. DYNAMIC HEADER */}
      <div className={`
          relative w-full pb-10 pt-8 px-6 rounded-b-[3rem] shadow-xl overflow-hidden transition-all duration-500
          ${isActive 
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-rose-800' 
            : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700'}
      `}>
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
                  <p className="text-white/80 text-sm font-medium mt-1 max-w-xs mx-auto leading-tight">
                      {isActive 
                          ? 'Acil durum sinyali yayılıyor. Konum ve mesajınız herkese açık.' 
                          : 'Dostumuz yanınızda ve güvende.'}
                  </p>
              </div>

              {/* TOGGLE SWITCH */}
              <div className="mt-4">
                  <button
                      onClick={() => toggleStatus(!isActive)}
                      className={`
                          group relative flex items-center px-1 py-1 w-64 h-16 rounded-full shadow-inner transition-colors duration-300
                          ${isActive ? 'bg-red-900/40 border border-red-400/30' : 'bg-emerald-900/30 border border-emerald-400/30'}
                      `}
                  >
                      <span className={`absolute left-0 w-full text-center text-[10px] font-bold tracking-[0.2em] uppercase transition-opacity duration-300 ${isActive ? 'opacity-0' : 'text-white/70 opacity-100'}`}>
                          Kaydır &rarr; Kayıp İlanı Ver
                      </span>
                       <span className={`absolute left-0 w-full text-center text-[10px] font-bold tracking-[0.2em] uppercase transition-opacity duration-300 ${isActive ? 'text-white/70 opacity-100' : 'opacity-0'}`}>
                          Kayıp İlanını Durdur &larr;
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

      <div className="px-4 -mt-8 relative z-20 max-w-lg mx-auto space-y-6">

          {/* --- ACTIVE (LOST) FORM AREA --- */}
          {isActive && (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
                  
                  {/* Map Section */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-1 shadow-xl border border-slate-200 dark:border-slate-800">
                      <div className="px-5 py-4 flex justify-between items-center">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-gray-200">
                              <MapPin className="text-red-500" size={18} />
                              Son Görülen Konum
                          </label>
                          <button 
                            onClick={getUserLocation}
                            className="text-xs flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition-colors font-bold"
                          >
                              <Navigation size={12} /> Konumumu Al
                          </button>
                      </div>
                      
                      <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 touch-none">
                          <div id="map" ref={mapRef} className="w-full h-full z-10" />
                          
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
                             <p className="text-[10px] text-slate-400 font-mono tracking-wide font-bold">
                                 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                             </p>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                 {isMapInteractive ? <Unlock size={10} /> : <Lock size={10} />}
                                 <span>{isMapInteractive ? 'DÜZENLENEBİLİR' : 'KİLİTLİ'}</span>
                             </div>
                         </div>
                      )}
                  </div>

                  {/* Note Section */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <Info size={18} className="text-matrix-600 dark:text-matrix-400" />
                          Bulan Kişi İçin Not
                      </label>
                      <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[120px] resize-none leading-relaxed font-medium placeholder-slate-400"
                        placeholder="Örn: İsmi Pamuk. Sol arka ayağı aksıyor, ürkek davranabilir. Lütfen yaklaşırken adıyla seslenin..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                  </div>

                  {/* --- CONSENT CHECKBOX (KVKK) --- */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-3 items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="kvkk-consent"
                                checked={consentGiven}
                                onChange={(e) => setConsentGiven(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-slate-400 checked:bg-red-600 checked:border-red-600 transition-all dark:border-slate-500"
                            />
                            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <CheckCircle2 size={14} strokeWidth={4} />
                            </div>
                        </div>
                        <label htmlFor="kvkk-consent" className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed cursor-pointer select-none">
                            Kayıp durumu süresince; <strong className="text-slate-800 dark:text-white">konum, iletişim ve evcil hayvan bilgilerimin</strong> herkese açık olarak paylaşılmasını onaylıyorum. <span className="underline decoration-slate-400 underline-offset-2">KVKK Aydınlatma Metni</span>'ni okudum ve kabul ediyorum.
                        </label>
                  </div>
              </div>
          )}

          {/* --- SAFE VERIFICATION FORM AREA --- */}
          {!isActive && pet.lostStatus?.isActive && (
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-green-100 dark:border-green-900/50 shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex flex-col items-center mb-6 text-center relative z-10">
                    <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-3 text-green-600 dark:text-green-400 shadow-sm">
                        <KeyRound size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Güvenlik Kontrolü</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1 max-w-[200px]">
                        Alarmı kapatmak için lütfen giriş şifrenizi doğrulayın.
                    </p>
                </div>

                <div className="space-y-4 relative z-10">
                    <Input
                        type="password"
                        placeholder="******"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={passError}
                        className="!bg-slate-50 dark:!bg-slate-800 text-center tracking-widest font-bold text-lg"
                    />
                </div>
             </div>
          )}
          
          {/* Dynamic Save Button */}
          {localHasChanges && (
              <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-2 fade-in">
                 <button 
                    onClick={handleSave}
                    // Disable logic: 
                    // 1. If turning OFF safe mode (!isActive) AND password is empty.
                    // 2. If turning ON active mode (isActive) AND consent is NOT given.
                    disabled={(!isActive && !password && pet.lostStatus?.isActive) || (isActive && !consentGiven)}
                    className={`
                        w-full py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all font-black text-white text-lg
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale
                        ${isActive 
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/40' 
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/40'}
                    `}
                  >
                      {isActive ? <FileCheck size={24} /> : <ShieldCheck size={24} />}
                      {isActive ? 'BİLDİRİMİ ONAYLA' : 'GÜVENLİ OLARAK İŞARETLE'}
                  </button>
              </div>
          )}

      </div>

      {/* --- MODAL 1: LOST ACTIVATED --- */}
      {showActiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                 <div className="bg-red-500 h-2 w-full"></div>
                 <div className="p-6">
                     <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5 mx-auto text-red-600 dark:text-red-400">
                        <Siren size={32} className="animate-pulse" />
                     </div>
                     
                     <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">
                         Kayıp Bildirimi Yayınlandı
                     </h3>
                     
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4 text-center">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            <span className="font-bold text-black dark:text-white">{pet.name.value}</span> için acil durum kaydı oluşturuldu. QR kod tarandığında alarm verilecek.
                        </p>
                     </div>

                     <button 
                        onClick={() => setShowActiveModal(false)}
                        className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                     >
                        Tamam
                     </button>
                 </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: SAFE CONFIRMED --- */}
      {showSafeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                 <div className="bg-emerald-500 h-2 w-full"></div>
                 <div className="p-6">
                     <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-5 mx-auto text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={36} />
                     </div>
                     
                     <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">
                         Tehlike Geçti!
                     </h3>
                     <p className="text-center text-slate-500 dark:text-gray-400 mb-6 text-sm font-medium">
                         Dostumuzun güvende olmasına sevindik. Sistem normale döndü.
                     </p>

                     <button 
                        onClick={() => setShowSafeModal(false)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
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
