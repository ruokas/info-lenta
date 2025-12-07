
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Activity, User, Stethoscope, Shield, Clock, ChevronRight, Hash, Mail, Lock } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      const { data: userProfile, error: profileError } = await supabase
        .from('personnel')
        .select('*, roles(name)')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
      } else {
        const user: UserProfile = {
          id: userProfile.id,
          name: userProfile.name,
          role: userProfile.roles.name,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
        };
        onLogin(user);
      }
    }
  };


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

           {/* Content Area (Grid or Form) */}
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px] flex flex-col items-center justify-center">
              <div className="w-full max-w-md bg-slate-900/80 border border-slate-700/50 p-8 rounded-2xl backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex justify-center">
                  <div className="bg-slate-900/50 p-4 rounded-full border border-slate-700 shadow-[0_0_15px_rgba(148,163,184,0.1)]">
                    <Shield size={32} className="text-slate-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center text-white mb-6">Prisijungimas</h3>
                {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-900/30 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <Mail size={14} /> El. paštas
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jusu.pastas@ligonine.lt"
                      className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <Lock size={14} /> Slaptažodis
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!email || !password}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/40 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prisijungti
                  </button>
                </form>
                 <p className="text-center text-sm text-slate-500 mt-6">
                  Neturite paskyros? <a href="/signup" className="font-semibold text-blue-400 hover:underline">Registruokitės</a>
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
