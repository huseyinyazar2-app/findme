
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, PetProfile, PetType } from '../types';
import { TURKEY_CITIES, CITY_NAMES, TEMPERAMENT_OPTIONS, formatPhoneNumber } from '../constants';
import { Edit2, Check, X, User, Dog, MapPin, Phone, ShieldAlert, FileText, Info, CheckCircle2, Camera, QrCode } from 'lucide-react';

// --- Extracted Component: FieldEditor ---
interface FieldEditorProps {
    fieldKey: string;
    value: string;
    onChange: (val: string) => void;
    userCity?: string; 
    isCustom: boolean;
    onCustomChange: (isCustom: boolean) => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ fieldKey, value, onChange, userCity, isCustom, onCustomChange }) => {
    
    // 1. City Selection
    if (fieldKey === 'user.city') {
        return (
            <div className="relative">
                <select 
                    className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-matrix-200"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">İl Seçiniz</option>
                    {CITY_NAMES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
            </div>
        );
    }

    // 2. District Selection
    if (fieldKey === 'user.district') {
        const districts = userCity && TURKEY_CITIES[userCity] ? TURKEY_CITIES[userCity] : [];
        return (
            <div className="relative">
                <select 
                    className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-matrix-200"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">İlçe Seçiniz</option>
                    {districts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                    <option value="Diğer">Diğer</option>
                </select>
                {!userCity && <p className="text-[10px] text-red-500 mt-1">Önce il seçmelisiniz.</p>}
            </div>
        );
    }

    // 3. Pet Type Selection
    if (fieldKey === 'pet.type') {
        const dropdownValue = isCustom ? PetType.OTHER : value;

        return (
        <div className="space-y-2">
            <select 
                className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-matrix-200"
                value={dropdownValue}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === PetType.OTHER) {
                        onCustomChange(true);
                        onChange(''); 
                    } else {
                        onCustomChange(false);
                        onChange(val);
                    }
                }}
            >
                {Object.values(PetType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {isCustom && (
                    <input 
                    className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none animate-in fade-in slide-in-from-top-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Hayvan türünü belirtin"
                />
            )}
        </div>
        );
    }
    
    // 4. Temperament Selection
    if (fieldKey === 'pet.temperament') {
        const dropdownValue = isCustom ? 'OTHER' : (TEMPERAMENT_OPTIONS.includes(value) ? value : '');

        return (
            <div className="space-y-2">
            <select 
                className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-matrix-200"
                value={dropdownValue}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'OTHER') {
                        onCustomChange(true);
                        onChange(''); 
                    } else {
                        onCustomChange(false);
                        onChange(val);
                    }
                }}
            >
                <option value="">Seçiniz</option>
                {TEMPERAMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                <option value="OTHER">Diğer</option>
            </select>

            {isCustom && (
                    <input 
                    className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none animate-in fade-in slide-in-from-top-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Huy bilgisini yazın"
                />
            )}
            </div>
        );
    }

    // 5. Phone Input Formatting
    if (fieldKey === 'pet.vetInfo') {
        return (
        <input 
            type="tel"
            className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-matrix-200"
            value={value}
            onChange={(e) => onChange(formatPhoneNumber(e.target.value))}
            placeholder="0555 555 55 55"
        />
        );
    }

    // 6. Standard Text Input
    return (
        <input 
            className="w-full bg-white dark:bg-slate-900 border border-matrix-500 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-matrix-200"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
};

// --- Extracted Component: InfoRow ---
interface InfoRowProps {
    label: string;
    value: string | undefined | null;
    fieldKey: string;
    isEditable?: boolean;
    icon?: any;
    isEditing: boolean;
    showSuccess: boolean;
    onStartEdit: (key: string, val: string) => void;
    onSave: () => void;
    onCancel: () => void;
    // Editor Props
    editorValue: string;
    onEditorChange: (val: string) => void;
    userCity?: string;
    isCustom: boolean;
    onCustomChange: (val: boolean) => void;
}

