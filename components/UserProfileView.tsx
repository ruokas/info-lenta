
import React, { useState, useMemo } from 'react';
import { UserProfile, UserPreferences, PatientLogEntry, StaffSpecialization } from '../types';
import { User, Phone, Settings, Bell, Save, CheckCircle, Grid, List, ClipboardList, LayoutDashboard, Award, GraduationCap } from 'lucide-react';

interface UserProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  patientLogs: PatientLogEntry[];
  specializations: StaffSpecialization[];
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onUpdateUser, patientLogs, specializations }) => {
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences || {
      defaultView: user.role === 'Nurse' ? 'table' : user.role === 'Admin' ? 'dashboard' : 'map',
      notificationsEnabled: true,
      soundEnabled: false
  });
  const [isSaved, setIsSaved] = useState(false);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
      const myLogs = patientLogs.filter(log => log.treatedByDoctorName === user.name);
      
      const totalPatients = myLogs.length;
      
      // Calculate stats for THIS MONTH
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthLogs = myLogs.filter(l => new Date(l.dischargeTime) >= startOfMonth);
      
      // Avg Duration
      let totalMins = 0;
      monthLogs.forEach(l => {
          if (l.totalDuration) {
              const parts = l.totalDuration.split(' ');
              parts.forEach(p => {
                  if (p.includes('h')) totalMins += parseInt(p) * 60;
                  if (p.includes('m')) totalMins += parseInt(p);
              });
          }
      });
      const avgDuration = monthLogs.length > 0 ? Math.round(totalMins / monthLogs.length) : 0;
      const h = Math.floor(avgDuration / 60);
      const m = avgDuration % 60;

      return {
          totalAllTime: totalPatients,
          monthCount: monthLogs.length,
          avgTime: `${h}h ${m}m`
      };
  }, [patientLogs, user]);

  const handleSave = () => {
      const updatedUser: UserProfile = {
          ...user,
          phone: phoneNumber,
          preferences: preferences
      };
      onUpdateUser(updatedUser);
      
      // Save to local storage
      localStorage.setItem(`er_prefs_${user.id}`, JSON.stringify(preferences));
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const specializationName = specializations.find(s => s.id === user.specializationId)?.name;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl shadow-2xl ${user.role === 'Doctor' ? 'bg-blue-600 text-white' : user.role === 'Nurse' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'}`}>
                {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-100">{user.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-sm font-medium border border-slate-700">{user.role === 'Doctor' ? 'Gydytojas' : user.role === 'Nurse' ? 'Slaugytoja' : 'Administratorius'}</span>
                    {specializationName && <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-sm font-medium border border-blue-900/50 flex items-center gap-1"><GraduationCap size={12}/> {specializationName}</span>}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Pacientų šį mėnesį</div>
                <div className="text-3xl font-bold text-slate-200">{stats.monthCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Vid. gydymo trukmė</div>
                <div className="text-3xl font-bold text-blue-400">{stats.avgTime}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Viso karjeroje</div>
                <div className="text-3xl font-bold text-slate-200">{stats.totalAllTime}</div>
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            
            {/* Contact Info */}
            <div>
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><Phone size={20} className="text-emerald-500"/> Kontaktinė informacija</h3>
                <div className="max-w-md">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Telefonas / DECT (Rodomas komandai)</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)} 
                            placeholder="Pvz. 1234" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:border-emerald-500 outline-none transition"
                        />
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div>
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><Settings size={20} className="text-blue-500"/> Programos nustatymai</h3>
                
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pradinis vaizdas (prisijungus)</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setPreferences({...preferences, defaultView: 'map'})}
                                className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition ${preferences.defaultView === 'map' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <Grid size={18}/> Žemėlapis
                            </button>
                            <button 
                                onClick={() => setPreferences({...preferences, defaultView: 'table'})}
                                className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition ${preferences.defaultView === 'table' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <List size={18}/> Sąrašas
                            </button>
                            <button 
                                onClick={() => setPreferences({...preferences, defaultView: 'tasks'})}
                                className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition ${preferences.defaultView === 'tasks' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <ClipboardList size={18}/> Užduotys
                            </button>
                             <button 
                                onClick={() => setPreferences({...preferences, defaultView: 'dashboard'})}
                                className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition ${preferences.defaultView === 'dashboard' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <LayoutDashboard size={18}/> Suvestinė
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-yellow-500" />
                                <span className="text-sm font-medium text-slate-200">Rodyti pranešimus</span>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={preferences.notificationsEnabled} 
                                onChange={(e) => setPreferences({...preferences, notificationsEnabled: e.target.checked})} 
                                className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-800 flex gap-4">
                <button 
                    onClick={handleSave} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
                >
                    {isSaved ? <CheckCircle size={20}/> : <Save size={20}/>}
                    {isSaved ? 'Išsaugota!' : 'Išsaugoti pakeitimus'}
                </button>
            </div>

        </div>

    </div>
  );
};

export default UserProfileView;
