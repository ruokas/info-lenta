
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';
import { UserProfile } from '../types';

interface SignUpViewProps {
  onSignUp: (user: UserProfile) => void;
}

const SignUpView: React.FC<SignUpViewProps> = ({ onSignUp }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Doctor' | 'Nurse' | 'Charge Nurse' | 'Admin'>('Doctor');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (signUpData.user) {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleError) {
        setError(roleError.message);
        return;
      }

      const { error: personnelError } = await supabase.from('personnel').insert({
        id: signUpData.user.id,
        name,
        email,
      });

      if (personnelError) {
        setError(personnelError.message);
        return;
      }

      const { error: userRoleError } = await supabase.from('user_roles').insert({
        user_id: signUpData.user.id,
        role_id: roleData.id,
      });

      if (userRoleError) {
        setError(userRoleError.message);
      } else {
        setSuccess(true);
        const user: UserProfile = {
          id: signUpData.user.id,
          name,
          role,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
        };
        onSignUp(user);
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans text-slate-100">
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-700/50 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="bg-slate-900/50 p-4 rounded-full border border-slate-700 shadow-[0_0_15px_rgba(148,163,184,0.1)]">
              <UserPlus size={32} className="text-slate-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-center text-white mb-6">Sukurti paskyrą</h3>

          {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-900/30 p-3 rounded-lg">{error}</p>}
          {success ? (
            <p className="text-emerald-400 text-sm text-center mb-4 bg-emerald-900/30 p-3 rounded-lg">
              Paskyra sėkmingai sukurta! Dabar galite <a href="/login" className="font-semibold underline">prisijungti</a>.
            </p>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2"><User size={14}/> Vardas</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vardas Pavardė" required className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2"><Mail size={14}/> El. paštas</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jusu.pastas@ligonine.lt" required className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2"><Lock size={14}/> Slaptažodis</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2"><Briefcase size={14}/> Rolė</label>
                 <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option value="Doctor">Gydytojas</option>
                    <option value="Nurse">Slaugytoja</option>
                    <option value="Charge Nurse">Vyresnioji slaugytoja</option>
                    <option value="Admin">Administratorius</option>
                 </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/40 transition">Registruotis</button>
            </form>
          )}
          <p className="text-center text-sm text-slate-500 mt-6">
            Jau turite paskyrą? <a href="/login" className="font-semibold text-blue-400 hover:underline">Prisijunkite</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpView;
