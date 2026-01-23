import React, { useState, useEffect, useRef } from 'react';
import { PetProfile, LostStatus, UserProfile } from '../types';
import { Siren, MapPin, Save, AlertTriangle, CheckCircle2, Navigation, Info, Lock, Unlock, Hand, ShieldCheck, KeyRound } from 'lucide-react';
import { Input } from './ui/Input';
import * as L from 'leaflet';

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
            boxZoom: false,
            tap: false
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
            if (leafletMap.current.tap) leafletMap.current.tap.enable();
        } else {
            leafletMap.current.dragging.disable();
            leafletMap.current.touchZoom.disable();
            leafletMap.current.scrollWheelZoom.disable();
            leafletMap.current.doubleClickZoom.disable();
            if (leafletMap.current.tap) leafletMap.current.tap.disable();
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

        // --- CRITICAL FIX ---
        // Reset local state to match the "Safe" (empty) state we just saved.
        // This prevents the "dirty check" (useEffect) from thinking we still have unsaved changes
        // because "location" or "message" still held the old values in memory.
        setMessage('');
        setLocation(undefined);
        // setIsActive is already false here.

        // Explicitly clear dirty state logic
        setHasUnsavedChanges(false);
        setLocalHasChanges(false);

        setShowSafeModal(true);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto animate-in fade-in relative">
      <div className="flex items-center gap-2 mb-6">
        <Siren className={isActive ? "text-red-500 animate-pulse" : "text-matrix-600 dark:text-matrix-500"} size={28} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
            Kayıp Bildirimi
        </h2>
      </div>

      {/* --- CONTROL PANEL (SWITCH UI) --- */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex flex-col">
              <span className="font-bold text-slate-800 dark:text-white text-lg">
                  Acil Durum Modu
              </span>
              <span className={`text-xs font-medium ${isActive ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                  {isActive ? 'Şu an: KAYIP' : 'Şu an: GÜVENDE'}
              </span>
          </div>

          <div 
            onClick={() => toggleStatus(!isActive)}
            className={`
                w-16 h-9 rounded-full p-1 cursor-pointer transition-colors duration-300 relative
                ${isActive ? 'bg-red-500' : 'bg-green-500'}
            `}
          >
              <div className={`
                  w-7 h-7 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center
                  ${isActive ? 'translate-x-7' : 'translate-x-0'}
              `}>
                 {isActive ? <Siren size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-green-600" />}
              </div>
          </div>
      </div>

      {/* --- ACTIVE (LOST) FORM AREA --- */}
      {isActive && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex gap-3 items-start">
                  <Info className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-800 dark:text-red-200">
                      Aşağıdaki bilgileri doldurup <strong>Bildirimi Güncelle</strong> butonuna basarak kayıp ilanını yayınlayın.
                  </p>
              </div>

              {/* Map Section */}
              <div className="bg-white dark:bg-dark-surface/50 p-4 rounded-2xl border border-red-200 dark:border-red-500/30 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-gray-200">
                          <MapPin className="text-red-500" size={18} />
                          Son Görülen Konum
                      </label>
                      <button 
                        onClick={getUserLocation}
                        className="text-xs flex items-center gap-1 bg-matrix-100 text-matrix-700 px-2 py-1 rounded-lg hover:bg-matrix-200 dark:bg-matrix-900 dark:text-matrix-300 transition-colors"
                      >
                          <Navigation size={12} /> Konumu Bul
                      </button>
                  </div>
                  
                  <div className="relative w-full h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-slate-800 touch-none">
                      <div id="map" ref={mapRef} className="w-full h-full z-10" />
                      {!isMapInteractive && (
                          <div className="absolute inset-0 z-[50] bg-black/10 dark:bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center transition-opacity">
                              <button 
                                onClick={() => setIsMapInteractive(true)}
                                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
                              >
                                  <Hand size={16} /> Haritayı Yönet
                              </button>
                              <span className="text-[10px] text-white bg-black/50 px-2 py-1 rounded mt-2">
                                  Sayfayı kaydırmak için kilitli
                              </span>
                          </div>
                      )}
                      {isMapInteractive && (
                          <button 
                            onClick={() => setIsMapInteractive(false)}
                            className="absolute top-2 right-2 z-[50] bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg shadow-md text-slate-700 dark:text-gray-200 hover:bg-slate-100"
                            title="Kaydırmayı Bitir"
                          >
                              <Lock size={16} />
                          </button>
                      )}
                  </div>

                  {location && (
                      <div className="flex justify-between items-center mt-2">
                         <p className="text-[10px] text-slate-400 font-mono">
                             {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                         </p>
                         <div className="flex items-center gap-1 text-[10px] text-orange-500">
                             <Unlock size={10} />
                             <span>Harita {isMapInteractive ? 'Açık' : 'Kilitli'}</span>
                         </div>
                      </div>
                  )}
              </div>

              {/* Note Section */}
              <div className="bg-white dark:bg-dark-surface/50 p-4 rounded-2xl border border-red-200 dark:border-red-500/30 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">
                      Bulan Kişi İçin Not
                  </label>
                  <textarea 
                    className="w-full bg-slate-50 dark:bg-dark-input border border-slate-300 dark:border-gray-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[100px]"
                    placeholder="Örn: Sol arka ayağı aksıyor, ismini söylerseniz gelir..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
              </div>
          </div>
      )}

      {/* --- SAFE VERIFICATION FORM AREA --- */}
      {/* Show ONLY if currently inactive (Safe) AND we have unsaved changes (meaning we just toggled from Active) 
          OR if the user is verified as lost in DB but trying to switch to safe locally. */}
      {!isActive && pet.lostStatus?.isActive && (
         <div className="bg-white dark:bg-dark-surface/50 p-6 rounded-2xl border border-green-200 dark:border-green-800/50 shadow-sm animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center mb-6 text-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3 text-green-600 dark:text-green-400">
                    <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Güvenlik Kontrolü</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Kayıp durumunu kapatmak için lütfen hesabınızın şifresini girin.
                </p>
            </div>

            <div className="space-y-4">
                <Input
                    type="password"
                    label="Hesap Şifresi"
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passError}
                    rightElement={<KeyRound size={18} className="text-slate-400" />}
                />
            </div>
         </div>
      )}
      
      {/* Dynamic Save Button - ONLY SHOW IF CHANGES EXIST */}
      {localHasChanges && (
          <div className="mt-8 animate-in slide-in-from-bottom-2 fade-in">
             <button 
                onClick={handleSave}
                disabled={!isActive && !password && pet.lostStatus?.isActive}
                className={`
                    w-full py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all font-bold text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isActive 
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' 
                        : 'bg-green-600 hover:bg-green-500 shadow-green-500/30'}
                `}
              >
                  {isActive ? <Save size={20} /> : <CheckCircle2 size={20} />}
                  {isActive ? 'BİLDİRİMİ GÜNCELLE' : 'GÜVENDE OLARAK KAYDET'}
              </button>
          </div>
      )}

      {/* --- MODAL 1: LOST ACTIVATED --- */}
      {showActiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                 <div className="bg-red-500 h-2 w-full"></div>
                 <div className="p-6">
                     <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5 mx-auto text-red-600 dark:text-red-400">
                        <Siren size={28} className="animate-pulse" />
                     </div>
                     
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">
                         Kayıp Bildirimi Yayınlandı
                     </h3>
                     
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-center">
                            <span className="font-bold text-black dark:text-white">{pet.name.value}</span> adlı dostumuz için acil durum kaydı oluşturuldu.
                        </p>
                     </div>

                     <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex gap-3">
                            <div className="min-w-[4px] bg-red-500 rounded-full opacity-50"></div>
                            <p>İşaretlediğiniz bölgedeki gönüllü kişilere bildirim gönderiliyor. Dostumuzu bulurlarsa QR kod okutarak size ulaşabilecekler.</p>
                        </div>
                        <div className="flex gap-3">
                             <div className="min-w-[4px] bg-red-500 rounded-full opacity-50"></div>
                             <p>QR kodu üzerinde değilse, yüklediğiniz fotoğraf ve verdiğiniz bilgiler bulunmasına yardımcı olacaktır.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                             <Info size={32} className="text-blue-500 shrink-0" />
                             <p className="font-medium text-slate-900 dark:text-white">
                                Lütfen "Ayarlar" menüsünden iletişim bilgilerinizin ve acil durum kişisinin güncel olduğundan emin olun.
                             </p>
                        </div>
                     </div>

                     <button 
                        onClick={() => setShowActiveModal(false)}
                        className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                     >
                        Anlaşıldı
                     </button>
                 </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: SAFE CONFIRMED --- */}
      {showSafeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                 <div className="bg-green-500 h-2 w-full"></div>
                 <div className="p-6">
                     <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-5 mx-auto text-green-600 dark:text-green-400">
                        <CheckCircle2 size={32} />
                     </div>
                     
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                         Harika Haber!
                     </h3>
                     <p className="text-center text-slate-500 dark:text-gray-400 mb-6 text-sm">
                         Dostumuzun güvende olmasına çok sevindik.
                     </p>
                     
                     <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800 mb-4 flex gap-3 items-center">
                        <ShieldCheck className="text-green-600 dark:text-green-400 shrink-0" size={20} />
                        <p className="text-xs text-green-800 dark:text-green-200">
                            Kayıp ilanı yayından kaldırıldı ve bildirim gönderilen gönüllülere haber verildi.
                        </p>
                     </div>

                     <button 
                        onClick={() => setShowSafeModal(false)}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                     >
                        Teşekkürler
                     </button>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};