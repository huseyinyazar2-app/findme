
import React, { useState } from 'react';
import { UserProfile, ContactPreference } from '../types';
import { Input } from './ui/Input';
import { Phone, Check, Shield, User, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, Save, Users, AlertTriangle, Moon, Sun } from 'lucide-react';
import { sendEmailVerification, verifyEmailCode } from '../services/authService';
import { formatPhoneNumber } from '../constants';

interface SettingsProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, currentTheme, onToggleTheme }) => {
  // --- Email Verification State ---
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);

  // --- Password Change State ---
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMessage, setPassMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- Communication Preferences State ---
  const [isPhoneChecked, setIsPhoneChecked] = useState(
    user.contactPreference === ContactPreference.BOTH || 
    user.contactPreference === ContactPreference.PHONE
  );
  const [tempPhone, setTempPhone] = useState(user.phone || '');
  const [prefMessage, setPrefMessage] = useState<string | null>(null);

  // --- Emergency Contact State ---
  const [emergencyName, setEmergencyName] = useState(user.emergencyContactName || '');
  const [isEmEmailChecked, setIsEmEmailChecked] = useState(!!user.emergencyContactEmail);
  const [isEmPhoneChecked, setIsEmPhoneChecked] = useState(!!user.emergencyContactPhone);
  const [emEmail, setEmEmail] = useState(user.emergencyContactEmail || '');
  const [emPhone, setEmPhone] = useState(user.emergencyContactPhone || '');
  const [emMessage, setEmMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


  // Helper to update user state easily
  const updateField = (field: keyof UserProfile, value: any) => {
    onUpdateUser({ ...user, [field]: value });
  };

  // --- Handlers ---

  const handleSendCode = async () => {
    if (!user.email || !user.email.includes('@')) {
      alert("Profil sayfasında geçerli bir e-posta tanımlanmamış.");
      return;
    }
    setIsVerifyingEmail(true);
    await sendEmailVerification(user.email);
    setIsVerifyingEmail(false);
    setShowVerificationInput(true);
    // Alert removed. Code is now logged to console for dev, or sent via email in prod.
    alert("Doğrulama kodu e-posta adresinize gönderildi. (Geliştirici Notu: Konsolu kontrol edin)");
  };

  const handleVerifyCode = async () => {
    const isValid = await verifyEmailCode(verificationCode);
    if (isValid) {
      updateField('isEmailVerified', true);
      setShowVerificationInput(false);
      alert("E-posta başarıyla doğrulandı!");
    } else {
      alert("Hatalı kod! Lütfen kontrol ediniz.");
    }
  };

  const handleSavePreferences = () => {
    setPrefMessage(null);

    // Validate phone if checked
    if (isPhoneChecked && !tempPhone.trim()) {
        setPrefMessage("Lütfen telefon numaranızı giriniz.");
        return; 
    }

    const newPreference = isPhoneChecked ? ContactPreference.BOTH : ContactPreference.EMAIL;

    onUpdateUser({
        ...user,
        contactPreference: newPreference,
        phone: isPhoneChecked ? tempPhone : ''
    });

    setPrefMessage("Tercihler başarıyla kaydedildi.");
    setTimeout(() => setPrefMessage(null), 3000);
  };

  const handleSaveEmergency = () => {
    setEmMessage(null);

    // Validation Logic
    // 1. If Name is NOT empty, at least one contact method must be checked AND filled.
    if (emergencyName.trim()) {
        if (!isEmEmailChecked && !isEmPhoneChecked) {
            setEmMessage({ type: 'error', text: "Ad soyad girildiğinde en az bir iletişim yöntemi seçmelisiniz." });
            return;
        }

        if (isEmEmailChecked && !emEmail.trim()) {
            setEmMessage({ type: 'error', text: "Lütfen acil durum e-posta adresini giriniz." });
            return;
        }

        if (isEmPhoneChecked && !emPhone.trim()) {
            setEmMessage({ type: 'error', text: "Lütfen acil durum telefon numarasını giriniz." });
            return;
        }
    }

    // Prepare data to save (if unchecked, save as undefined/empty)
    const dataToSave = {
        emergencyContactName: emergencyName.trim(),
        emergencyContactEmail: isEmEmailChecked ? emEmail.trim() : undefined,
        emergencyContactPhone: isEmPhoneChecked ? emPhone.trim() : undefined
    };

    onUpdateUser({
        ...user,
        ...dataToSave
    });

    setEmMessage({ type: 'success', text: "Acil durum kişisi güncellendi." });
    setTimeout(() => setEmMessage(null), 3000);
  };

  const handleChangePassword = () => {
    setPassMessage(null);

    if (!currentPass || !newPass || !confirmPass) {
        setPassMessage({ type: 'error', text: "Lütfen tüm şifre alanlarını doldurun." });
        return;
    }

    const actualCurrentPass = user.password || "1234";
    if (currentPass !== actualCurrentPass) {
        setPassMessage({ type: 'error', text: "Mevcut şifrenizi yanlış girdiniz." });
        return;
    }

    if (newPass !== confirmPass) {
        setPassMessage({ type: 'error', text: "Yeni şifreler birbiriyle eşleşmiyor." });
        return;
    }

    if (newPass.length < 4) {
        setPassMessage({ type: 'error', text: "Yeni şifre en az 4 karakter olmalıdır." });
        return;
    }

    updateField('password', newPass);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassMessage({ type: 'success', text: "Şifreniz başarıyla güncellendi." });
    
    setTimeout(() => {
        setPassMessage(null);
    }, 4000);
  };

  return (
    <div className="pb-24 px-4 pt-6 space-y-6 max-w-lg mx-auto animate-in fade-in">
      <div className="flex items-center justify-between mb-4 p-2">
        <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-matrix-500 to-matrix-600 dark:from-matrix-900 dark:to-matrix-800 rounded-full flex items-center justify-center border border-matrix-500/30 text-white dark:text-matrix-500 shadow-lg shadow-matrix-900/20 dark:shadow-matrix-900/50">
                <User size={28} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Ayarlar</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{user.fullName}</p>
            </div>
        </div>
        
        {/* Theme Toggle */}
        <button 
            onClick={onToggleTheme}
            className="p-3 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-300 shadow-sm transition-all active:scale-95"
            aria-label="Temayı Değiştir"
        >
            {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* ALERT BANNER for Unverified Email */}
      {!user.isEmailVerified && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/40 p-4 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
            <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
            </div>
            <div>
                <h4 className="text-red-600 dark:text-red-400 font-bold text-sm">Dikkat Gerekiyor</h4>
                <p className="text-red-500/90 dark:text-red-300/80 text-xs">Lütfen e-posta adresinizi doğrulayın.</p>
            </div>
        </div>
      )}

      {/* 1. Email Verification Section */}
      <section className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm shadow-sm relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-5 dark:opacity-10">
            <Mail size={80} className="text-matrix-600 dark:text-matrix-500" />
        </div>
        
        <label className="block text-sm font-medium text-matrix-700 dark:text-matrix-200 mb-2">E-posta Adresi (Doğrulama)</label>
        <div className="flex gap-2 mb-2 relative z-10">
            <div className="relative flex-1">
                <input
                    type="email"
                    value={user.email || 'E-posta girilmemiş'}
                    readOnly
                    disabled
                    className={`w-full bg-slate-50 dark:bg-dark-input/50 border ${user.isEmailVerified ? 'border-matrix-500/50' : 'border-slate-300 dark:border-gray-700'} text-slate-900 dark:text-gray-300 rounded-xl p-3 pl-10 cursor-not-allowed select-none transition-colors`}
                />
                <Lock className="absolute left-3 top-3.5 text-slate-400 dark:text-gray-500" size={16} />
            </div>

            {user.isEmailVerified ? (
                <div className="flex items-center justify-center px-4 bg-matrix-100 dark:bg-matrix-500/20 border border-matrix-200 dark:border-matrix-500/30 rounded-xl">
                    <Check className="text-matrix-600 dark:text-matrix-500" size={20}/>
                </div>
            ) : (
                <button 
                    onClick={handleSendCode}
                    disabled={isVerifyingEmail || !user.email}
                    className="bg-matrix-600 hover:bg-matrix-500 text-white px-4 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-matrix-900/20 whitespace-nowrap"
                >
                    {isVerifyingEmail ? '...' : 'Doğrula'}
                </button>
            )}
        </div>
        
        {!user.isEmailVerified && user.email && (
            <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 ml-1">
                * E-posta adresi "Kayıt" sayfasından değiştirilebilir.
            </p>
        )}

        {showVerificationInput && !user.isEmailVerified && (
            <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6 haneli kod"
                maxLength={6}
                className="flex-1 bg-slate-50 dark:bg-dark-input border border-slate-300 dark:border-gray-700 rounded-xl p-2 text-sm text-slate-900 dark:text-white focus:border-matrix-500 outline-none transition-colors"
                />
                <button onClick={handleVerifyCode} className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-700 dark:hover:bg-gray-200 px-4 rounded-xl text-sm font-bold transition-colors">
                Onayla
                </button>
            </div>
        )}
      </section>

      {/* 2. Communication Preferences */}
      <section className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm space-y-5 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 mb-1">
            <Phone size={18} />
            <h3 className="font-semibold text-sm">Kayıp Durumunda İletişim Tercihi</h3>
        </div>

        <div className="space-y-3">
            {/* Email Checkbox (Always On) */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-dark-input/50 rounded-xl border border-slate-200 dark:border-gray-700 opacity-80 cursor-not-allowed">
                <div className="w-5 h-5 rounded bg-matrix-500 text-black flex items-center justify-center border border-matrix-500">
                    <Check size={14} strokeWidth={3} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200">E-posta</p>
                    <p className="text-xs text-slate-500 truncate">{user.email || 'Tanımlanmamış'}</p>
                </div>
            </div>

            {/* Phone Checkbox */}
            <div 
                onClick={() => setIsPhoneChecked(!isPhoneChecked)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isPhoneChecked ? 'bg-matrix-50 dark:bg-matrix-900/20 border-matrix-200 dark:border-matrix-500/50' : 'bg-white dark:bg-dark-input border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'}`}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPhoneChecked ? 'bg-matrix-500 border-matrix-500 text-black' : 'bg-transparent border-slate-400 dark:border-gray-500'}`}>
                    {isPhoneChecked && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200">Telefon</p>
                    <p className="text-xs text-slate-500">Daha hızlı iletişim için önerilir</p>
                </div>
            </div>

            {isPhoneChecked && (
                <div className="animate-in slide-in-from-top-2 pt-1 pl-1">
                    <Input
                        type="tel"
                        placeholder="0555 555 55 55"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(formatPhoneNumber(e.target.value))}
                        className="!mb-0"
                    />
                </div>
            )}

            <div className="pt-2">
                <button 
                    onClick={handleSavePreferences}
                    className="w-full bg-matrix-600 hover:bg-matrix-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-matrix-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Save size={18} />
                    Tercihleri Kaydet
                </button>
            </div>

            {prefMessage && (
                <div className={`text-center text-sm font-medium animate-in fade-in slide-in-from-top-1 ${prefMessage.includes('başarıyla') ? 'text-matrix-600 dark:text-matrix-400' : 'text-red-500 dark:text-red-400'}`}>
                    {prefMessage}
                </div>
            )}
        </div>
      </section>

      {/* 3. Emergency Contact (Redesigned & Moved Up) */}
      <section className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm shadow-sm space-y-4 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-2 text-red-500 dark:text-red-400">
            <Shield size={18} />
            <h3 className="font-semibold text-sm">Acil Durum Kişisi (2. Kişi - Opsiyonel)</h3>
        </div>

        {/* Name Field */}
        <div className="space-y-4">
            <Input 
                placeholder="İsim Soyisim (Opsiyonel)"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="!mb-0"
                rightElement={<Users size={18} className="text-slate-400 dark:text-gray-500" />}
            />

            {/* Emergency Email Checkbox */}
            <div 
                onClick={() => setIsEmEmailChecked(!isEmEmailChecked)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isEmEmailChecked ? 'bg-matrix-50 dark:bg-matrix-900/20 border-matrix-200 dark:border-matrix-500/50' : 'bg-white dark:bg-dark-input border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'}`}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isEmEmailChecked ? 'bg-matrix-500 border-matrix-500 text-black' : 'bg-transparent border-slate-400 dark:border-gray-500'}`}>
                    {isEmEmailChecked && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200">E-posta</p>
                </div>
            </div>
            {isEmEmailChecked && (
                <div className="animate-in slide-in-from-top-2 pt-1 pl-1">
                     <Input 
                        type="email"
                        placeholder="acil@ornek.com"
                        value={emEmail}
                        onChange={(e) => setEmEmail(e.target.value)}
                        className="!mb-0"
                    />
                </div>
            )}

            {/* Emergency Phone Checkbox */}
            <div 
                onClick={() => setIsEmPhoneChecked(!isEmPhoneChecked)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isEmPhoneChecked ? 'bg-matrix-50 dark:bg-matrix-900/20 border-matrix-200 dark:border-matrix-500/50' : 'bg-white dark:bg-dark-input border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'}`}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isEmPhoneChecked ? 'bg-matrix-500 border-matrix-500 text-black' : 'bg-transparent border-slate-400 dark:border-gray-500'}`}>
                    {isEmPhoneChecked && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200">Telefon</p>
                </div>
            </div>
            {isEmPhoneChecked && (
                <div className="animate-in slide-in-from-top-2 pt-1 pl-1">
                     <Input 
                        type="tel"
                        placeholder="0555 555 55 55"
                        value={emPhone}
                        onChange={(e) => setEmPhone(formatPhoneNumber(e.target.value))}
                        className="!mb-0"
                    />
                </div>
            )}

             <div className="pt-2">
                <button 
                    onClick={handleSaveEmergency}
                    className="w-full bg-matrix-600 hover:bg-matrix-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-matrix-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Save size={18} />
                    Acil Durum Kişisi Kaydet
                </button>
            </div>

            {emMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 ${
                    emMessage.type === 'success' 
                    ? 'bg-matrix-100 dark:bg-matrix-500/10 text-matrix-700 dark:text-matrix-400 border border-matrix-200 dark:border-matrix-500/20' 
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                }`}>
                    {emMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="font-medium">{emMessage.text}</span>
                </div>
            )}
        </div>
      </section>

      {/* 4. Password Change Section (Moved to Bottom) */}
      <section className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm space-y-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 mb-2 text-matrix-600 dark:text-matrix-400">
            <KeyRound size={18} />
            <h3 className="font-semibold text-sm">Güvenlik / Şifre Değiştir</h3>
        </div>
        
        <div className="space-y-3">
            <Input 
                type="password"
                placeholder="Mevcut Şifre"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="!mb-0 text-sm"
            />
             <Input 
                type="password"
                placeholder="Yeni Şifre"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="!mb-0 text-sm"
            />
             <Input 
                type="password"
                placeholder="Yeni Şifre (Tekrar)"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="!mb-0 text-sm"
            />
            
            <button 
                onClick={handleChangePassword}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-gray-200 border border-slate-300 dark:border-gray-700 py-3 rounded-xl text-sm font-semibold transition-colors mt-2"
            >
                Şifreyi Güncelle
            </button>

            {/* Feedback Message */}
            {passMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 ${
                    passMessage.type === 'success' 
                    ? 'bg-matrix-100 dark:bg-matrix-500/10 text-matrix-700 dark:text-matrix-400 border border-matrix-200 dark:border-matrix-500/20' 
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                }`}>
                    {passMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="font-medium">{passMessage.text}</span>
                </div>
            )}
        </div>
      </section>
    </div>
  );
};
