
import { supabase } from './supabase';
import { UserProfile, PetProfile } from '../types';

// Re-export supabase for direct use if needed (e.g. in App.tsx)
export { supabase };

// --- QR Operations ---

export const checkQRCode = async (shortCode: string) => {
    console.log(`🔍 QR Kontrol Ediliyor: ${shortCode}`);
    
    // TABLO ADI: QR_Kod
    // SÜTUNLAR: short_code, pin, status, full_url
    const { data: qrData, error: qrError } = await supabase
        .from('QR_Kod')
        .select('short_code, pin, status') // Sadece ihtiyacımız olanları çekiyoruz
        .eq('short_code', shortCode)
        .single();

    if (qrError) {
        console.error("❌ QR Kontrol Hatası (Supabase):", qrError);
        return { valid: false, message: 'Veritabanı erişim hatası veya QR bulunamadı.' };
    }

    if (!qrData) {
        console.warn("⚠️ QR Verisi boş döndü.");
        return { valid: false, message: 'Geçersiz QR Kod' };
    }

    console.log("✅ QR Bulundu:", qrData);

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

/**
 * NEW LOGIC:
 * Authenticates using QR Short Code and PIN from QR_Kod table.
 */
export const loginOrRegister = async (shortCode: string, inputPin: string): Promise<{ success: boolean; user?: UserProfile; error?: string; isNew?: boolean }> => {
    try {
        console.log(`🔐 Giriş Denemesi: QR=${shortCode}, PIN=${inputPin}`);

        // 1. Verify QR and PIN from QR_Kod table
        const { data: qrData, error: qrError } = await supabase
            .from('QR_Kod')
            .select('*')
            .eq('short_code', shortCode)
            .single();

        if (qrError) {
            console.error("❌ Login Sorgu Hatası:", qrError);
            return { success: false, error: `Veritabanı hatası: ${qrError.message} (API Key veya Tablo adı kontrolü yapın)` };
        }

        if (!qrData) {
            console.warn("⚠️ QR Kod veritabanında bulunamadı.");
            return { success: false, error: 'Geçersiz QR Kod' };
        }

        console.log("✅ DB'den Gelen Veri:", qrData);

        // Check PIN (String comparison ensures types don't mismatch - CSV usually returns strings or numbers)
        // CSV'de pin: 2222 veya 396049 gibi duruyor.
        if (String(qrData.pin).trim() !== String(inputPin).trim()) {
            console.warn(`⛔ Hatalı PIN. Beklenen: ${qrData.pin}, Girilen: ${inputPin}`);
            return { success: false, error: 'Hatalı PIN Kodu' };
        }

        // 2. Handle based on Status
        if (qrData.status === 'boş') {
            console.log("ℹ️ Durum: BOŞ - Kayıt akışı başlatılıyor.");
            
            // --- REGISTRATION FLOW ---
            const { data: existingUser } = await supabase
                .from('Find_Users')
                .select('*')
                .eq('qr_code', shortCode)
                .single();
            
            if (existingUser) {
                 console.log("⚠️ Kullanıcı var ama QR durumu 'boş'. Giriş yapılıyor.");
                 return { success: true, user: mapDbUserToProfile(existingUser), isNew: false };
            }

            const tempUser: UserProfile = {
                username: shortCode,
                password: inputPin, 
                email: '',
                isEmailVerified: false,
                contactPreference: 'Telefon' as any,
                city: '',
                district: ''
            };
            
            return { success: true, user: tempUser, isNew: true };
            
        } else {
            console.log("ℹ️ Durum: DOLU - Giriş akışı başlatılıyor.");
            // --- LOGIN FLOW (Status = 'dolu') ---
            const { data: existingUser, error: findError } = await supabase
                .from('Find_Users')
                .select('*')
                .eq('qr_code', shortCode) 
                .single();

            if (findError || !existingUser) {
                console.error("❌ Kullanıcı profili bulunamadı hatası:", findError);
                return { success: false, error: 'Bu QR koda bağlı kullanıcı profili bulunamadı. Lütfen yönetici ile iletişime geçin.' };
            }

            return { success: true, user: mapDbUserToProfile(existingUser), isNew: false };
        }

    } catch (e: any) {
        console.error("🔥 Kritik Auth hatası:", e);
        return { success: false, error: `Sunucu hatası: ${e.message}` };
    }
};

/**
 * Creates the actual user record in Find_Users table after the initial form submission
 */
export const registerUserAfterForm = async (userProfile: UserProfile, shortCode: string): Promise<boolean> => {
    try {
        const dbUser = mapProfileToDbUser(userProfile);
        dbUser.qr_code = shortCode; // Ensure link
        dbUser.created_at = new Date().toISOString();

        const { error: createError } = await supabase
            .from('Find_Users')
            .insert([dbUser]);

        if (createError) {
            console.error("Kayıt oluşturma hatası:", createError);
            return false;
        }

        // Update QR Status to 'dolu'
        const { error: updateError } = await supabase
            .from('QR_Kod')
            .update({ status: 'dolu' })
            .eq('short_code', shortCode);

        if (updateError) {
            console.error("QR durum güncelleme hatası:", updateError);
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const updateUserProfile = async (user: UserProfile) => {
    try {
        const dbData = mapProfileToDbUser(user);
        delete (dbData as any).id;
        delete (dbData as any).created_at;
        delete (dbData as any).qr_code; // Don't change the link

        // 1. Update Find_Users Table
        const { error } = await supabase
            .from('Find_Users')
            .update(dbData)
            .eq('username', user.username);
            
        if (error) {
            console.error("Update User Error", error);
            return false;
        }

        // 2. SYNC PASSWORD with QR_Kod Table (Update PIN)
        // If the user changed their password, we must update the PIN in QR_Kod table
        // so they can login next time.
        if (user.password) {
            console.log("🔄 Şifre değişikliği algılandı. QR PIN güncelleniyor...");
            const { error: pinError } = await supabase
                .from('QR_Kod')
                .update({ pin: user.password })
                .eq('short_code', user.username);
            
            if (pinError) {
                console.error("❌ Kritik Hata: QR PIN güncellenemedi!", pinError);
                // We might want to alert the user here, but return true for now as profile updated
            } else {
                console.log("✅ QR PIN başarıyla senkronize edildi.");
            }
        }

        return true;
    } catch (e) {
        console.error("Unexpected error in updateUserProfile", e);
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
     // Ensure user exists first (Lazy creation for new registrations)
     const { data: dbUser } = await supabase.from('Find_Users').select('id').eq('username', user.username).single();
     
     let ownerId = dbUser?.id;

     if (!ownerId) {
         // This is a fresh registration save
         const success = await registerUserAfterForm(user, user.username); // username is shortCode here
         if (!success) return false;
         
         // Fetch ID again
         const { data: newUser } = await supabase.from('Find_Users').select('id').eq('username', user.username).single();
         if (!newUser) return false;
         ownerId = newUser.id;
     }

     // Prepare data
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

     // Check if pet exists
     const { data: existingPet } = await supabase
        .from('Find_Pets')
        .select('id')
        .eq('owner_id', ownerId)
        .single();

     if (existingPet) {
         // Update
         const { error } = await supabase
            .from('Find_Pets')
            .update(petPayload)
            .eq('id', existingPet.id);
         return !error;
     } else {
         // Insert
         const { error } = await supabase
            .from('Find_Pets')
            .insert([petPayload]);
         return !error;
     }
};


// --- Helpers ---

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
