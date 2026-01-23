export enum PetType {
  CAT = 'Kedi',
  DOG = 'Köpek',
  OTHER = 'Diğer'
}

export enum ContactPreference {
  EMAIL = 'E-posta',
  PHONE = 'Telefon',
  BOTH = 'Her İkisi'
}

// Helper type for fields that can be toggled public/private
export interface PrivacyField<T> {
  value: T;
  isPublic: boolean;
}

export interface UserProfile {
  username: string;
  password?: string; // Added to handle password changes locally
  fullName?: string; 
  email: string;
  isEmailVerified: boolean;
  phone?: string;
  contactPreference: ContactPreference;
  // Emergency Contact Specifics
  emergencyContactName?: string;
  emergencyContactEmail?: string;
  emergencyContactPhone?: string;
  
  city?: string;
  district?: string;
}

export interface LostStatus {
  isActive: boolean;
  lostDate?: string;
  lastSeenLocation?: {
    lat: number;
    lng: number;
  };
  message?: string;
}

export interface PetProfile {
  id: string;
  // Mandatory
  name: PrivacyField<string>;
  type: PetType | string; // Updated to allow custom strings for "Other" types
  photoUrl: PrivacyField<string | null>; // Critical

  // Optional but Standard
  features?: PrivacyField<string>; // Color, pattern
  sizeInfo?: PrivacyField<string>; // Height/Weight
  temperament?: PrivacyField<string>; // Huy
  healthWarning?: PrivacyField<string>; // "Alerjisi var"

  // Optional Advanced
  microchip?: string; // Always private to owner
  vetInfo?: PrivacyField<string>; // Clinic Name + Phone
  
  // Status
  lostStatus?: LostStatus;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}