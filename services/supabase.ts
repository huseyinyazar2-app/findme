
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bxpawrbivoryjkdertil.supabase.co';
const SUPABASE_KEY = '5PHY7Es89D07Bp2I3gOg9w_XIV11Pwy'; // Note: In production, use environment variables

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
