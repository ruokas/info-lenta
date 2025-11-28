
import React, { useState, useEffect } from 'react';
import { Staff, UserProfile } from '../types';
import { Activity, User, Stethoscope, Shield, Clock, ChevronRight, Hash } from 'lucide-react';

interface LoginViewProps {
  doctors: Staff[];
  nurses: Staff[];
  onLogin: (user: UserProfile) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ doctors, nurses, onLogin }) => {
  const [activeRole, setActiveRole] = useState<'Doctor' | 'Nurse' | 'Admin'>('Doctor');
  const [adminName, setAdminName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStaffLogin = (staff: Staff) => {
    const user: UserProfile = {
      ...staff,
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };
    onLogin(user);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;
    const user: UserProfile = {
      id: 'admin',
      name: adminName,
      role: 'Admin', // Changed from 'Assistant' to 'Admin'
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };
    onLogin(user);
  };

  // Theme configuration based on role
  const getTheme = () => {
    switch (activeRole) {
      case 'Doctor': return { color: 'blue', icon: <Stethoscope size={24} />, label: 'Gydytojai' };
      case 'Nurse': return { color: 'emerald', icon: <User size={24} />, label: 'Slaugytojos' };
      case 'Admin': return { color: 'violet', icon: <Shield size={24} />, label: 'Administratorius' };
    }
  };

  const theme = getTheme();
  
  // Dynamic classes for colors
  const activeTabClass = (role: string, color: string) => 
    activeRole === role 
      ? `bg-${color}-600 text-white shadow-lg shadow-${color}-900/50 border-${color}-500` 
      : `bg-slate-800/50 text-slate-400 hover:bg-slate-800 border-transparent hover:text-slate-200`;

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans text-slate-100 relative">
      <style>{`
        .bg-dot-pattern {
          background-image: radial-gradient(rgba(59, 130, 246, 0.25) 2px, transparent 2px);
          background-size: 32px 32px;
        }
        .bg-dot-pattern-subtle {
          background-image: radial-gradient(rgba(148, 163, 184, 0.08) 1.5px, transparent 1.5px);
          background-size: 40px 40px;
        }
      `}</style>
      
      {/* LEFT PANEL - Branding & Mood */}
      <div className="hidden lg:flex w-5/12 relative flex-col justify-between p-12 bg-slate-900 overflow-hidden border-r border-slate-800">
        {/* Modern Dotted Background */}
        <div className="absolute inset-0 bg-slate-900 z-0"></div>
        <div className="absolute inset-0 bg-dot-pattern opacity-50 z-0" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-0"></div>
        
        {/* Floating Gradient Orb */}
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-4">
           <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)]">
             <Activity size={32} className="text-white" />
           </div>
           <div>
             <h1 className="text-3xl font-bold tracking-tight">ER Flow Manager</h1>
             <p className="text-blue-400 text-sm font-medium tracking-wide uppercase">Emergency Department OS</p>
           </div>
        </div>

        {/* Center Quote/Graphic */}
        <div className="relative z-10 space-y-6">
           <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl max-w-md shadow-2xl">
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                    <Clock size={20} className="text-blue-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Operatyvus valdymas</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Stebėkite pacientų srautus, lovų užimtumą ir klinikinę eigą realiuoju laiku.
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl max-w-md ml-8 shadow-2xl">
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                    <Shield size={20} className="text-emerald-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Saugūs duomenys</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Visi veiksmai registruojami. Vaistų ir procedūrų kontrolė užtikrina pacientų saugumą.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT PANEL - Interaction */}
      <div className="flex-1 flex flex-col relative bg-slate-950">
        {/* Subtle Background for Right Panel */}
        <div className="absolute inset-0 bg-dot-pattern-subtle z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none z-0"></div>

        {/* Mobile Header (visible only on small screens) */}
        <div className="lg:hidden p-6 flex items-center gap-3 border-b border-slate-800 relative z-10 bg-slate-950/80 backdrop-blur-md">
          <div className="p-2 bg-blue-600 rounded-lg">
             <Activity size={24} className="text-white" />
          </div>
          <span className="font-bold text-xl">ER Flow</span>
        </div>

        <div className="flex-1 p-6 lg:p-12 flex flex-col max-w-5xl mx-auto w-full relative z-10">
           
           {/* Top Bar: Clock & Date */}
           <div className="flex justify-end mb-8 lg:mb-12">
              <div className="text-right">
                 <div className="text-5xl lg:text-7xl font-light text-slate-100 tracking-tighter tabular-nums drop-shadow-lg">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
                 <div className="text-slate-500 font-medium text-lg uppercase tracking-widest">
                    {currentTime.toLocaleDateString('lt-LT', { weekday: 'long', month: 'long', day: 'numeric' })}
                 </div>
              </div>
           </div>

           {/* Role Selector Tabs */}
           <div className="mb-8">
              <h2 className="text-slate-400 text-sm uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-slate-700"></span>
                Pasirinkite profilį
                <span className="flex-1 h-[1px] bg-slate-700"></span>
              </h2>
              <div className="flex flex-wrap gap-3">
                 <button 
                   onClick={() => setActiveRole('Doctor')}
                   className={`flex-1 py-4 px-6 rounded-xl border flex items-center justify-center gap-3 transition-all duration-300 ${activeTabClass('Doctor', 'blue')}`}
                 >
                   <Stethoscope size={20} />
                   <span className="font-semibold">Gydytojas</span>
                 </button>
                 <button 
                   onClick={() => setActiveRole('Nurse')}
                   className={`flex-1 py-4 px-6 rounded-xl border flex items-center justify-center gap-3 transition-all duration-300 ${activeTabClass('Nurse', 'emerald')}`}
                 >
                   <User size={20} />
                   <span className="font-semibold">Slaugytoja</span>
                 </button>
                 <button 
                   onClick={() => setActiveRole('Admin')}
                   className={`flex-1 py-4 px-6 rounded-xl border flex items-center justify-center gap-3 transition-all duration-300 ${activeTabClass('Admin', 'violet')}`}
                 >
                   <Shield size={20} />
                   <span className="font-semibold">Admin</span>
                 </button>
              </div>
           </div>

           {/* Content Area (Grid or Form) */}
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
              
              {activeRole === 'Admin' ? (
                <div className="h-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="w-full max-w-md bg-slate-900/80 border border-violet-500/30 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
                      <div className="mb-6 flex justify-center">
                         <div className="bg-violet-900/30 p-4 rounded-full border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                            <Hash size={32} className="text-violet-400" />
                         </div>
                      </div>
                      <h3 className="text-xl font-bold text-center text-white mb-6">Administratoriaus prisijungimas</h3>
                      <form onSubmit={handleAdminLogin} className="space-y-4">
                         <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Vardas</label>
                            <input 
                              type="text" 
                              value={adminName}
                              onChange={(e) => setAdminName(e.target.value)}
                              placeholder="Įveskite vardą"
                              className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none transition"
                              autoFocus
                            />
                         </div>
                         <button 
                           type="submit"
                           disabled={!adminName.trim()}
                           className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/40 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           Prisijungti
                         </button>
                      </form>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                   {(activeRole === 'Doctor' ? doctors : nurses).map((staff, idx) => {
                     const isTriage = staff.assignedSection === 'Triažas';
                     return (
                     <button
                       key={staff.id}
                       onClick={() => handleStaffLogin(staff)}
                       style={{ animationDelay: `${idx * 50}ms` }}
                       className={`
                         group relative p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-in fade-in zoom-in fill-mode-backwards
                         ${activeRole === 'Doctor' 
                            ? 'bg-slate-800/60 border-slate-700/50 hover:bg-blue-900/30 hover:border-blue-500/50 shadow-sm hover:shadow-blue-900/20' 
                            : isTriage 
                                ? 'bg-indigo-900/30 border-indigo-500/50 hover:bg-indigo-900/50 hover:border-indigo-400 shadow-md shadow-indigo-900/20'
                                : 'bg-slate-800/60 border-slate-700/50 hover:bg-emerald-900/30 hover:border-emerald-500/50 shadow-sm hover:shadow-emerald-900/20'}
                       `}
                     >
                        <div className="flex items-start justify-between mb-4">
                           <div className={`
                             w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-opacity-20 ring-white relative
                             ${activeRole === 'Doctor' 
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' 
                                : isTriage 
                                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'}
                           `}>
                              {staff.name.substring(0, 2).toUpperCase()}
                           </div>
                           <ChevronRight className={`opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 ${activeRole === 'Doctor' ? 'text-blue-400' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                             <p className="font-bold text-slate-100 text-lg leading-tight mb-1">{staff.name}</p>
                             {isTriage && <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded shadow-sm shadow-indigo-500/50 animate-pulse">TRIAŽAS</span>}
                           </div>
                           <p className="text-xs uppercase font-medium text-slate-500 tracking-wider group-hover:text-slate-300 transition-colors">
                             {activeRole === 'Doctor' ? 'Gydytojas' : 'Slaugytoja'}
                           </p>
                        </div>
                     </button>
                   )})}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
