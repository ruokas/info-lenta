
import React, { useState, useMemo } from 'react';
import { UserProfile, UserPreferences, PatientLogEntry, StaffSpecialization } from '../types';
import { User, Phone, Settings, Bell, Save, CheckCircle, Grid, List, ClipboardList, LayoutDashboard, Award, GraduationCap, Mail } from 'lucide-react';

interface UserProfileViewProps {
    user: UserProfile;
    onUpdateUser: (updatedUser: UserProfile) => void;
    patientLogs: PatientLogEntry[];
    specializations: StaffSpecialization[];
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onUpdateUser, patientLogs, specializations }) => {
    const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
    const [email, setEmail] = useState(user.email || '');
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
            email: email,
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
        <div className="p-4 md:p-5 max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar">

            <div className="flex items-center gap-3 mb-5">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl shadow-lg ${user.role === 'Doctor' ? 'bg-blue-600 text-white' : user.role === 'Nurse' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'}`}>
                    {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">{user.name}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-medium border border-slate-700">{user.role === 'Doctor' ? 'Gydytojas' : user.role === 'Nurse' ? 'Slaugytoja' : 'Administratorius'}</span>
                        {specializationName && <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-900/50 flex items-center gap-1"><GraduationCap size={11} /> {specializationName}</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {/* Stats Cards */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-0.5">Pacientų šį mėnesį</div>
                    <div className="text-2xl font-bold text-slate-200">{stats.monthCount}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-0.5">Vid. gydymo trukmė</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.avgTime}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-0.5">Viso karjeroje</div>
                    <div className="text-2xl font-bold text-slate-200">{stats.totalAllTime}</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 md:p-5 shadow-sm space-y-5">

                {/* Contact Info */}
                <div>
                    <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2"><Phone size={18} className="text-emerald-500" /> Kontaktinė informacija</h3>
                    <div className="max-w-md space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Telefonas / DECT</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Pvz. 1234"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-emerald-500 outline-none transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">El. paštas</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vardas@example.com"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-emerald-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div>
                    <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2"><Settings size={18} className="text-blue-500" /> Programos nustatymai</h3>

                    <div className="space-y-3 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Pradinis vaizdas</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPreferences({ ...preferences, defaultView: 'map' })}
                                    className={`p-2 rounded-lg border flex items-center gap-1.5 justify-center transition text-sm ${preferences.defaultView === 'map' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <Grid size={16} /> Žemėlapis
                                </button>
                                <button
                                    onClick={() => setPreferences({ ...preferences, defaultView: 'table' })}
                                    className={`p-2 rounded-lg border flex items-center gap-1.5 justify-center transition text-sm ${preferences.defaultView === 'table' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <List size={16} /> Sąrašas
                                </button>
                                <button
                                    onClick={() => setPreferences({ ...preferences, defaultView: 'tasks' })}
                                    className={`p-2 rounded-lg border flex items-center gap-1.5 justify-center transition text-sm ${preferences.defaultView === 'tasks' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <ClipboardList size={16} /> Užduotys
                                </button>
                                <button
                                    onClick={() => setPreferences({ ...preferences, defaultView: 'dashboard' })}
                                    className={`p-2 rounded-lg border flex items-center gap-1.5 justify-center transition text-sm ${preferences.defaultView === 'dashboard' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <LayoutDashboard size={16} /> Suvestinė
                                </button>
                            </div>
                        </div>

                        <div className="pt-1">
                            <label className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition">
                                <div className="flex items-center gap-2.5">
                                    <Bell size={16} className="text-yellow-500" />
                                    <span className="text-sm font-medium text-slate-200">Rodyti pranešimus</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={preferences.notificationsEnabled}
                                    onChange={(e) => setPreferences({ ...preferences, notificationsEnabled: e.target.checked })}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
                    >
                        {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {isSaved ? 'Išsaugota!' : 'Išsaugoti pakeitimus'}
                    </button>
                </div>

            </div>

        </div>
    );
};

export default UserProfileView;
