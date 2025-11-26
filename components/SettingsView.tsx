import React, { useState } from 'react';
import { Staff } from '../types';
import { Trash2, Plus, User, Stethoscope, RefreshCw, RotateCcw, Database, Save, CheckCircle } from 'lucide-react';
import { isSupabaseConfigured, updateSupabaseConfig, clearSupabaseConfig } from '../lib/supabaseClient';

interface SettingsViewProps {
  doctors: Staff[];
  setDoctors: (doctors: Staff[]) => void;
  nurses: Staff[];
  setNurses: (nurses: Staff[]) => void;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  onResetData: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  doctors, setDoctors,
  nurses, setNurses,
  autoRefresh, setAutoRefresh,
  onResetData
}) => {
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newNurseName, setNewNurseName] = useState('');
  
  // Supabase Config State
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('sb_key') || '');
  const isSyncConfigured = isSupabaseConfigured();

  const addDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) return;
    const newDoc: Staff = {
      id: `d-${Date.now()}`,
      name: newDoctorName,
      role: 'Doctor'
    };
    setDoctors([...doctors, newDoc]);
    setNewDoctorName('');
  };

  const removeDoctor = (id: string) => {
    if (confirm('Ar tikrai norite ištrinti šį gydytoją?')) {
        setDoctors(doctors.filter(d => d.id !== id));
    }
  };

  const addNurse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNurseName.trim()) return;
    const newNurse: Staff = {
      id: `n-${Date.now()}`,
      name: newNurseName,
      role: 'Nurse'
    };
    setNurses([...nurses, newNurse]);
    setNewNurseName('');
  };

  const removeNurse = (id: string) => {
     if (confirm('Ar tikrai norite ištrinti šią slaugytoją?')) {
        setNurses(nurses.filter(n => n.id !== id));
     }
  };

  const handleSaveSupabase = () => {
    if (sbUrl && sbKey) {
      updateSupabaseConfig(sbUrl, sbKey);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
        <div className="bg-slate-800 p-2 rounded-lg"><RotateCcw size={24} className="text-slate-400" /></div>
        Nustatymai
      </h2>

      {/* Cloud Sync Section */}
      <div className="bg-slate-900 border border-blue-900/30 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Database size={100} className="text-blue-500" />
        </div>
        <div className="flex items-center gap-2 mb-4 text-slate-100 text-lg font-semibold border-b border-slate-800 pb-2 relative z-10">
           <Database className="text-blue-500" size={20} />
           <h3>Duomenų sinchronizacija (Supabase)</h3>
           {isSyncConfigured && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded ml-2 flex items-center gap-1"><CheckCircle size={10}/> Aktyvuota</span>}
        </div>
        
        <p className="text-sm text-slate-400 mb-4 max-w-2xl relative z-10">
          Įveskite savo Supabase projekto duomenis, kad įgalintumėte realaus laiko duomenų sinchronizaciją tarp kelių įrenginių. Jei paliksite tuščia, programa veiks tik lokaliame įrenginyje.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Project URL</label>
            <input 
              type="text" 
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              placeholder="https://xyz.supabase.co"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Anon / Public Key</label>
            <input 
              type="password" 
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-3 relative z-10">
           <button 
             onClick={handleSaveSupabase}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm shadow-lg shadow-blue-900/20"
           >
             <Save size={16} /> Išsaugoti ir prisijungti
           </button>
           {isSyncConfigured && (
             <button 
              onClick={clearSupabaseConfig}
              className="px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg font-medium transition text-sm"
             >
               Atsijungti
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Doctors Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-100 text-lg font-semibold border-b border-slate-800 pb-2">
            <Stethoscope className="text-blue-500" size={20} />
            <h3>Gydytojų sąrašas</h3>
          </div>
          
          <form onSubmit={addDoctor} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDoctorName}
              onChange={(e) => setNewDoctorName(e.target.value)}
              placeholder="Gyd. Vardas Pavardė"
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              type="submit"
              disabled={!newDoctorName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {doctors.map(doc => (
              <div key={doc.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition">
                <span className="text-slate-300">{doc.name}</span>
                <button 
                  onClick={() => removeDoctor(doc.id)}
                  className="text-slate-500 hover:text-red-400 transition bg-slate-900/50 p-1.5 rounded"
                  title="Ištrinti"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nurses Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-100 text-lg font-semibold border-b border-slate-800 pb-2">
            <User className="text-green-500" size={20} />
            <h3>Slaugytojų sąrašas</h3>
          </div>

           <form onSubmit={addNurse} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newNurseName}
              onChange={(e) => setNewNurseName(e.target.value)}
              placeholder="Slaug. Vardas"
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button 
              type="submit"
              disabled={!newNurseName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {nurses.map(nurse => (
              <div key={nurse.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition">
                <span className="text-slate-300">{nurse.name}</span>
                <button 
                  onClick={() => removeNurse(nurse.id)}
                  className="text-slate-500 hover:text-red-400 transition bg-slate-900/50 p-1.5 rounded"
                  title="Ištrinti"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
         <h3 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-800 pb-2">Bendrieji nustatymai</h3>
         
         <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded text-blue-400">
                  <RefreshCw size={20} className={autoRefresh ? "animate-spin" : ""} />
                </div>
                <div>
                  <p className="font-medium text-slate-200">Automatinis atnaujinimas</p>
                  <p className="text-xs text-slate-500">Atnaujinti ekrano duomenis kas 60 sekundžių (nereikalinga jei Supabase aktyvuota)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => {
                   if(confirm('DĖMESIO: Ar tikrai norite atstatyti visus nustatymus ir pacientų duomenis į pradinius? Visi pakeitimai bus prarasti.')) {
                     onResetData();
                   }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-red-900/20 text-red-400 border border-red-900/30 hover:border-red-900/70 rounded-lg transition"
              >
                <RotateCcw size={18} />
                Atstatyti pradinius duomenis (Reset)
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsView;