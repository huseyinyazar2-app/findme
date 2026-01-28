
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { PetForm } from './components/PetForm';
import { Settings } from './components/Settings';
import { InfoSummary } from './components/InfoSummary';
import { LostMode } from './components/LostMode';
import { About } from './components/About';
import { FinderView } from './components/FinderView';
import { UserProfile, PetProfile } from './types';
import { Settings as SettingsIcon, LogOut, FileText, PlusCircle, Siren, Info, RefreshCw } from 'lucide-react';
import { loginOrRegister, getPetForUser, savePetForUser, updateUserProfile, checkQRCode, getPublicPetByQr, supabase } from './services/dbService';
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

  // Update Detection State
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Theme Management - DEFAULT TO LIGHT
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('matrixc_theme');
        if (saved) return saved as 'light' | 'dark';
        // Default to light, ignore system pref for now to match user request
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

  // --- INITIALIZATION & QR CHECK & UPDATE CHECK ---
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
            
            // Check Database for this QR
            const check = await checkQRCode(code);
            
            if (check.valid) {
                if (check.status === 'boş') {
                    setQrMessage('Yeni etiket! Kayıt oluşturmak için paketten çıkan PIN kodunu giriniz.');
                } else if (check.status === 'dolu') {
                    // --- CRITICAL CHANGE: Check if lost immediately ---
                    const publicPet = await getPublicPetByQr(code);
                    
                    if (publicPet && publicPet.lostStatus?.isActive) {
                        // IT IS LOST! Show Finder View immediately.
                        setIsFinderMode(true);
                        setFinderPet(publicPet);
                        
                        // Try to get basic owner info for contact buttons
                        const { data: ownerData } = await supabase
                            .from('Find_Users')
                            .select('*')
                            .eq('username', code)
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
                    } else {
                        setQrMessage('Kayıtlı etiket. Yönetim paneli için PIN kodunu giriniz.');
                    }
                }
            } else {
                setQrMessage('Geçersiz veya Tanımsız QR Kod.');
            }
        }

        // 3. Check Local Session (Simple persistence)
        const savedUserStr = localStorage.getItem('matrixc_user_session');
        if (savedUserStr && !isFinderMode) {
             const sessionUser = JSON.parse(savedUserStr);
             if (qrMatch && qrMatch[1] && sessionUser.username !== qrMatch[1]) {
                 return;
             }

             setUser(sessionUser);
             const pet = await getPetForUser(sessionUser.username);
             if (pet) {
                 setPetProfile(pet);
                 setCurrentView('info');
             } else {
                 setCurrentView('home');
             }
        }
    };

    initApp();
  }, []);

  const reloadApp = () => {
    localStorage.setItem('matrixc_app_version', APP_VERSION);
    window.location.reload();
  };

  const handleLoginAuth = async (username: string, pass: string) => {
    const result = await loginOrRegister(username, pass);

    if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('matrixc_user_session', JSON.stringify(result.user));

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
    <div className="min-h-screen font-sans flex flex-col bg-slate-100 dark:bg-matrix-950 transition-colors duration-300">
      
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
