import { createClient } from '@supabase/supabase-js';

// --- ÖNEMLİ AYARLAR ---
// API Key yapılandırması güncellendi.
// Eğer 'Invalid API key' hatası devam ederse, lütfen Supabase panelindeki 'anon' 'public' (eyJh... ile başlayan) anahtarı kullanın.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bxpawrbivoryjkdertil.supabase.co';

// Kullanıcı tarafından sağlanan anahtar:
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_5PHY7Es89D07Bp2I3gOg9w_XIV11Pwy'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);