const InfoRow: React.FC<InfoRowProps> = ({ 
    label, value, fieldKey, isEditable = true, icon: Icon,
    isEditing, showSuccess, onStartEdit, onSave, onCancel,
    editorValue, onEditorChange, userCity, isCustom, onCustomChange
}) => {
    const displayValue = value || '-';

    return (
        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
            <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className={`p-2 rounded-lg ${isEditing ? 'bg-matrix-100 dark:bg-matrix-900/50' : 'bg-slate-100 dark:bg-slate-800'} text-matrix-600 dark:text-matrix-400 shrink-0 transition-colors`}>
                    {Icon && <Icon size={18} />}
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</span>
                    
                    {isEditing ? (
                        <div className="mt-1 animate-in fade-in zoom-in-95 duration-200">
                            <FieldEditor 
                                fieldKey={fieldKey}
                                value={editorValue}
                                onChange={onEditorChange}
                                userCity={userCity}
                                isCustom={isCustom}
                                onCustomChange={onCustomChange}
                            />
                        </div>
                    ) : (
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {displayValue}
                        </span>
                    )}
                </div>
            </div>

            <div className="pl-2 shrink-0">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={onSave} className="p-2 bg-matrix-600 text-white rounded-lg shadow-md hover:bg-matrix-700 transition-colors">
                            <Check size={16} />
                        </button>
                        <button onClick={onCancel} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-red-500 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    isEditable && (
                        <button 
                            onClick={() => onStartEdit(fieldKey, value || '')}
                            className="p-2 text-slate-300 hover:text-matrix-600 hover:bg-matrix-50 rounded-lg transition-all dark:text-slate-600 dark:hover:text-matrix-400 dark:hover:bg-matrix-900/20"
                        >
                            <Edit2 size={16} />
                        </button>
                    )
                )}
            </div>
            </div>
            
            {/* Success Message Area */}
            {showSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top-1 fade-in duration-300">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Güncellendi
                    </span>
                </div>
            )}
        </div>
    );
};

interface InfoSummaryProps {
  user: UserProfile;
  pet: PetProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  onSavePet: (pet: PetProfile) => void;
}

