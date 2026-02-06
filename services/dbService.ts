import { supabase } from './supabase';
import { UserProfile, PetProfile } from '../types';

// Re-export supabase for direct use if needed (e.g. in App.tsx)
export { supabase };

// --- LOGGING OPERATION ---

export const logQrScan = async (shortCode: string, manualLocation?: {lat: number, lng: number, accuracy: number}) => {
    try {
        console.log(`📡 Loglama başlatılıyor: ${shortCode}`);

        // 1. İZİNSİZ VERİLER (Otomatik Toplanan)
        const nav = navigator as any;
        
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: window.screen.width,
                height: window.screen.height
            },
            referrer: document.referrer || 'direct',
            timestamp_local: new Date().toString()
        };

        // IP Adresi Alma
        let ipAddress = null;
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            ipAddress = ipData.ip;
        } catch (e) {
            console.warn("IP adresi alınamadı.");
        }

        // 2. İZİNLİ VERİLER (Konum)
        const locationData = manualLocation || null;

        // 3. VERİTABANINA KAYIT
        const logPayload = {
            qr_code: shortCode,
            ip_address: ipAddress,
            user_agent: navigator.userAgent, 
            device_info: deviceInfo,
            location: locationData,
            consent_given: !!locationData
        };

        const { error } = await supabase.from('QR_Logs').insert([logPayload]);

        if (error) {
            console.error("❌ Log kaydetme hatası:", error);
        } else {
            console.log("✅ QR Okuma Logu kaydedildi.");
        }

    } catch (err) {
        console.error("Loglama sistemi genel hatası:", err);
    }
};

/**
 * QR_Logs tablosundan belirli bir QR kod için son logları çeker.
 * Genellikle sahip giriş yaptığında gösterilir.
 */
export const getRecentQrScans = async (qrCode: string) => {
    try {
        // Son 10 taramayı getir, en yeni en üstte
        const { data, error } = await supabase
            .from('QR_Logs')
            .select('*')
            .eq('qr_code', qrCode)
            .order('scanned_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Log çekme hatası:", error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error("getRecentQrScans hatası:", e);
        return [];
    }
};

// --- QR Operations ---

export const checkQRCode = async (shortCode: string) => {
    // TABLO ADI: QR_Kod
    const { data: qrData, error: qrError } = await supabase
        .from('QR_Kod')
        .select('short_code, pin, status') 
        .eq('short_code', shortCode)
        .single();

    if (qrError || !qrData) {
        return { valid: false, message: 'Geçersiz QR Kod' };
    }

    return { 
        valid: true, 
        status: qrData.status, // 'boş' veya 'dolu'
        shortCode: qrData.short_code,
        pin: qrData.pin 
    };
};

/**
 * Fetches public pet info + lost status without requiring a PIN.
 * Used for the "Finder View" when a pet is lost.
 */
export const getPublicPetByQr = async (shortCode: string): Promise<PetProfile | null> => {
    // 1. Find the user associated with this QR code
    const { data: userData, error: userError } = await supabase
        .from('Find_Users')
        .select('id, username')
        .eq('qr_code', shortCode) 
        .single();

    if (userError || !userData) {
        return null;
    }

    // 2. Get the pet associated with this user
    const { data: petData, error: petError } = await supabase
        .from('Find_Pets')
        .select('*')
        .eq('owner_id', userData.id)
        .single();

    if (petError || !petData) {
        return null;
    }

    // 3. Return the profile
    return {
        id: petData.id,
        ...petData.pet_data,
        lostStatus: petData.lost_status,
        ownerUsername: userData.username 
    } as PetProfile;
};

// --- Storage Operations ---

export const uploadPetPhoto = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('pet_photos')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('pet_photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (e) {
        console.error("Unexpected upload error:", e);
        return null;
    }
};

// --- Auth & User Operations ---

export const loginOrRegister = async (shortCode: string, inputPin: string): Promise<{ success: boolean; user?: UserProfile; error?: string; isNew?: boolean }> => {
    try {
        // 1. ADIM: QR_Kod tablosundan PIN ve STATUS doğrula
        const { data: qrData, error: qrError } = await supabase
            .from('QR_Kod')
            .select('*')
            .eq('short_code', shortCode)
            .single();

        if (qrError || !qrData) {
            return { success: false, error: 'Geçersiz QR Kod' };
        }

        const dbPin = String(qrData.pin).trim();
        const userPin = String(inputPin).trim();

        if (dbPin !== userPin) {
            return { success: false, error: 'Hatalı PIN Kodu' };
        }

        // 2. ADIM: Status'a göre işlem yap
        if (qrData.status === 'boş') {
            const tempUser = createTempProfile(shortCode, userPin);
            return { success: true, user: tempUser, isNew: true };
        
        } else {
            const { data: existingUser } = await supabase
                .from('Find_Users')
                .select('*')
                .eq('qr_code', shortCode) 
                .single();

            if (existingUser) {
                const profile = mapDbUserToProfile(existingUser);
                if (!profile.password || profile.password.trim() === '') {
                    profile.password = dbPin;
                }
                return { success: true, user: profile, isNew: false };
            } else {
                // Hatalı durum düzeltme
                await supabase.from('QR_Kod').update({ status: 'boş' }).eq('short_code', shortCode);
                const tempUser = createTempProfile(shortCode, userPin);
                return { success: true, user: tempUser, isNew: true };
            }
        }
    } catch (e: any) {
        console.error("Auth hatası:", e);
        return { success: false, error: `Sunucu hatası: ${e.message}` };
    }
};

