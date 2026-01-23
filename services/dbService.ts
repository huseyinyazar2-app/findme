
import { supabase } from './supabase';
import { UserProfile, PetProfile } from '../types';

// Re-export supabase for direct use if needed (e.g. in App.tsx)
export { supabase };

// --- QR Operations ---

export const checkQRCode = async (shortCode: string) => {
    // 1. Check if QR exists in QR_Kod table
    const { data: qrData, error: qrError } = await supabase
        .from('QR_Kod')
        .select('*')
        .eq('short_code', shortCode)
        .single();

    if (qrError || !qrData) {
        return { valid: false, message: 'Geçersiz QR Kod' };
    }

    return { 
        valid: true, 
        status: qrData.status, // 'boş' or 'dolu'
        shortCode: qrData.short_code,
        pin: qrData.pin // We need this internally to verify, but usually don't expose it to FE easily
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
        .eq('qr_code', shortCode) // Assuming 'qr_code' column stores the shortCode in Find_Users
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
        ownerUsername: userData.username // Helper to identify owner if needed
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
 * 
 * Scenario 1 (Status='boş'): Verifies PIN, if correct -> Returns success (isNew=true).
 * Scenario 2 (Status='dolu'): Verifies PIN, if correct -> Fetches linked User -> Returns user (isNew=false).
 */
export const loginOrRegister = async (shortCode: string, inputPin: string): Promise<{ success: boolean; user?: UserProfile; error?: string; isNew?: boolean }> => {
    try {
        // 1. Verify QR and PIN from QR_Kod table
        const { data: qrData, error: qrError } = await supabase
            .from('QR_Kod')
            .select('*')
            .eq('short_code', shortCode)
            .single();

        if (qrError || !qrData) {
            return { success: false, error: 'Geçersiz QR Kod' };
        }

        // Check PIN
        if (String(qrData.pin) !== String(inputPin)) {
            return { success: false, error: 'Hatalı PIN Kodu' };
        }

        // 2. Handle based on Status
        if (qrData.status === 'boş') {
            // --- REGISTRATION FLOW ---
            // If status is empty and PIN matches, we allow them to create a user profile.
            // But first check if a user accidentally exists (orphan record)
            const { data: existingUser } = await supabase
                .from('Find_Users')
                .select('*')
                .eq('qr_code', shortCode)
                .single();
            
            if (existingUser) {
                // If user exists but status was 'boş' (inconsistent state), log them in
                 return { success: true, user: mapDbUserToProfile(existingUser), isNew: false };
            }

            // Return success but no user yet - Frontend will show PetForm to create the user
            // We create a temporary "User Profile" object to prepopulate the form
            const tempUser: UserProfile = {
                username: shortCode,
                password: inputPin, // Store PIN as password locally
                email: '',
                isEmailVerified: false,
                contactPreference: 'Telefon' as any,
                city: '',
                district: ''
            };
            
            return { success: true, user: tempUser, isNew: true };
            
        } else {
            // --- LOGIN FLOW (Status = 'dolu') ---
            // Fetch the user linked to this QR code
            const { data: existingUser, error: findError } = await supabase
                .from('Find_Users')
                .select('*')
                .eq('qr_code', shortCode) // Link by QR code
                .single();

            if (findError || !existingUser) {
                return { success: false, error: 'Bu QR koda bağlı kullanıcı profili bulunamadı.' };
            }

            return { success: true, user: mapDbUserToProfile(existingUser), isNew: false };
        }

    } catch (e) {
        console.error("Auth error", e);
        return { success: false, error: 'Sunucu hatası' };
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
            console.error(createError);
            return false;
        }

        // Update QR Status to 'dolu'
        await supabase
            .from('QR_Kod')
            .update({ status: 'dolu' })
            .eq('short_code', shortCode);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const updateUserProfile = async (user: UserProfile) => {
    const dbData = mapProfileToDbUser(user);
    delete (dbData as any).id;
    delete (dbData as any).created_at;
    delete (dbData as any).qr_code; // Don't change the link

    const { error } = await supabase
        .from('Find_Users')
        .update(dbData)
        .eq('username', user.username);
        
    if (error) console.error("Update User Error", error);
    return !error;
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
