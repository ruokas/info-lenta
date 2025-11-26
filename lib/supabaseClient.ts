import { createClient } from '@supabase/supabase-js';

// We retrieve keys from localStorage so the user can set them in the UI without redeploying/env vars
const getSupabaseConfig = () => {
  const url = localStorage.getItem('sb_url') || '';
  const key = localStorage.getItem('sb_key') || '';
  return { url, key };
};

const { url, key } = getSupabaseConfig();

export const supabase = (url && key) 
  ? createClient(url, key) 
  : null;

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return !!url && !!key;
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