import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==================== AUTH MODE ====================
// Autentifikacijos režimai:
// 'demo' - kortelių pasirinkimas be slaptažodžio (numatytasis)
// 'pin' - PIN prisijungimas (4-6 skaitmenys)
// 'secure' - pilna Supabase autentifikacija (el. paštas + slaptažodis)
export type AuthMode = 'demo' | 'pin' | 'secure';

export const getAuthMode = (): AuthMode => {
  // Pirma tikriname localStorage (UI nustatymai)
  const savedMode = localStorage.getItem('er_auth_mode') as AuthMode | null;
  if (savedMode && ['demo', 'pin', 'secure'].includes(savedMode)) {
    return savedMode;
  }
  // Jei nėra, tikriname env kintamąjį
  const envMode = import.meta.env.VITE_AUTH_MODE as AuthMode;
  if (envMode && ['demo', 'pin', 'secure'].includes(envMode)) {
    return envMode;
  }
  return 'demo';
};

export const setAuthMode = (mode: AuthMode) => {
  localStorage.setItem('er_auth_mode', mode);
};

// ==================== PIN MANAGEMENT ====================
// PIN saugojimas localStorage (pereinamasis laikotarpis iki Supabase)
export interface StaffPin {
  staffId: string;
  pin: string; // Hashed or plain for demo
  createdAt: string;
}

export const getStaffPins = (): StaffPin[] => {
  const saved = localStorage.getItem('er_staff_pins');
  return saved ? JSON.parse(saved) : [];
};

export const setStaffPin = (staffId: string, pin: string) => {
  const pins = getStaffPins();
  const existing = pins.findIndex(p => p.staffId === staffId);
  const newPin: StaffPin = { staffId, pin, createdAt: new Date().toISOString() };

  if (existing >= 0) {
    pins[existing] = newPin;
  } else {
    pins.push(newPin);
  }
  localStorage.setItem('er_staff_pins', JSON.stringify(pins));
};

export const verifyStaffPin = (staffId: string, pin: string): boolean => {
  const pins = getStaffPins();
  const staffPin = pins.find(p => p.staffId === staffId);
  return staffPin?.pin === pin;
};

export const hasStaffPin = (staffId: string): boolean => {
  const pins = getStaffPins();
  return pins.some(p => p.staffId === staffId);
};

export const removeStaffPin = (staffId: string) => {
  const pins = getStaffPins().filter(p => p.staffId !== staffId);
  localStorage.setItem('er_staff_pins', JSON.stringify(pins));
};

// ==================== SUPABASE CLIENT ====================
// Konfigūracija iš localStorage (UI nustatymai) arba env kintamųjų
const getSupabaseConfig = () => {
  // Pirma tikriname localStorage
  const localUrl = localStorage.getItem('sb_url');
  const localKey = localStorage.getItem('sb_key');

  if (localUrl && localKey) {
    return { url: localUrl, key: localKey };
  }

  // Jei nėra, tikriname env kintamuosius
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    url: envUrl || '',
    key: envKey || ''
  };
};

const { url, key } = getSupabaseConfig();

// Sukuriame Supabase klientą tik jei konfigūracija yra
let supabaseClient: SupabaseClient | null = null;

if (url && key && url !== 'https://your-project.supabase.co') {
  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export const supabase = supabaseClient;

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    key !== 'your-anon-key-here'
  );
};

export const updateSupabaseConfig = (newUrl: string, newKey: string) => {
  localStorage.setItem('sb_url', newUrl);
  localStorage.setItem('sb_key', newKey);
  // Reload page to re-initialize client
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('sb_url');
  localStorage.removeItem('sb_key');
  window.location.reload();
};

// Helper to get supabase client with error if not configured
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error(
      'Supabase nėra sukonfigūruotas. ' +
      'Eikite į Nustatymai > Supabase ir įveskite savo projekto duomenis.'
    );
  }
  return supabase;
};