import React, { useState, useEffect } from 'react';
import { UserProfile, PetProfile, PetType, PrivacyField } from '../types';
import { TURKEY_CITIES, CITY_NAMES, TEMPERAMENT_OPTIONS, formatPhoneNumber } from '../constants';
import { Input } from './ui/Input';
import { PrivacyToggle } from './ui/Toggle';
import { 
  Camera, ChevronDown, Dog, Home, Save, ShieldAlert, User, Edit2, ShieldCheck, UserCheck, Activity, Loader2
} from 'lucide-react';
import { uploadPetPhoto } from '../services/dbService';

interface PetFormProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  initialPetData: PetProfile | null;
  onSave: (data: PetProfile) => void;
}

export const PetForm: React.FC<PetFormProps> = ({ user, onUpdateUser, initialPetData, onSave }) => {
  const isEditMode = !!initialPetData;

  const [petData, setPetData] = useState<PetProfile>({
    id: crypto.randomUUID(),
    name: { value: '', isPublic: true },
    type: PetType.DOG,
    photoUrl: { value: null, isPublic: true },
    features: { value: '', isPublic: true },
    sizeInfo: { value: '', isPublic: true },
    temperament: { value: '', isPublic: true },
    healthWarning: { value: '', isPublic: true },
    microchip: '',
    vetInfo: { value: '', isPublic: true }, 
  });

  const [isCustomTemperament, setIsCustomTemperament] = useState(false);
  const [customPetType, setCustomPetType] = useState('');
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    if (initialPetData) {
        // Check if the loaded type is one of the standard enums
        const isStandardType = Object.values(PetType).includes(initialPetData.type as PetType);

        if (isStandardType) {
             setPetData(initialPetData);
             setCustomPetType(''); // Reset custom input if standard
        } else {
             // It's a custom type (e.g. "Kuş", "Hamster")
             setPetData({
                ...initialPetData,
                type: PetType.OTHER // Visually select "Other"
             });
             setCustomPetType(initialPetData.type); // Fill the input box
        }
    }
  }, [initialPetData]);

  const [errors, setErrors] = useState<{
    fullName?: boolean;
    email?: boolean;
    city?: boolean;
    district?: boolean;
    petName?: boolean;
    photo?: boolean;
    customPetType?: boolean;
  }>({});

  const updatePetField = <K extends keyof PetProfile>(key: K, fieldKey: 'value' | 'isPublic', value: any) => {
    if (key === 'name') setErrors(prev => ({ ...prev, petName: false }));
    if (key === 'photoUrl') setErrors(prev => ({ ...prev, photo: false }));

    setPetData(prev => {
        const currentField = prev[key];
        if (typeof currentField === 'object' && currentField !== null && 'value' in currentField) {
            return {
                ...prev,
                [key]: { ...currentField, [fieldKey]: value }
            };
        }
        return { ...prev, [key]: value };
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateUser({ ...user, city: e.target.value, district: '' });
    setErrors(prev => ({ ...prev, city: false, district: false }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      
      const publicUrl = await uploadPetPhoto(file);
      setUploading(false);

      if (publicUrl) {
        updatePetField('photoUrl', 'value', publicUrl);
      } else {
        alert("Fotoğraf yüklenirken bir hata oluştu.");
      }
    }
  };

  const handleTemperamentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsCustomTemperament(true);
      updatePetField('temperament', 'value', ''); 
    } else {
      setIsCustomTemperament(false);
      updatePetField('temperament', 'value', val);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!user.fullName?.trim()) {
        newErrors.fullName = true;
        isValid = false;
    }
    if (!user.email?.trim()) {
        newErrors.email = true;
        isValid = false;
    }
    if (!user.city) {
        newErrors.city = true;
        isValid = false;
    }
    if (!user.district) {
        newErrors.district = true;
        isValid = false;
    }
    if (!petData.name.value?.trim()) {
        newErrors.petName = true;
        isValid = false;
    }
    if (!petData.photoUrl.value) {
        newErrors.photo = true;
        isValid = false;
    }
    if (petData.type === PetType.OTHER && !customPetType.trim()) {
        newErrors.customPetType = true;
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Lütfen zorunlu alanları (kırmızı ile işaretli) doldurun.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prepare data for saving
    const finalData = { ...petData };

    // FIX: If "Other" is selected, overwrite the 'type' field with the custom input text
    if (petData.type === PetType.OTHER) {
        finalData.type = customPetType;
    }

    onSave(finalData);
  };

  const currentSelectValue = TEMPERAMENT_OPTIONS.includes(petData.temperament?.value || '') 
    ? petData.temperament?.value 
    : (isCustomTemperament || petData.temperament?.value ? 'OTHER' : '');

  const districtOptions = user.city && TURKEY_CITIES[user.city] 
    ? [...TURKEY_CITIES[user.city], "Diğer"] 
    : ["Diğer"];

  return (
    <div className="pb-24 pt-6">
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="text-matrix-600 dark:text-matrix-500" size={28} />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
                {isEditMode ? 'Profil Bilgileri' : 'Evcil Hayvan Kaydı'}
            </h2>
        </div>
        <p className="text-slate-500 dark:text-gray-400 text-sm">
            {isEditMode 
                ? 'Bilgileri güncel tutmak güvenli kavuşma için çok önemlidir.'
                : 'Olası bir kayıp durumunda hızlı müdahale için bilgilerini şimdiden kaydedelim.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-6 max-w-lg mx-auto">
        
        {/* --- Section 1: Owner Info --- */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 text-matrix-600 dark:text-matrix-400">
                <UserCheck size={18} />
                <h3 className="font-semibold text-base">Sahip Bilgileri</h3>
            </div>
            <div className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm space-y-4 shadow-sm transition-colors duration-300">
                <Input 
                    label="Adı - Soyadı"
                    placeholder="Adınız Soyadınız"
                    value={user.fullName || ''}
                    onChange={(e) => {
                        onUpdateUser({...user, fullName: e.target.value});
                        setErrors(prev => ({...prev, fullName: false}));
                    }}
                    required
                    disabled={isEditMode}
                    className={isEditMode ? "opacity-60 cursor-not-allowed" : ""}
                    error={errors.fullName ? "Bu alan zorunludur" : undefined}
                />
                <Input 
                    label="E-posta Adresi"
                    type="email"
                    placeholder="ornek@email.com"
                    value={user.email || ''}
                    onChange={(e) => {
                        onUpdateUser({...user, email: e.target.value});
                        setErrors(prev => ({...prev, email: false}));
                    }}
                    required
                    disabled={isEditMode}
                    className={isEditMode ? "opacity-60 cursor-not-allowed" : ""}
                    error={errors.email ? "Bu alan zorunludur" : undefined}
                />
            </div>
        </section>

        {/* --- Section 2: Residence --- */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 text-matrix-600 dark:text-matrix-400">
                <Home size={18} />
                <h3 className="font-semibold text-base">İkamet / Konum Bilgisi</h3>
            </div>
            <div className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm grid grid-cols-2 gap-4 shadow-sm transition-colors duration-300">
                <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-matrix-200 mb-1">
                        İl <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <select 
                            className={`
                                w-full bg-slate-50 dark:bg-dark-input border rounded-xl p-3 text-sm appearance-none text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-matrix-500/50 transition-all
                                ${errors.city ? 'border-red-500/50' : 'border-slate-300 dark:border-gray-700'}
                            `}
                            value={user.city || ''}
                            onChange={handleCityChange}
                        >
                            <option value="">Seçiniz</option>
                            {CITY_NAMES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={16} />
                    </div>
                    {errors.city && <p className="mt-1 text-[10px] text-red-500 dark:text-red-400">Zorunlu</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-matrix-200 mb-1">
                        İlçe <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <select 
                            className={`
                                w-full bg-slate-50 dark:bg-dark-input border rounded-xl p-3 text-sm appearance-none text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-matrix-500/50 transition-all
                                ${errors.district ? 'border-red-500/50' : 'border-slate-300 dark:border-gray-700'}
                            `}
                            value={user.district || ''}
                            onChange={(e) => {
                                onUpdateUser({...user, district: e.target.value});
                                setErrors(prev => ({...prev, district: false}));
                            }}
                            disabled={!user.city}
                        >
                            <option value="">Seçiniz</option>
                            {user.city && districtOptions.map(dist => (
                                <option key={dist} value={dist}>{dist}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={16} />
                    </div>
                    {errors.district && <p className="mt-1 text-[10px] text-red-500 dark:text-red-400">Zorunlu</p>}
                </div>
            </div>
        </section>

        {/* --- Section 3: Pet Info --- */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-matrix-600 dark:text-matrix-400">
                <Dog size={18} />
                <h3 className="font-semibold text-base">Dostumuzun Kimlik Kartı</h3>
            </div>

            {/* Part 1: Basic Identity (Light BG) */}
            <div className="bg-white dark:bg-dark-surface/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-800/60 backdrop-blur-sm space-y-6 shadow-sm transition-colors duration-300">
                
                {/* 1. Pet Type */}
                <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-matrix-200 mb-2">Türü</label>
                    <div className="flex flex-col gap-2">
                        <div className="flex rounded-xl bg-slate-100 dark:bg-dark-input border border-slate-300 dark:border-gray-700 p-1.5 transition-colors">
                            {Object.values(PetType).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => updatePetField('type', 'value', type)}
                                    className={`flex-1 text-sm py-2.5 rounded-lg transition-all font-medium ${petData.type === type ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-md' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {petData.type === PetType.OTHER && (
                            <div className="animate-in slide-in-from-top-2 fade-in">
                                <Input 
                                    placeholder="Lütfen hayvan türünü belirtin (Örn: Kuş, Hamster)"
                                    value={customPetType}
                                    onChange={(e) => {
                                        setCustomPetType(e.target.value);
                                        setErrors(prev => ({...prev, customPetType: false}));
                                    }}
                                    className="!mb-0"
                                    error={errors.customPetType ? "Lütfen türü belirtin" : undefined}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Pet Name */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-matrix-200">Hayvanın Adı <span className="text-red-500 dark:text-red-400">*</span></label>
                        <PrivacyToggle 
                            isPublic={petData.name.isPublic} 
                            onChange={(val) => updatePetField('name', 'isPublic', val)} 
                        />
                    </div>
                    <Input 
                        value={petData.name.value} 
                        onChange={(e) => updatePetField('name', 'value', e.target.value)}
                        placeholder="Örn: Pamuk"
                        className="!mb-0"
                        error={errors.petName ? "Bu alan zorunludur" : undefined}
                    />
                </div>

                {/* 3. Photo Upload */}
                <div className="text-center">
                    <div className="relative inline-block w-full">
                        <label 
                            htmlFor="pet-photo" 
                            className={`
                                flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden relative group
                                ${errors.photo 
                                    ? 'border-red-500/50 bg-red-50 dark:bg-red-900/10' 
                                    : (petData.photoUrl.value 
                                        ? 'border-matrix-500/50 bg-black' 
                                        : 'border-slate-300 dark:border-gray-700 hover:border-matrix-400/50 bg-slate-50 dark:bg-dark-input hover:bg-slate-100 dark:hover:bg-gray-800/50')}
                            `}
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center justify-center text-matrix-600 dark:text-matrix-400">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <span className="text-sm font-medium">Yükleniyor...</span>
                                </div>
                            ) : petData.photoUrl.value ? (
                                <img src={petData.photoUrl.value} alt="Pet Preview" className="w-full h-full object-contain" />
                            ) : (
                                <>
                                    <div className="p-4 rounded-full bg-slate-200 dark:bg-gray-800/50 mb-3 group-hover:bg-slate-300 dark:group-hover:bg-gray-800 transition-colors">
                                        <Camera size={32} className={errors.photo ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-gray-500 group-hover:text-matrix-600 dark:group-hover:text-matrix-400"} />
                                    </div>
                                    <span className={`text-sm ${errors.photo ? "text-red-500 dark:text-red-400 font-semibold" : "text-slate-500 dark:text-gray-400"}`}>
                                        {errors.photo ? "Fotoğraf Yüklemek Zorunludur" : "Fotoğraf Yükle (Zorunlu)"}
                                    </span>
                                </>
                            )}
                            <input 
                                id="pet-photo" 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handlePhotoUpload}
                                disabled={uploading}
                            />
                            
                            <div className="absolute top-2 right-2">
                                <PrivacyToggle 
                                    isPublic={petData.photoUrl.isPublic} 
                                    onChange={(val) => updatePetField('photoUrl', 'isPublic', val)} 
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Part 2: Detailed Specs (Darker BG) */}
            <div className="bg-slate-50 dark:bg-gray-900/80 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-6 shadow-md transition-colors duration-300">
                <div className="flex items-center gap-2 text-matrix-600/80 dark:text-matrix-500/80 pb-2 border-b border-slate-300 dark:border-gray-800">
                    <Activity size={16} />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Detaylı Bilgiler</h4>
                </div>

                {/* 4. Other Details */}
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-600 dark:text-gray-400">Renk / Özellikler</label>
                            <PrivacyToggle isPublic={petData.features?.isPublic || false} onChange={(v) => updatePetField('features', 'isPublic', v)} />
                        </div>
                        <Input 
                            value={petData.features?.value} 
                            onChange={(e) => updatePetField('features', 'value', e.target.value)}
                            placeholder="Siyah benekli, sol kulak kesik..."
                            className="!mb-0 !bg-white dark:!bg-black/40 !border-slate-300 dark:!border-gray-800 focus:!border-matrix-500/50"
                        />
                    </div>

                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-600 dark:text-gray-400">Boy / Kilo (Yaklaşık)</label>
                            <PrivacyToggle isPublic={petData.sizeInfo?.isPublic || false} onChange={(v) => updatePetField('sizeInfo', 'isPublic', v)} />
                        </div>
                        <Input 
                            value={petData.sizeInfo?.value} 
                            onChange={(e) => updatePetField('sizeInfo', 'value', e.target.value)}
                            placeholder="Orta boy, 15kg civarı"
                            className="!mb-0 !bg-white