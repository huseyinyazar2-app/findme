
import React, { useState, useEffect } from 'react';
import { UserProfile, PetProfile, PetType } from '../types';
import { TURKEY_CITIES, CITY_NAMES, TEMPERAMENT_OPTIONS, formatPhoneNumber } from '../constants';
import { Input } from './ui/Input';
import { PrivacyToggle } from './ui/Toggle';
import { 
  Camera, ChevronDown, Dog, Home, Save, ShieldAlert, UserCheck, Activity, Loader2, ShieldCheck
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
        const isStandardType = Object.values(PetType).includes(initialPetData.type as PetType);

        if (isStandardType) {
             setPetData(initialPetData);
             setCustomPetType(''); 
        } else {
             setPetData({
                ...initialPetData,
                type: PetType.OTHER 
             });
             setCustomPetType(initialPetData.type); 
        }
        
        if (initialPetData.temperament?.value && !TEMPERAMENT_OPTIONS.includes(initialPetData.temperament.value)) {
            setIsCustomTemperament(true);
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
        if (currentField && typeof currentField === 'object' && 'value' in currentField) {
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

    const finalData = { ...petData };
    if (petData.type === PetType.OTHER) {
        finalData.type = customPetType;
    }

    onSave(finalData);
  };

  const currentSelectValue = TEMPERAMENT_OPTIONS.includes(petData.temperament?.value || '') 
    ? petData.temperament?.value 
    : (isCustomTemperament || (petData.temperament?.value && petData.temperament.value.length > 0) ? 'OTHER' : '');

  const districtOptions = user.city && TURKEY_CITIES[user.city] 
    ? [...TURKEY_CITIES[user.city], "Diğer"] 
    : ["Diğer"];

  return (
    <div className="pb-32 pt-8">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700 text-matrix-600 dark:text-matrix-400">
                <ShieldCheck size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isEditMode ? 'Bilgileri Güncelle' : 'Hayvan Kaydı'}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
                    {isEditMode ? 'Profil bilgilerini yönetin' : 'Yeni bir profil oluşturun'}
                </p>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-6 max-w-lg mx-auto">
        
        {/* --- Section 1: Owner Info --- */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                 <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                     <UserCheck size={18} />
                 </div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Sahip Bilgileri</h3>
             </div>
             
             <div className="p-6 space-y-5">
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
                    className={isEditMode ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}
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
                    className={isEditMode ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}
                    error={errors.email ? "Bu alan zorunludur" : undefined}
                />
             </div>
        </section>

        {/* --- Section 2: Residence --- */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                 <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-lg text-orange-600 dark:text-orange-400">
                     <Home size={18} />
                 </div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Konum Bilgisi</h3>
             </div>

             <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase ml-1">
                        İl <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select 
                            className={`
                                w-full bg-white dark:bg-slate-800 border rounded-xl p-3.5 text-sm appearance-none text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-matrix-100 dark:focus:ring-matrix-900 focus:border-matrix-500 transition-all shadow-sm
                                ${errors.city ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                            `}
                            value={user.city || ''}
                            onChange={handleCityChange}
                        >
                            <option value="">Seçiniz</option>
                            {CITY_NAMES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase ml-1">
                        İlçe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select 
                            className={`
                                w-full bg-white dark:bg-slate-800 border rounded-xl p-3.5 text-sm appearance-none text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-matrix-100 dark:focus:ring-matrix-900 focus:border-matrix-500 transition-all shadow-sm
                                ${errors.district ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
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
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
            </div>
        </section>

        {/* --- Section 3: Pet Info --- */}
        <section className="space-y-4">
            {/* Part 1: Basic Identity (Card) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                     <div className="bg-matrix-100 dark:bg-matrix-900/30 p-1.5 rounded-lg text-matrix-600 dark:text-matrix-400">
                         <Dog size={18} />
                     </div>
                     <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Hayvan Kimliği</h3>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Pet Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase ml-1">Türü</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
                                {Object.values(PetType).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => updatePetField('type', 'value', type)}
                                        className={`flex-1 text-sm py-3 rounded-lg transition-all font-bold ${petData.type === type ? 'bg-white dark:bg-slate-700 text-matrix-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            {petData.type === PetType.OTHER && (
                                <Input 
                                    placeholder="Lütfen türü belirtin (Örn: Kuş)"
                                    value={customPetType}
                                    onChange={(e) => {
                                        setCustomPetType(e.target.value);
                                        setErrors(prev => ({...prev, customPetType: false}));
                                    }}
                                    className="!mb-0 animate-in slide-in-from-top-2"
                                    error={errors.customPetType ? "Lütfen türü belirtin" : undefined}
                                />
                            )}
                        </div>
                    </div>

                    {/* Pet Name */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1">Adı <span className="text-red-500">*</span></label>
                            <PrivacyToggle 
                                isPublic={petData.name.isPublic} 
                                onChange={(val) => updatePetField('name', 'isPublic', val)} 
                            />
                        </div>
                        <Input 
                            value={petData.name.value} 
                            onChange={(e) => updatePetField('name', 'value', e.target.value)}
                            placeholder="Örn: Pamuk"
                            className="!mb-0 text-lg font-bold"
                            error={errors.petName ? "Bu alan zorunludur" : undefined}
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                         <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase ml-1">Fotoğraf <span className="text-red-500">*</span></label>
                         <div className="relative group">
                            <label 
                                htmlFor="pet-photo" 
                                className={`
                                    flex flex-col items-center justify-center w-full aspect-[4/3] rounded-2xl cursor-pointer transition-all overflow-hidden border-2 border-dashed
                                    ${errors.photo 
                                        ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                                        : (petData.photoUrl.value 
                                            ? 'border-matrix-500 bg-slate-900' 
                                            : 'border-slate-300 dark:border-slate-700 hover:border-matrix-400 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700')}
                                `}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2 text-matrix-600 dark:text-matrix-400">
                                        <Loader2 className="animate-spin" size={32} />
                                        <span className="text-xs font-bold uppercase">Yükleniyor...</span>
                                    </div>
                                ) : petData.photoUrl.value ? (
                                    <img src={petData.photoUrl.value} alt="Pet Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <div className="p-4 rounded-full bg-slate-200 dark:bg-slate-700 mb-3 group-hover:scale-110 transition-transform">
                                            <Camera size={28} className="text-slate-500 dark:text-slate-300" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fotoğraf Seçin</span>
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
                            </label>
                            
                            <div className="absolute top-3 right-3">
                                <PrivacyToggle 
                                    isPublic={petData.photoUrl.isPublic} 
                                    onChange={(val) => updatePetField('photoUrl', 'isPublic', val)} 
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Part 2: Detailed Specs (Card) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                     <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg text-purple-600 dark:text-purple-400">
                         <Activity size={18} />
                     </div>
                     <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Fiziksel Detaylar</h3>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1">Renk / Özellikler</label>
                            <PrivacyToggle isPublic={petData.features?.isPublic || false} onChange={(v) => updatePetField('features', 'isPublic', v)} />
                        </div>
                        <Input 
                            value={petData.features?.value} 
                            onChange={(e) => updatePetField('features', 'value', e.target.value)}
                            placeholder="Siyah benekli..."
                            className="!mb-0"
                        />
                    </div>

                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1">Boy / Kilo</label>
                            <PrivacyToggle isPublic={petData.sizeInfo?.isPublic || false} onChange={(v) => updatePetField('sizeInfo', 'isPublic', v)} />
                        </div>
                        <Input 
                            value={petData.sizeInfo?.value} 
                            onChange={(e) => updatePetField('sizeInfo', 'value', e.target.value)}
                            placeholder="Orta boy, 15kg..."
                            className="!mb-0"
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1">Huy Bilgisi</label>
                             <PrivacyToggle isPublic={petData.temperament?.isPublic || false} onChange={(v) => updatePetField('temperament', 'isPublic', v)} />
                        </div>
                        <div className="relative">
                            <select 
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-sm appearance-none text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-matrix-100 dark:focus:ring-matrix-900 focus:border-matrix-500 transition-all shadow-sm mb-2"
                                value={currentSelectValue}
                                onChange={handleTemperamentSelect}
                            >
                                <option value="">Seçiniz</option>
                                {TEMPERAMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                <option value="OTHER">Diğer (Kendim Yazacağım)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                            
                            {isCustomTemperament && (
                                <Input 
                                    placeholder="Huy bilgisini yazın..."
                                    value={petData.temperament?.value || ''}
                                    onChange={(e) => updatePetField('temperament', 'value', e.target.value)}
                                    className="!mb-0 animate-in slide-in-from-top-1"
                                />
                            )}
                        </div>
                    </div>

                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1 flex items-center gap-1">
                                <ShieldAlert size={14} className="text-red-500" /> Sağlık Uyarısı
                            </label>
                            <PrivacyToggle isPublic={petData.healthWarning?.isPublic || false} onChange={(v) => updatePetField('healthWarning', 'isPublic', v)} />
                        </div>
                        <Input 
                            value={petData.healthWarning?.value} 
                            onChange={(e) => updatePetField('healthWarning', 'value', e.target.value)}
                            placeholder="Alerjisi var..."
                            className="!mb-0 border-red-200 focus:border-red-500 focus:ring-red-100"
                        />
                    </div>
                </div>
            </div>

            {/* Part 3: Professional Info (Card) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                     <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                         <ShieldCheck size={18} />
                     </div>
                     <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Klinik & Çip</h3>
                </div>
                
                <div className="p-6 space-y-5">
                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1">Veteriner Tel</label>
                            <PrivacyToggle isPublic={petData.vetInfo?.isPublic || false} onChange={(v) => updatePetField('vetInfo', 'isPublic', v)} />
                        </div>
                        <Input 
                            type="tel"
                            value={petData.vetInfo?.value} 
                            onChange={(e) => updatePetField('vetInfo', 'value', formatPhoneNumber(e.target.value))}
                            placeholder="0212 ..."
                            className="!mb-0"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase ml-1">
                            Mikroçip No (Gizli)
                        </label>
                        <Input 
                            value={petData.microchip} 
                            onChange={(e) => setPetData({...petData, microchip: e.target.value})}
                            placeholder="15 haneli çip numarası"
                            className="!mb-0 font-mono tracking-wider"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2">
            <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-matrix-600 to-matrix-700 hover:from-matrix-500 hover:to-matrix-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-matrix-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Save size={24} />
                {isEditMode ? 'Kaydet' : 'Kaydı Tamamla'}
            </button>
        </div>

      </form>
    </div>
  );
};
