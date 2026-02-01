
import { createClient } from '@supabase/supabase-js';

// --- ÖNEMLİ AYARLAR ---
// API Key yapılandırması güncellendi.
// Eğer 'Invalid API key' hatası devam ederse, lütfen Supabase panelindeki 'anon' 'public' (eyJh... ile başlayan) anahtarı kullanın.

// Ortam değişkenlerine güvenli erişim sağlayan yardımcı fonksiyon
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // import.meta.env kontrolü
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Hata durumunda sessizce fallback değerine dön
  }
  return fallback;
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://bxpawrbivoryjkdertil.supabase.co');

// Kullanıcı tarafından sağlanan anahtar:
const SUPABASE_KEY = getEnvVar('VITE_SUPABASE_KEY', 'sb_publishable_5PHY7Es89D07Bp2I3gOg9w_XIV11Pwy'); 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