export const registerUserAfterForm = async (userProfile: UserProfile, shortCode: string): Promise<boolean> => {
    try {
        const dbUser = mapProfileToDbUser(userProfile);
        dbUser.qr_code = shortCode; 
        dbUser.created_at = new Date().toISOString();

        const { error: createError } = await supabase.from('Find_Users').insert([dbUser]);
        if (createError) return false;

        await supabase.from('QR_Kod').update({ status: 'dolu' }).eq('short_code', shortCode);
        return true;
    } catch (e) {
        return false;
    }
}

export const updateUserProfile = async (user: UserProfile) => {
    try {
        const dbData = mapProfileToDbUser(user);
        delete (dbData as any).id;
        delete (dbData as any).created_at;
        delete (dbData as any).qr_code;

        const { error } = await supabase.from('Find_Users').update(dbData).eq('username', user.username);
        if (error) return false;

        if (user.password) {
            await supabase.from('QR_Kod').update({ pin: user.password }).eq('short_code', user.username);
        }
        return true;
    } catch (e) {
        return false;
    }
};

// --- Pet Operations ---

export const getPetForUser = async (username: string): Promise<PetProfile | null> => {
    const { data: user } = await supabase.from('Find_Users').select('id').eq('username', username).single();
    if (!user) return null;

    const { data: pet } = await supabase
        .from('Find_Pets')
        .select('*')
        .eq('owner_id', user.id)
        .single();

    if (pet) {
        return {
            id: pet.id,
            ...pet.pet_data,
            lostStatus: pet.lost_status
        } as PetProfile;
    }
    return null;
};

export const savePetForUser = async (user: UserProfile, pet: PetProfile) => {
     const { data: dbUser } = await supabase.from('Find_Users').select('id').eq('username', user.username).single();
     let ownerId = dbUser?.id;

     if (!ownerId) {
         const success = await registerUserAfterForm(user, user.username);
         if (!success) return false;
         const { data: newUser } = await supabase.from('Find_Users').select('id').eq('username', user.username).single();
         if (!newUser) return false;
         ownerId = newUser.id;
     }

     const petPayload = {
         pet_data: {
             name: pet.name,
             type: pet.type,
             photoUrl: pet.photoUrl,
             features: pet.features,
             sizeInfo: pet.sizeInfo,
             temperament: pet.temperament,
             healthWarning: pet.healthWarning,
             microchip: pet.microchip,
             vetInfo: pet.vetInfo
         },
         lost_status: pet.lostStatus,
         owner_id: ownerId
     };

     const { data: existingPet } = await supabase.from('Find_Pets').select('id').eq('owner_id', ownerId).single();

     if (existingPet) {
         const { error } = await supabase.from('Find_Pets').update(petPayload).eq('id', existingPet.id);
         return !error;
     } else {
         const { error } = await supabase.from('Find_Pets').insert([petPayload]);
         return !error;
     }
};


// --- Helpers ---

function createTempProfile(username: string, pin: string): UserProfile {
    return {
        username: username,
        password: pin, 
        email: '',
        isEmailVerified: false,
        contactPreference: 'Telefon' as any,
        city: '',
        district: ''
    };
}

function mapDbUserToProfile(dbUser: any): UserProfile {
    return {
        username: dbUser.username,
        password: dbUser.password, 
        fullName: dbUser.full_name,
        email: dbUser.email,
        phone: dbUser.phone,
        isEmailVerified: dbUser.is_email_verified || false,
        contactPreference: dbUser.contact_preference as any,
        emergencyContactName: dbUser.emergency_contact_name,
        emergencyContactEmail: dbUser.emergency_contact_email,
        emergencyContactPhone: dbUser.emergency_contact_phone,
        city: dbUser.city,
        district: dbUser.district
    };
}

function mapProfileToDbUser(profile: UserProfile): any {
    return {
        username: profile.username,
        password: profile.password,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        is_email_verified: profile.isEmailVerified,
        contact_preference: profile.contactPreference,
        emergency_contact_name: profile.emergencyContactName,
        emergency_contact_email: profile.emergencyContactEmail,
        emergency_contact_phone: profile.emergencyContactPhone,
        city: profile.city,
        district: profile.district
    };
}