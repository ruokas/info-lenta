import React, { useState } from 'react';
import { Staff, UserProfile } from '../types';
import { Activity, User, Stethoscope, LogIn } from 'lucide-react';

interface LoginViewProps {
  doctors: Staff[];
  nurses: Staff[];
  onLogin: (user: UserProfile) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ doctors, nurses, onLogin }) => {
  const [role, setRole] = useState<'Doctor' | 'Nurse' | 'Admin'>('Doctor');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [adminName, setAdminName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    let user: UserProfile | null = null;
    const loginTime = new Date().toISOString();

    if (role === 'Admin') {
      if (!adminName.trim()) return;
      user = {
        id: 'admin',
        name: adminName,
        role: 'Assistant', // Using Assistant type for Admin generic
        isAuthenticated: true,
        loginTime
      };
    } else {
      const list = role === 'Doctor' ? doctors : nurses;
      const staff = list.find(s => s.id === selectedStaffId);
      if (staff) {
        user = {
          ...staff,
          isAuthenticated: true,
          loginTime
        };
      }
    }

    if (user) {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-blue-600 p-4 rounded-2xl inline-block mb-4 shadow-lg shadow-blue-900/50">
          <Activity size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">ER Flow Manager</h1>
        <p className="text-slate-400 mt-2">Priėmimo skyriaus valdymo sistema</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <LogIn size={20} className="text-blue-500" />
            Prisijungimas
          </h2>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-6">
          
          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg">
            <button
              type="button"
              onClick={() => { setRole('Doctor'); setSelectedStaffId(''); }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${role === 'Doctor' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Gydytojas
            </button>
            <button
              type="button"
              onClick={() => { setRole('Nurse'); setSelectedStaffId(''); }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${role === 'Nurse' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Slaugytoja
            </button>
            <button
              type="button"
              onClick={() => { setRole('Admin'); setSelectedStaffId(''); }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${role === 'Admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Admin
            </button>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500 uppercase">
              {role === 'Admin' ? 'Jūsų vardas' : `Pasirinkite ${role === 'Doctor' ? 'gydytoją' : 'slaugytoją'}`}
            </label>
            
            <div className="relative">
              {role === 'Doctor' ? (
                <Stethoscope className="absolute left-3 top-3 text-slate-500" size={18} />
              ) : (
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
              )}
              
              {role === 'Admin' ? (
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Įveskite vardą..."
                  autoFocus
                />
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- Pasirinkite iš sąrašo --</option>
                  {(role === 'Doctor' ? doctors : nurses).map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={role !== 'Admin' && !selectedStaffId || role === 'Admin' && !adminName}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Pradėti darbą
          </button>
        </form>
        
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            ER Flow Manager v1.2 &bull; Pasirinkite savo profilį norėdami tęsti
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;