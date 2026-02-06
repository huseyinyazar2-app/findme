import React, { useState, useEffect, useRef } from 'react';
import { Login } from './components/Login';
import { PetForm } from './components/PetForm';
import { Settings } from './components/Settings';
import { InfoSummary } from './components/InfoSummary';
import { LostMode } from './components/LostMode';
import { About } from './components/About';
import { FinderView } from './components/FinderView';
import { UserProfile, PetProfile } from './types';
import { Settings as SettingsIcon, LogOut, FileText, PlusCircle, Siren, Info, RefreshCw, QrCode, MapPin, Loader2, Bell, XCircle, AlertTriangle } from 'lucide-react';
import { loginOrRegister, getPetForUser, savePetForUser, updateUserProfile, checkQRCode, getPublicPetByQr, supabase, logQrScan, getRecentQrScans } from './services/dbService';
import { APP_VERSION } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  
  // Finder Mode State
  const [isFinderMode, setIsFinderMode] = useState(false);
  const [finderPet, setFinderPet] = useState<PetProfile | null>(null);
  const [finderOwner, setFinderOwner] = useState<UserProfile | undefined>(undefined);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'info' | 'settings' | 'lost' | 'about'>('home');
  
  // Unsaved Changes State (Protection for Lost Mode)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // QR Handling State
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrMessage, setQrMessage] = useState<string>('');
  
  // Scan Overlay State (For Permission)
  const [showScanOverlay, setShowScanOverlay] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanProcessed = useRef(false); 

  // Owner Alert State (Log Notification)
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [showScanAlert, setShowScanAlert] = useState(false);

  // Update Detection State
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('matrixc_theme');
        if (saved) return saved as 'light' | 'dark';
        return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('matrixc_theme', theme);
  }, [theme]);

  // --- INITIALIZATION & QR CHECK ---
  useEffect(() => {
    const initApp = async () => {
        // 1. Version Check
        const savedVersion = localStorage.getItem('matrixc_app_version');
        if (savedVersion && savedVersion !== APP_VERSION) {
             setUpdateAvailable(true);
        }
        if (!savedVersion) {
            localStorage.setItem('matrixc_app_version', APP_VERSION);
        }

        // 2. Check URL for QR Code (/qr/CODE)
        const path = window.location.pathname;
        const qrMatch = path.match(/\/qr\/([a-zA-Z0-9]+)/);
        
        if (qrMatch && qrMatch[1]) {
            const code = qrMatch[1];
            setQrCode(code);
            
            // --- NEW LOGIC: Check status BEFORE showing overlay ---
            // If Lost -> Show Overlay (Ask Location)
            // If Not Lost -> Silent Log + Show Login
            
            const petCheck = await getPublicPetByQr(code);
            
            if (petCheck && petCheck.lostStatus?.isActive) {
                // Pet is LOST! We need location permission. Show Overlay.
                setShowScanOverlay(true);
            } else {
                // Pet is NOT LOST or NOT REGISTERED.
                // Log silently (background) without location.
                logQrScan(code, undefined); 
                
                // Proceed to standard QR checks for Login/Register flow
                const check = await checkQRCode(code);
                if (check.valid) {
                    if (check.status === 'boş') {
                        setQrMessage('Yeni etiket! Kayıt oluşturmak için paketten çıkan PIN kodunu giriniz.');
                    } else {
                        setQrMessage('Kayıtlı etiket. Yönetim paneli için PIN kodunu giriniz.');
                    }
                } else {
                    setQrMessage('Geçersiz veya Tanımsız QR Kod.');
                }
            }

        } else {
            // Normal load (not via QR)
            checkSession();
        }
    };

    initApp();
  }, []);

  const checkSession = async (ignoreQrMismatch = false) => {
        const savedUserStr = localStorage.getItem('matrixc_user_session');
        if (savedUserStr && !isFinderMode) {
             const sessionUser = JSON.parse(savedUserStr);
             
             // If accessed via QR, ensure logged in user matches QR owner
             if (qrCode && !ignoreQrMismatch && sessionUser.username !== qrCode) {
                 return;
             }

             setUser(sessionUser);
             
             // Check logs for owner
             fetchScansForOwner(sessionUser.username);

             const pet = await getPetForUser(sessionUser.username);
             if (pet) {
                 setPetProfile(pet);
                 setCurrentView('info');
             } else {
                 setCurrentView('home');
             }
        }
  }

  const fetchScansForOwner = async (username: string) => {
      // Only fetch logs if user is the owner
      const logs = await getRecentQrScans(username);
      // Filter out logs that are older than 1 year or handle logic as needed. 
      // For now, if there are logs, we show them. 
      if (logs && logs.length > 0) {
          setRecentScans(logs);
          setShowScanAlert(true);
      }
  };

  // --- Manual Scan Trigger (Only for LOST pets) ---
  const handleStartScan = async () => {
      if (!qrCode || isScanning || scanProcessed.current) return;
      
      setIsScanning(true);
      scanProcessed.current = true; // Prevent double clicks

      // 1. Try to get Location (User interaction allows this now)
      let locationData = undefined;
      
      try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              if (!navigator.geolocation) reject(new Error("No Geo"));
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 5000
              });
          });
          
          locationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
          };
      } catch (e) {
          console.warn("Konum izni verilmedi veya hata:", e);
      }

      // 2. Log Data with Location
      await logQrScan(qrCode, locationData);

      // 3. Process Logic (Show Finder View)
      const publicPet = await getPublicPetByQr(qrCode);
            
      if (publicPet && publicPet.lostStatus?.isActive) {
            setIsFinderMode(true);
            setFinderPet(publicPet);
            
            const { data: ownerData } = await supabase
                .from('Find_Users')
                .select('*')
                .eq('username', qrCode)
                .single();
            
            if (ownerData) {
                    setFinderOwner({
                        username: ownerData.username,
                        email: ownerData.email,
                        phone: ownerData.phone,
                        fullName: ownerData.full_name,
                        contactPreference: ownerData.contact_preference,
                        emergencyContactName: ownerData.emergency_contact_name,
                        emergencyContactEmail: ownerData.emergency_contact_email,
                        emergencyContactPhone: ownerData.emergency_contact_phone,
                        isEmailVerified: false 
                    } as UserProfile);
            }
      }

      setIsScanning(false);
      setShowScanOverlay(false);
  };

  const reloadApp = () => {
    localStorage.setItem('matrixc_app_version', APP_VERSION);
    window.location.reload();
  };

  const handleLoginAuth = async (username: string, pass: string) => {
    const result = await loginOrRegister(username, pass);

    if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('matrixc_user_session', JSON.stringify(result.user));
        
        // Check logs immediately after login
        fetchScansForOwner(result.user.username);

        if (result.isNew) {
            setPetProfile(null);
            setCurrentView('home');
        } else {
            const pet = await getPetForUser(result.user.username);
            if (pet) {
                setPetProfile(pet);
                setCurrentView('info');
            } else {
                setPetProfile(null);
                setCurrentView('home');
            }
        }
    } else {
        throw new Error(result.error || "Giriş yapılamadı");
    }
  };

  const handleLogout = () => {
    if (hasUnsavedChanges) {
        if (!window.confirm("Kaydedilmemiş değişiklikler var. Çıkış yapmak istediğinize emin misiniz?")) {
            return;
        }
    }
    setUser(null);
    setPetProfile(null);
    setShowScanAlert(false);
    localStorage.removeItem('matrixc_user_session');
    
    if (qrCode) {
        window.location.reload();
    } else {
        setCurrentView('home');
    }
    setHasUnsavedChanges(false);
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('matrixc_user_session', JSON.stringify(updatedUser));
    await updateUserProfile(updatedUser);
  };

  const handleSavePet = async (data: PetProfile) => {
    if (!user) return;
    setPetProfile(data);
    const success = await savePetForUser(user, data);
    
    if (success) {
        setHasUnsavedChanges(false);
        if (currentView === 'home') {
            alert("Kayıt başarıyla oluşturuldu.");
            setCurrentView('info'); // Redirect to Info page instead of Settings
            window.scrollTo(0, 0);
        }
    } else {
        alert("Kaydetme sırasında bir hata oluştu.");
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const changeView = (view: 'home' | 'info' | 'settings' | 'lost' | 'about') => {
    if (currentView === view) return;
    if (hasUnsavedChanges) {
        const confirmLeave = window.confirm("Kaydedilmemiş değişiklikleriniz var. Kaydetmeden çıkmak istediğinize emin misiniz?");
        if (!confirmLeave) return;
        setHasUnsavedChanges(false);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER SCAN OVERLAY (Only if Lost) ---
  if (showScanOverlay) {
      return (
          <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 z-[9999]">
              <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                      <div className="relative bg-red-100 dark:bg-red-900/50 rounded-full w-full h-full flex items-center justify-center text-red-600 dark:text-red-400">
                          <Siren size={40} className="animate-pulse" />
                      </div>
                  </div>
                  
                  <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Kayıp Alarmı!</h2>
                      <p className="text-sm text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                          Bu evcil hayvan için kayıp ilanı verilmiş. Sahibine yardımcı olmak için lütfen konum iznini onaylayın.
                      </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2 text-left">
                      <MapPin size={24} className="shrink-0" />
                      Konum bilgisi sadece hayvan sahibine iletilecektir.
                  </div>

                  <button 
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                      {isScanning ? (
                          <>
                            <Loader2 className="animate-spin" /> İşleniyor...
                          </>
                      ) : (
                          "Yardımcı Ol & Bilgileri Gör"
                      )}
                  </button>
              </div>
          </div>
      )
  }

  // --- RENDER FINDER MODE ---
  if (isFinderMode && finderPet) {
      return (
          <FinderView 
             pet={finderPet} 
             owner={finderOwner}
             onLoginClick={() => setIsFinderMode(false)} 
          />
      );
  }

  // --- RENDER LOGIN ---
  if (!user) {
    return (
        <div className="min-h-screen font-sans bg-slate-100 dark:bg-matrix-950 transition-colors duration-300">
             {updateAvailable && (
                <div onClick={reloadApp} className="fixed top-0 left-0 right-0 bg-matrix-600 text-white p-3 text-center text-sm font-bold cursor-pointer z-[100] animate-in slide-in-from-top flex items-center justify-center gap-2 shadow-lg">
                    <RefreshCw size={18} className="animate-spin-slow" />
                    Yeni versiyon ({APP_VERSION}) mevcut! Güncellemek için dokunun.
                </div>
            )}
            <Login 
                onLogin={handleLoginAuth} 
                initialUsername={qrCode || undefined} 
                qrStatusMessage={qrMessage}
            />
        </div>
    );
  }

  // --- RENDER APP (Owner View) ---
  const isHomeActive = currentView === 'home'; 
  const isInfoActive = currentView === 'info';
  const isLostActive = currentView === 'lost';
  const isSettingsActive = currentView === 'settings';
  const isAboutActive = currentView === 'about';

  return (
    <div className="min-h-screen font-sans flex flex-col bg-slate-100 dark:bg-matrix-950 transition-colors duration-300 relative">
      
      {/* --- OWNER SCAN ALERT MODAL --- */}
      {showScanAlert && recentScans.length > 0 && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                  <div className="bg-red-600 p-4 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                          <Bell className="animate-swing" />
                          <h3 className="font-black text-lg">QR Etiketi Okutuldu!</h3>
                      </div>
                      <button onClick={() => setShowScanAlert(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
                          <XCircle />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium leading-relaxed">
                          QR etiketiniz yakın zamanda tarandı. Bu, evcil hayvanınızın biri tarafından bulunduğu anlamına gelebilir. İşte detaylar:
                      </p>

                      <div className="space-y-3">
                          {recentScans.map((scan) => (
                              <div key={scan.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="font-bold text-slate-800 dark:text-white">
                                          {new Date(scan.scanned_at).toLocaleString('tr-TR')}
                                      </span>
                                  </div>
                                  
                                  {scan.location ? (
                                      <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${scan.location.lat},${scan.location.lng}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg hover:bg-blue-100 transition-colors mb-2"
                                      >
                                          <MapPin size={16} /> Konumu Haritada Gör
                                      </a>
                                  ) : (
                                      <div className="flex items-center gap-2 text-slate-400 text-xs italic mb-2">
                                          <MapPin size={14} /> Konum izni verilmedi
                                      </div>
                                  )}

                                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                                      <p><strong>Cihaz:</strong> {scan.device_info?.platform || 'Bilinmiyor'}</p>
                                      {scan.ip_address && <p><strong>IP:</strong> {scan.ip_address}</p>}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex gap-2">
                          <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                          <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                              Eğer bulan kişi sizinle iletişime geçmezse, yukarıdaki konum bilgilerini kullanarak bölgeye gitmeyi düşünebilirsiniz.
                          </p>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                      <button 
                        onClick={() => setShowScanAlert(false)}
                        className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-bold"
                      >
                          Anlaşıldı, Kapat
                      </button>
                  </div>
              </div>
          </div>
      )}

      {updateAvailable && (
          <div onClick={reloadApp} className="fixed top-4 left-4 right-4 bg-matrix-600 dark:bg-matrix-500 text-white p-4 rounded-xl shadow-2xl z-[100] flex items-center justify-between cursor-pointer animate-in slide-in-from-top duration-500 border border-white/20">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                      <RefreshCw size={20} className="animate-spin" />
                  </div>
                  <div>
                      <h4 className="font-bold text-sm">Güncelleme Mevcut</h4>
                      <p className="text-xs opacity-90">Sürüm {APP_VERSION} yüklendi. Yenilemek için dokunun.</p>
                  </div>
              </div>
          </div>
      )}

      {/* Content Area */}
      <div className="flex-1">
        {currentView === 'home' && !petProfile && (
            <PetForm 
                user={user} 
                onUpdateUser={handleUpdateUser} 
                initialPetData={null}
                onSave={handleSavePet}
            />
        )}
        
        {(currentView === 'info' || (currentView === 'home' && petProfile)) && (
            <InfoSummary 
                user={user}
                pet={petProfile}
                onUpdateUser={handleUpdateUser}
                onSavePet={handleSavePet}
            />
        )}

        {currentView === 'lost' && petProfile && (
            <LostMode 
                user={user}
                pet={petProfile}
                onSavePet={handleSavePet}
                setHasUnsavedChanges={setHasUnsavedChanges}
            />
        )}

        {currentView === 'settings' && (
            <Settings 
                user={user} 
                onUpdateUser={handleUpdateUser}
                currentTheme={theme}
                onToggleTheme={toggleTheme}
            />
        )}

        {currentView === 'about' && (
            <About />
        )}
      </div>

      {/* Bottom Navigation - FIXED BOTTOM STYLE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-matrix-950 border-t border-slate-200 dark:border-slate-800 z-50 pb-6 pt-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
            
            {!petProfile ? (
                <button 
                    onClick={() => changeView('home')}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 ${isHomeActive ? 'text-matrix-600 dark:text-matrix-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                >
                    <div className={`p-1.5 rounded-xl ${isHomeActive ? 'bg-matrix-50 dark:bg-matrix-900' : ''}`}>
                        <PlusCircle size={24} strokeWidth={isHomeActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-bold ${isHomeActive ? 'opacity-100' : 'opacity-70'}`}>Kayıt</span>
                </button>
            ) : (
                <button 
                    onClick={() => changeView('info')}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 ${isInfoActive ? 'text-matrix-600 dark:text-matrix-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                >
                    <div className={`p-1.5 rounded-xl ${isInfoActive ? 'bg-matrix-50 dark:bg-matrix-900' : ''}`}>
                        <FileText size={24} strokeWidth={isInfoActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-bold ${isInfoActive ? 'opacity-100' : 'opacity-70'}`}>Bilgiler</span>
                </button>
            )}

            <button 
                 onClick={() => petProfile ? changeView('lost') : alert("Önce hayvan kaydı yapmalısınız.")}
                 className={`flex flex-col items-center gap-1 transition-all duration-200 ${isLostActive ? 'text-red-600 dark:text-red-500' : 'text-slate-400 dark:text-slate-500 hover:text-red-500'}`}
            >
                <div className={`p-1.5 rounded-xl ${isLostActive ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
                    <Siren size={24} strokeWidth={isLostActive ? 2.5 : 2} className={petProfile?.lostStatus?.isActive ? "animate-pulse" : ""} />
                </div>
                <span className={`text-[9px] font-bold ${petProfile?.lostStatus?.isActive ? "text-red-600" : ""}`}>Kayıp</span>
            </button>
            
            <button 
                onClick={() => changeView('settings')}
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${isSettingsActive ? 'text-matrix-600 dark:text-matrix-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
                <div className={`p-1.5 rounded-xl ${isSettingsActive ? 'bg-matrix-50 dark:bg-matrix-900' : ''}`}>
                    <SettingsIcon size={24} strokeWidth={isSettingsActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-bold ${isSettingsActive ? 'opacity-100' : 'opacity-70'}`}>Ayarlar</span>
            </button>

            <button 
                onClick={() => changeView('about')}
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${isAboutActive ? 'text-matrix-600 dark:text-matrix-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
                 <div className={`p-1.5 rounded-xl ${isAboutActive ? 'bg-matrix-50 dark:bg-matrix-900' : ''}`}>
                    <Info size={24} strokeWidth={isAboutActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-bold ${isAboutActive ? 'opacity-100' : 'opacity-70'}`}>Hakkında</span>
            </button>

            <button 
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 transition-all duration-200 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
            >
                <div className="p-1.5">
                    <LogOut size={24} strokeWidth={2} />
                </div>
                <span className="text-[9px] font-bold">Çıkış</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;