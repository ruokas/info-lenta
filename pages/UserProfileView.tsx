
import React, { useState, useMemo } from 'react';
import { UserProfile, UserPreferences, PatientLogEntry, StaffSpecialization, MedicationItem, MedicationProtocol, ProtocolMedication } from '../types';
import { User, Phone, Settings, Bell, Save, CheckCircle, Grid, List, ClipboardList, LayoutDashboard, Award, GraduationCap, Mail, Pill, Plus, Trash2, Edit2, X, Search } from 'lucide-react';

interface UserProfileViewProps {
    user: UserProfile;
    onUpdateUser: (updatedUser: UserProfile) => void;
    patientLogs: PatientLogEntry[];
    specializations: StaffSpecialization[];
    medicationBank: MedicationItem[];
    medicationCombinations: MedicationProtocol[];
    onSaveCombination: (combo: MedicationProtocol) => void;
    onUpdateCombination: (combo: MedicationProtocol) => void;
    onDeleteCombination: (comboId: string) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
    user,
    onUpdateUser,
    patientLogs,
    specializations,
    medicationBank,
    medicationCombinations,
    onSaveCombination,
    onUpdateCombination,
    onDeleteCombination
}) => {
    const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
    const [email, setEmail] = useState(user.email || '');
    const [preferences, setPreferences] = useState<UserPreferences>(user.preferences || {
        defaultView: user.role === 'Nurse' ? 'table' : user.role === 'Admin' ? 'dashboard' : 'map',
        notificationsEnabled: true,
        soundEnabled: false
    });
    const [isSaved, setIsSaved] = useState(false);

    // Combination Modal State
    const [showComboModal, setShowComboModal] = useState(false);
    const [editingCombo, setEditingCombo] = useState<MedicationProtocol | null>(null);
    const [comboName, setComboName] = useState('');
    const [comboMeds, setComboMeds] = useState<ProtocolMedication[]>([]);
    const [medSearch, setMedSearch] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        const myLogs = patientLogs.filter(log => log.treatedByDoctorName === user.name);
        const totalPatients = myLogs.length;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthLogs = myLogs.filter(l => new Date(l.dischargeTime) >= startOfMonth);

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

    // Medication search results
    const filteredMeds = useMemo(() => {
        if (medSearch.length < 2) return [];
        const q = medSearch.toLowerCase();
        return medicationBank.filter(m =>
            m.isActive !== false && m.name.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [medSearch, medicationBank]);

    const handleSave = () => {
        const updatedUser: UserProfile = {
            ...user,
            phone: phoneNumber,
            email: email,
            preferences: preferences
        };
        onUpdateUser(updatedUser);
        localStorage.setItem(`er_prefs_${user.id}`, JSON.stringify(preferences));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    // Combination handlers
    const openNewComboModal = () => {
        setEditingCombo(null);
        setComboName('');
        setComboMeds([]);
        setMedSearch('');
        setShowComboModal(true);
    };

    const openEditComboModal = (combo: MedicationProtocol) => {
        setEditingCombo(combo);
        setComboName(combo.name);
        setComboMeds([...combo.meds]);
        setMedSearch('');
        setShowComboModal(true);
    };

    const addMedToCombo = (med: MedicationItem) => {
        setComboMeds(prev => [...prev, { name: med.name, dose: med.dose, route: med.route }]);
        setMedSearch('');
    };

    const removeMedFromCombo = (index: number) => {
        setComboMeds(prev => prev.filter((_, i) => i !== index));
    };

    const saveCombo = () => {
        if (!comboName.trim() || comboMeds.length === 0) return;

        if (editingCombo) {
            onUpdateCombination({
                ...editingCombo,
                name: comboName.trim(),
                meds: comboMeds
            });
        } else {
            onSaveCombination({
                id: `combo-${Date.now()}`,
                name: comboName.trim(),
                meds: comboMeds,
                actions: []
            });
        }
        setShowComboModal(false);
    };

    const confirmDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const executeDelete = () => {
        if (deleteConfirmId) {
            onDeleteCombination(deleteConfirmId);
            setDeleteConfirmId(null);
        }
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

            {/* Medication Combinations Section */}
            {(user.role === 'Doctor' || user.role === 'Nurse') && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 md:p-5 shadow-sm mb-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                            <Pill size={18} className="text-cyan-500" /> Mano Vaistų Deriniai
                        </h3>
                        <button
                            onClick={openNewComboModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition"
                        >
                            <Plus size={14} /> Naujas
                        </button>
                    </div>

                    {medicationCombinations.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Pill size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Neturite išsaugotų vaistų derinių</p>
                            <p className="text-xs mt-1">Sukurkite derinius, kad greičiau skirtumėte vaistus</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {medicationCombinations.map(combo => (
                                <div key={combo.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-200">{combo.name}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditComboModal(combo)}
                                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition"
                                                title="Redaguoti"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(combo.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                                                title="Ištrinti"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {combo.meds.map((med, idx) => (
                                            <span key={idx} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                {med.name} {med.dose} {med.route}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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

            {/* Combination Modal */}
            {showComboModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {editingCombo ? 'Redaguoti Derinį' : 'Naujas Vaistų Derinys'}
                            </h3>
                            <button onClick={() => setShowComboModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Derinio pavadinimas</label>
                                <input
                                    type="text"
                                    value={comboName}
                                    onChange={(e) => setComboName(e.target.value)}
                                    placeholder="Pvz. Skausmo protokolas"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Pridėti vaistą</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        type="text"
                                        value={medSearch}
                                        onChange={(e) => setMedSearch(e.target.value)}
                                        placeholder="Ieškoti vaisto..."
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                    />
                                </div>
                                {filteredMeds.length > 0 && (
                                    <div className="mt-1 bg-slate-800 border border-slate-600 rounded-lg max-h-32 overflow-y-auto">
                                        {filteredMeds.map(med => (
                                            <button
                                                key={med.id}
                                                onClick={() => addMedToCombo(med)}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition"
                                            >
                                                {med.name} <span className="text-slate-500">{med.dose} {med.route}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    Vaistai derinyje ({comboMeds.length})
                                </label>
                                {comboMeds.length === 0 ? (
                                    <p className="text-slate-500 text-sm">Pridėkite bent vieną vaistą</p>
                                ) : (
                                    <div className="space-y-1">
                                        {comboMeds.map((med, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                                                <span className="text-sm text-slate-200">{med.name} {med.dose} {med.route}</span>
                                                <button onClick={() => removeMedFromCombo(idx)} className="text-red-400 hover:text-red-300">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowComboModal(false)}
                                className="flex-1 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition"
                            >
                                Atšaukti
                            </button>
                            <button
                                onClick={saveCombo}
                                disabled={!comboName.trim() || comboMeds.length === 0}
                                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg disabled:opacity-50 transition"
                            >
                                {editingCombo ? 'Atnaujinti' : 'Išsaugoti'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Ištrinti derinį?</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Ar tikrai norite ištrinti šį vaistų derinį? Šio veiksmo negalima atšaukti.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition"
                            >
                                Atšaukti
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                            >
                                Ištrinti
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserProfileView;