// --- Main Component ---
export const InfoSummary: React.FC<InfoSummaryProps> = ({ user, pet, onUpdateUser, onSavePet }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isCustomSelection, setIsCustomSelection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successField, setSuccessField] = useState<string | null>(null);

  useEffect(() => {
    if (successField) {
        const timer = setTimeout(() => {
            setSuccessField(null);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [successField]);

  const startEditing = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setTempValue(currentValue);
    setSuccessField(null);
    setIsCustomSelection(false);

    if (fieldKey === 'pet.temperament') {
        const isStandard = TEMPERAMENT_OPTIONS.includes(currentValue);
        if (currentValue && !isStandard) {
            setIsCustomSelection(true);
        }
    }
    if (fieldKey === 'pet.type') {
         const isStandard = Object.values(PetType).includes(currentValue as PetType);
         if (!isStandard) {
             setIsCustomSelection(true);
         }
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
    setIsCustomSelection(false);
  };

  const saveEdit = () => {
    if (!editingField) return;

    if (editingField.startsWith('user.')) {
      const field = editingField.split('.')[1] as keyof UserProfile;
      let updatedUser = { ...user, [field]: tempValue };
      if (field === 'city' && tempValue !== user.city) {
          updatedUser.district = ''; 
      }
      onUpdateUser(updatedUser);
    } else if (editingField.startsWith('pet.') && pet) {
      const field = editingField.split('.')[1] as keyof PetProfile;
      const currentPetField = pet[field];
      let updatedPet = { ...pet };
      
      if (typeof currentPetField === 'object' && currentPetField !== null && 'value' in currentPetField) {
         updatedPet = {
            ...pet,
            [field]: { ...currentPetField, value: tempValue }
         };
      } else {
         updatedPet = {
            ...pet,
            [field]: tempValue
         };
      }
      onSavePet(updatedPet);
    }

    setSuccessField(editingField); 
    setEditingField(null);
    setIsCustomSelection(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && pet) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      const updatedPet = {
        ...pet,
        photoUrl: { ...pet.photoUrl, value: imageUrl }
      };
      onSavePet(updatedPet);
      setSuccessField('photo');
    }
  };

  const triggerPhotoUpload = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <div className="pb-32 pt-8 px-4 max-w-lg mx-auto animate-in fade-in space-y-8">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700 text-matrix-600 dark:text-matrix-400">
             <FileText size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                Kayıtlı Bilgiler
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
                <QrCode size={12} className="text-matrix-600 dark:text-matrix-400" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    QR ID: <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-1 border border-slate-200 dark:border-slate-700">{user.username}</span>
                </span>
            </div>
        </div>
      </div>

      {/* User Info Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                    <User size={18} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Kullanıcı Bilgileri</h3>
            </div>
            
            <InfoRow 
                label="Adı Soyadı" 
                value={user.fullName} 
                fieldKey="user.fullName" 
                isEditable={false} 
                icon={User}
                isEditing={false}
                showSuccess={false}
                onStartEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEditing}
                editorValue={tempValue}
                onEditorChange={setTempValue}
                isCustom={isCustomSelection}
                onCustomChange={setIsCustomSelection}
            />
            <InfoRow 
                label="E-posta" 
                value={user.email} 
                fieldKey="user.email" 
                isEditable={false} 
                icon={Info}
                isEditing={false}
                showSuccess={false}
                onStartEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEditing}
                editorValue={tempValue}
                onEditorChange={setTempValue}
                isCustom={isCustomSelection}
                onCustomChange={setIsCustomSelection}
            />
            <InfoRow 
                label="İl" 
                value={user.city} 
                fieldKey="user.city" 
                icon={MapPin}
                isEditing={editingField === 'user.city'}
                showSuccess={successField === 'user.city'}
                onStartEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEditing}
                editorValue={tempValue}
                onEditorChange={setTempValue}
                isCustom={isCustomSelection}
                onCustomChange={setIsCustomSelection}
            />
            <InfoRow 
                label="İlçe" 
                value={user.district} 
                fieldKey="user.district" 
                icon={MapPin}
                isEditing={editingField === 'user.district'}
                showSuccess={successField === 'user.district'}
                onStartEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEditing}
                editorValue={tempValue}
                onEditorChange={setTempValue}
                userCity={user.city}
                isCustom={isCustomSelection}
                onCustomChange={setIsCustomSelection}
            />
      </section>

      {/* Pet Info Section */}
      {pet ? (
          <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="bg-matrix-100 dark:bg-matrix-900/30 p-1.5 rounded-lg text-matrix-600 dark:text-matrix-400">
                        <Dog size={18} />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Evcil Hayvan Bilgileri</h3>
                </div>

                {pet.photoUrl.value && (
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-black/20 flex flex-col items-center gap-4">
                        <div className="relative w-full aspect-video bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 group">
                            <img 
                                src={pet.photoUrl.value} 
                                alt="Pet" 
                                className="w-full h-full object-contain" 
                            />
                            
                            {/* Overlay Edit Button */}
                            <button 
                                onClick={triggerPhotoUpload}
                                className="absolute bottom-4 right-4 p-3 bg-white text-matrix-600 rounded-xl shadow-lg hover:bg-matrix-50 transition-all border border-slate-100"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                            accept="image/*" 
                        />
                        
                        {successField === 'photo' && (
                           <div className="w-full bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                               <CheckCircle2 size={14} /> Fotoğraf güncellendi
                           </div>
                        )}
                    </div>
                )}
                
                <InfoRow 
                    label="Hayvan Türü" 
                    value={pet.type} 
                    fieldKey="pet.type" 
                    icon={Dog} 
                    isEditing={editingField === 'pet.type'}
                    showSuccess={successField === 'pet.type'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                <InfoRow 
                    label="Adı" 
                    value={pet.name.value} 
                    fieldKey="pet.name" 
                    icon={Info} 
                    isEditing={editingField === 'pet.name'}
                    showSuccess={successField === 'pet.name'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                <InfoRow 
                    label="Renk / Özellikler" 
                    value={pet.features?.value} 
                    fieldKey="pet.features" 
                    icon={Info} 
                    isEditing={editingField === 'pet.features'}
                    showSuccess={successField === 'pet.features'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                <InfoRow 
                    label="Boy / Kilo" 
                    value={pet.sizeInfo?.value} 
                    fieldKey="pet.sizeInfo" 
                    icon={Info} 
                    isEditing={editingField === 'pet.sizeInfo'}
                    showSuccess={successField === 'pet.sizeInfo'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                <InfoRow 
                    label="Huy Bilgisi" 
                    value={pet.temperament?.value} 
                    fieldKey="pet.temperament" 
                    icon={Info} 
                    isEditing={editingField === 'pet.temperament'}
                    showSuccess={successField === 'pet.temperament'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                <InfoRow 
                    label="Sağlık Uyarısı" 
                    value={pet.healthWarning?.value} 
                    fieldKey="pet.healthWarning" 
                    icon={ShieldAlert} 
                    isEditing={editingField === 'pet.healthWarning'}
                    showSuccess={successField === 'pet.healthWarning'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                
                <InfoRow 
                    label="Veteriner Tel" 
                    value={pet.vetInfo?.value} 
                    fieldKey="pet.vetInfo" 
                    icon={Phone} 
                    isEditing={editingField === 'pet.vetInfo'}
                    showSuccess={successField === 'pet.vetInfo'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
                
                <InfoRow 
                    label="Mikroçip (Gizli)" 
                    value={pet.microchip} 
                    fieldKey="pet.microchip" 
                    icon={Info} 
                    isEditing={editingField === 'pet.microchip'}
                    showSuccess={successField === 'pet.microchip'}
                    onStartEdit={startEditing}
                    onSave={saveEdit}
                    onCancel={cancelEditing}
                    editorValue={tempValue}
                    onEditorChange={setTempValue}
                    isCustom={isCustomSelection}
                    onCustomChange={setIsCustomSelection}
                />
          </section>
      ) : (
          <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Dog className="text-slate-300 dark:text-slate-600" size={32} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Henüz bir hayvan kaydı oluşturulmadı.</p>
          </div>
      )}
    </div>
  );
};
