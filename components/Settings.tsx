
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
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMessage, setPassMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [isPhoneChecked, setIsPhoneChecked] = useState(
    user.contactPreference === ContactPreference.BOTH || 
    user.contactPreference === ContactPreference.PHONE
  );
  const [tempPhone, setTempPhone] = useState(user.phone || '');
  const [prefMessage, setPrefMessage] = useState<string | null>(null);

  const [emergencyName, setEmergencyName] = useState(user.emergencyContactName || '');
  const [isEmEmailChecked, setIsEmEmailChecked] = useState(!!user.emergencyContactEmail);
  const [isEmPhoneChecked, setIsEmPhoneChecked] = useState(!!user.emergencyContactPhone);
  const [emEmail, setEmEmail] = useState(user.emergencyContactEmail || '');
  const [emPhone, setEmPhone] = useState(user.emergencyContactPhone || '');
  const [emMessage, setEmMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


  const updateField = (field: keyof UserProfile, value: any) => {
    onUpdateUser({ ...user, [field]: value });
  };

  const handleSendCode = async () => {
    if (!user.email || !user.email.includes('@')) {
      alert("Profil sayfasında geçerli bir e-posta tanımlanmamış.");
      return;
    }
    setIsVerifyingEmail(true);
    await sendEmailVerification(user.email);
    setIsVerifyingEmail(false);
    setShowVerificationInput(true);
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
    const dataToSave = {
        emergencyContactName: emergencyName.trim(),
        emergencyContactEmail: isEmEmailChecked ? emEmail.trim() : undefined,
        emergencyContactPhone: isEmPhoneChecked ? emPhone.trim() : undefined
    };
    onUpdateUser({ ...user, ...dataToSave });
    setEmMessage({ type: 'success', text: "Acil durum kişisi güncellendi." });
    setTimeout(() => setEmMessage(null), 3000);
  };

  const handleChangePassword = () => {
    setPassMessage(null);
    if (!currentPass || !newPass || !confirmPass) {
        setPassMessage({ type: 'error', text: "Lütfen tüm şifre alanlarını doldurun." });
        return;
    }
    const actualCurrentPass = String(user.password || "").trim();
    const inputCurrentPass = String(currentPass).trim();
    if (inputCurrentPass !== actualCurrentPass) {
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
    setTimeout(() => setPassMessage(null), 4000);
  };

  return (
    <div className="pb-32 px-4 pt-8 space-y-6 max-w-lg mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-md text-matrix-600 dark:text-matrix-400">
                <User size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Ayarlar</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{user.fullName}</p>
            </div>
        </div>
        
        <button 
            onClick={onToggleTheme}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-all active:scale-95"
        >
            {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* ALERT BANNER */}
      {!user.isEmailVerified && (
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
                <h4 className="text-red-800 dark:text-red-200 font-bold text-sm">E-posta Doğrulanmadı</h4>
                <p className="text-red-600 dark:text-red-300 text-xs mt-0.5">Hesap güvenliği için doğrulama yapmanız önerilir.</p>
            </div>
        </div>
      )}

      {/* 1. Email Verification */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05]">
            <Mail size={100} />
        </div>
        
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-4 flex items-center gap-2">
            <Lock size={16} className="text-matrix-500" /> Hesap Doğrulama
        </h3>

        <div className="flex gap-2 mb-2 relative z-10">
            <div className="relative flex-1">
                <input
                    type="email"
                    value={user.email || 'E-posta yok'}
                    readOnly
                    disabled
                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${user.isEmailVerified ? 'border-emerald-200 dark:border-emerald-900' : 'border-slate-200 dark:border-slate-700'} text-slate-700 dark:text-slate-300 rounded-xl p-3.5 pl-4 text-sm font-medium`}
                />
            </div>

            {user.isEmailVerified ? (
                <div className="flex items-center justify-center px-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                    <Check className="text-emerald-600 dark:text-emerald-400" size={20}/>
                </div>
            ) : (
                <button 
                    onClick={handleSendCode}
                    disabled={isVerifyingEmail || !user.email}
                    className="bg-matrix-600 hover:bg-matrix-700 text-white px-5 rounded-xl text-sm font-bold shadow-lg shadow-matrix-500/20 transition-all active:scale-95"
                >
                    {isVerifyingEmail ? '...' : 'Doğrula'}
                </button>
            )}
        </div>
        
        {showVerificationInput && !user.isEmailVerified && (
            <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
                <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6 haneli kod"
                maxLength={6}
                className="flex-1 bg-white dark:bg-slate-800 border border-matrix-300 dark:border-matrix-700 rounded-xl p-3 text-sm text-center font-bold tracking-widest outline-none focus:ring-2 focus:ring-matrix-500"
                />
                <button onClick={handleVerifyCode} className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-5 rounded-xl text-sm font-bold">
                Onayla
                </button>
            </div>
        )}
      </section>

      {/* 2. Communication Preferences */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-2 flex items-center gap-2">
            <Phone size={16} className="text-red-500" /> Kayıp İletişim Tercihi
        </h3>

        <div className="space-y-3">
            {/* Email (Fixed) */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 opacity-70">
                <div className="w-5 h-5 rounded bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-white">
                    <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">E-posta (Zorunlu)</span>
            </div>

            {/* Phone Toggle */}
            <div 
                onClick={() => setIsPhoneChecked(!isPhoneChecked)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isPhoneChecked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPhoneChecked ? 'bg-matrix-600 border-matrix-600 text-white' : 'bg-transparent border-slate-300 dark:border-slate-600'}`}>
                    {isPhoneChecked && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Telefon Numarası Göster</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Bulan kişi sizi arayabilir</p>
                </div>
            </div>

            {isPhoneChecked && (
                <div className="animate-in slide-in-from-top-2 pt-1">
                    <Input
                        type="tel"
                        placeholder="0555 555 55 55"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(formatPhoneNumber(e.target.value))}
                        className="!mb-0"
                    />
                </div>
            )}

            <button 
                onClick={handleSavePreferences}
                className="w-full mt-2 bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
            >
                Tercihleri Kaydet
            </button>

            {prefMessage && (
                <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    {prefMessage}
                </div>
            )}
        </div>
      </section>

      {/* 3. Emergency Contact */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
            <Shield size={16} className="text-orange-500" /> Acil Durum Kişisi (Yedek)
        </h3>

        <Input 
            label="İsim Soyisim"
            placeholder="Kişi Adı"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            className="!mb-0"
        />

        <div className="grid grid-cols-2 gap-3">
             {/* Email Check */}
             <div 
                onClick={() => setIsEmEmailChecked(!isEmEmailChecked)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${isEmEmailChecked ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
             >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isEmEmailChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                    {isEmEmailChecked && <Check size={10} strokeWidth={4} />}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">E-posta</span>
            </div>

            {/* Phone Check */}
             <div 
                onClick={() => setIsEmPhoneChecked(!isEmPhoneChecked)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${isEmPhoneChecked ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
             >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isEmPhoneChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                    {isEmPhoneChecked && <Check size={10} strokeWidth={4} />}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefon</span>
            </div>
        </div>

        {isEmEmailChecked && (
             <Input 
                type="email"
                placeholder="Yedek E-posta"
                value={emEmail}
                onChange={(e) => setEmEmail(e.target.value)}
                className="!mb-0"
            />
        )}
        {isEmPhoneChecked && (
             <Input 
                type="tel"
                placeholder="Yedek Telefon"
                value={emPhone}
                onChange={(e) => setEmPhone(formatPhoneNumber(e.target.value))}
                className="!mb-0"
            />
        )}

        <button 
            onClick={handleSaveEmergency}
            className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
        >
            Kaydet
        </button>

        {emMessage && (
            <div className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold animate-in fade-in ${emMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {emMessage.text}
            </div>
        )}
      </section>

      {/* 4. Password Change */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
            <KeyRound size={16} className="text-purple-500" /> Şifre Değiştir
        </h3>
        
        <div className="space-y-4">
            <Input 
                type="password"
                placeholder="Mevcut Şifre"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="!mb-0"
            />
             <Input 
                type="password"
                placeholder="Yeni Şifre"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="!mb-0"
            />
             <Input 
                type="password"
                placeholder="Yeni Şifre (Tekrar)"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="!mb-0"
            />
            
            <button 
                onClick={handleChangePassword}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 py-3 rounded-xl text-sm font-bold transition-colors"
            >
                Şifreyi Güncelle
            </button>

            {passMessage && (
                <div className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold animate-in fade-in ${passMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {passMessage.text}
                </div>
            )}
        </div>
      </section>
    </div>
  );
};
