import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Bed, Staff, PatientLogEntry, PatientStatus } from '../types';
import { INITIAL_BEDS, DOCTORS, NURSES } from '../constants';

// --- SCHEMA INSTRUCTIONS FOR SUPABASE ---
// If using Supabase, create these tables in your SQL Editor:
/*
  create table beds (
    id text primary key,
    data jsonb not null
  );
  
  create table staff (
    id text primary key,
    data jsonb not null
  );
  
  create table patient_logs (
    id text primary key,
    data jsonb not null,
    created_at timestamptz default now()
  );

  -- Insert initial row for beds (we store the whole array in one row for simple sync, 
  -- or you can normalize it. For this demo, we store the array in a row with id 'current_beds')
  insert into beds (id, data) values ('current_beds', '[]');
  insert into staff (id, data) values ('doctors', '[]');
  insert into staff (id, data) values ('nurses', '[]');
*/

const isOnline = isSupabaseConfigured();

export const DataService = {
  // --- BEDS ---
  async fetchBeds(): Promise<Bed[]> {
    if (isOnline && supabase) {
      const { data, error } = await supabase.from('beds').select('data').eq('id', 'current_beds').single();
      if (!error && data) return data.data;
    }
    // Fallback to LocalStorage
    const saved = localStorage.getItem('er_beds');
    return saved ? JSON.parse(saved) : INITIAL_BEDS;
  },

  async saveBeds(beds: Bed[]) {
    // Always save to LocalStorage for offline capability/speed
    localStorage.setItem('er_beds', JSON.stringify(beds));

    if (isOnline && supabase) {
      await supabase.from('beds').upsert({ id: 'current_beds', data: beds });
    }
  },

  // --- STAFF ---
  async fetchStaff(type: 'doctors' | 'nurses'): Promise<Staff[]> {
    if (isOnline && supabase) {
      const { data, error } = await supabase.from('staff').select('data').eq('id', type).single();
      if (!error && data) return data.data;
    }
    const key = type === 'doctors' ? 'er_doctors' : 'er_nurses';
    const defaultData = type === 'doctors' ? DOCTORS : NURSES;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  },

  async saveStaff(type: 'doctors' | 'nurses', staff: Staff[]) {
    const key = type === 'doctors' ? 'er_doctors' : 'er_nurses';
    localStorage.setItem(key, JSON.stringify(staff));

    if (isOnline && supabase) {
      await supabase.from('staff').upsert({ id: type, data: staff });
    }
  },

  // --- LOGS ---
  async fetchLogs(): Promise<PatientLogEntry[]> {
    if (isOnline && supabase) {
      // In a real app, logs might be individual rows. Here we store as one blob for simplicity matching LocalStorage.
      const { data, error } = await supabase.from('patient_logs').select('data').eq('id', 'full_log').single();
      if (!error && data) return data.data;
    }
    const saved = localStorage.getItem('er_patient_log');
    return saved ? JSON.parse(saved) : [];
  },

  async saveLogs(logs: PatientLogEntry[]) {
    localStorage.setItem('er_patient_log', JSON.stringify(logs));
    if (isOnline && supabase) {
      await supabase.from('patient_logs').upsert({ id: 'full_log', data: logs });
    }
  },

  // --- SUBSCRIPTIONS (Real-time) ---
  subscribeToBeds(callback: (beds: Bed[]) => void) {
    if (!isOnline || !supabase) return { unsubscribe: () => {} };

    const subscription = supabase
      .channel('public:beds')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'beds', filter: 'id=eq.current_beds' }, (payload) => {
        if (payload.new && payload.new.data) {
          callback(payload.new.data);
        }
      })
      .subscribe();

    return { unsubscribe: () => supabase.removeChannel(subscription) };
  }
};
