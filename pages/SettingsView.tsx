
import React, { useState, useMemo, useEffect } from 'react';
import { Staff, UserProfile, MedicationItem, Bed, MedicationProtocol, AppSettings, ActionType, PatientStatus, StaffSpecialization, StaffSkill, PatientLogEntry } from '../types';
import { RefreshCw, RotateCcw, Database, Save, CheckCircle, Edit2, X, Check, AlertTriangle, Pill, Search, Eye, EyeOff, ChevronDown, ChevronRight, Layers, Filter, FolderInput, FolderMinus, Trash2, Users, UserPlus, MapPin, UserX, UserCheck, LayoutTemplate, Square, BookOpen, Clock, Plus, Activity, Microscope, FileImage, HeartPulse, Waves, ClipboardList, GraduationCap, Award, Palette, Phone, Timer, BarChart2 } from 'lucide-react';
import { isSupabaseConfigured, updateSupabaseConfig, clearSupabaseConfig } from '../lib/supabaseClient';
import { useAuth } from '../src/context/AuthContext';
import { useData } from '../src/context/DataContext';

interface SettingsViewProps {
    initialTab?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    initialTab,
}) => {
    const { currentUser } = useAuth();
    const {
        doctors, setDoctors,
        nurses, setNurses,
        medicationBank, setMedications,
        autoRefresh, setAutoRefresh,
        resetData: onResetData,
        beds, setBeds,
        sections, setSections,
        protocols, setProtocols,
        appSettings, setAppSettings,
        specializations, setSpecializations,
        skills, setSkills,
        patientLog: patientLogs
    } = useData();

    if (!currentUser) return null;

    const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'meds' | 'structure' | 'protocols'>('general');

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab as any);
        }
    }, [initialTab]);

    const [activeStaffTab, setActiveStaffTab] = useState<'doctors' | 'nurses'>('doctors');
    const [newStaffName, setNewStaffName] = useState('');

    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [editStaffName, setEditStaffName] = useState('');
    const [editStaffSpec, setEditStaffSpec] = useState('');
    const [editStaffPhone, setEditStaffPhone] = useState('');

    const [editStaffSkills, setEditStaffSkills] = useState<string[]>([]);

    // New Medication State
    const [showMedModal, setShowMedModal] = useState(false);
    const [medSearch, setMedSearch] = useState('');
    const [medCategoryFilter, setMedCategoryFilter] = useState('ALL');
    const [bulkMeds, setBulkMeds] = useState<{ name: string; dose: string; route: string; category: string; quantity: number; minQuantity: number }[]>([
        { name: '', dose: '', route: 'IV', category: 'Kiti', quantity: 100, minQuantity: 10 }
    ]);
    const [editingMedId, setEditingMedId] = useState<string | null>(null);
    const [editMedData, setEditMedData] = useState<Partial<MedicationItem>>({});

    const handleAddBulkRow = () => {
        setBulkMeds([...bulkMeds, { name: '', dose: '', route: 'IV', category: 'Kiti', quantity: 100, minQuantity: 10 }]);
    };

    const handleRemoveBulkRow = (index: number) => {
        if (bulkMeds.length > 1) {
            setBulkMeds(bulkMeds.filter((_, i) => i !== index));
        }
    };

    const handleBulkChange = (index: number, field: string, value: any) => {
        const newMeds = [...bulkMeds];
        (newMeds[index] as any)[field] = value;
        setBulkMeds(newMeds);
    };

    const saveBulkMeds = () => {
        const validMeds = bulkMeds.filter(m => m.name.trim() !== '');
        if (validMeds.length === 0) return;

        const newItems: MedicationItem[] = validMeds.map(m => ({
            id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...m,
            isActive: true
        }));

        setMedications(prev => [...prev, ...newItems]);
        setBulkMeds([{ name: '', dose: '', route: 'IV', category: 'Kiti', quantity: 100, minQuantity: 10 }]);
        setShowMedModal(false);
    };

    const startEditingMed = (med: MedicationItem) => {
        setEditingMedId(med.id);
        setEditMedData({ ...med });
    };

    const saveEditMed = () => {
        if (!editingMedId) return;
        setMedications(prev => prev.map(m => m.id === editingMedId ? { ...m, ...editMedData } : m));
        setEditingMedId(null);
    };

    const deleteMed = (id: string) => {
        if (window.confirm('Ar tikrai norite ištrinti šį vaistą?')) {
            setMedications(prev => prev.filter(m => m.id !== id));
        }
    };

    // Existing Categories
    const existingCategories = useMemo(() => {
        const cats = new Set(medicationBank.map(m => m.category).filter(Boolean));
        return ['ALL', ...Array.from(cats)];
    }, [medicationBank]);

    const filteredMeds = useMemo(() => {
        return medicationBank.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(medSearch.toLowerCase()) || m.category?.toLowerCase().includes(medSearch.toLowerCase());
            const matchesCategory = medCategoryFilter === 'ALL' || m.category === medCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [medicationBank, medSearch, medCategoryFilter]);

    const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

    // --- QUALIFICATIONS STATE ---
    const [showQualManager, setShowQualManager] = useState(false);
    const [newSpecName, setNewSpecName] = useState('');
    const [newSpecType, setNewSpecType] = useState<'Doctor' | 'Nurse'>('Doctor');
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillColor, setNewSkillColor] = useState('bg-blue-500');

    // INLINE CONFIRMATION STATES
    const [deletingSpecId, setDeletingSpecId] = useState<string | null>(null);
    const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);



    const [selectedStructureSection, setSelectedStructureSection] = useState<string | null>(null);
    const [newSectionName, setNewSectionName] = useState('');
    const [newBedLabel, setNewBedLabel] = useState('');
    const [editingSectionName, setEditingSectionName] = useState<string | null>(null);
    const [tempSectionName, setTempSectionName] = useState('');
    const [editingBedId, setEditingBedId] = useState<string | null>(null);
    const [editBedLabel, setEditBedLabel] = useState('');

    const [newProtocolName, setNewProtocolName] = useState('');
    const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);
    const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null);
    const [newItemType, setNewItemType] = useState<'MED' | 'ACTION'>('MED');
    const [newProtoMedName, setNewProtoMedName] = useState('');
    const [newProtoMedDose, setNewProtoMedDose] = useState('');
    const [newProtoMedRoute, setNewProtoMedRoute] = useState('IV');
    const [newProtoActionType, setNewProtoActionType] = useState<ActionType>('LABS');
    const [newProtoActionName, setNewProtoActionName] = useState('');

    const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url') || '');
    const [sbKey, setSbKey] = useState(localStorage.getItem('sb_key') || '');
    const isSyncConfigured = isSupabaseConfigured();

    const isAdmin = currentUser.role === 'Admin';

    // --- STATS HELPER ---
    const calculateStaffStats = (staffName: string) => {
        const logs = patientLogs.filter(l => l.treatedByDoctorName === staffName);
        if (logs.length === 0) return { totalPatients: 0, avgTime: '-' };

        let totalMins = 0;
        logs.forEach(l => {
            if (l.totalDuration) {
                const parts = l.totalDuration.split(' ');
                parts.forEach(p => {
                    if (p.includes('h')) totalMins += parseInt(p) * 60;
                    if (p.includes('m')) totalMins += parseInt(p);
                });
            }
        });

        const avgMins = Math.round(totalMins / logs.length);
        const h = Math.floor(avgMins / 60);
        const m = avgMins % 60;

        return {
            totalPatients: logs.length,
            avgTime: `${h}h ${m}m`
        };
    };

    const handleAddStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaffName.trim()) return;
        const newStaff: Staff = {
            id: `${activeStaffTab === 'doctors' ? 'd' : 'n'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: newStaffName.trim(),
            role: activeStaffTab === 'doctors' ? 'Doctor' : 'Nurse',
            isActive: false, isDisabled: false,
            skillIds: []
        };
        if (activeStaffTab === 'doctors') setDoctors([...doctors, newStaff]);
        else setNurses([...nurses, newStaff]);
        setNewStaffName('');
    };
    const startEditingStaff = (staff: Staff) => {
        setDeletingStaffId(null);
        setEditingStaffId(staff.id);
        setEditStaffName(staff.name);
        setEditStaffSpec(staff.specializationId || '');
        setEditStaffPhone(staff.phone || '');
        setEditStaffSkills(staff.skillIds || []);
    };
    const saveEditStaff = () => {
        if (!editStaffName.trim()) return;
        const updater = (s: Staff) => s.id === editingStaffId ? {
            ...s,
            name: editStaffName.trim(),
            specializationId: editStaffSpec || undefined,
            phone: editStaffPhone.trim() || undefined,
            skillIds: editStaffSkills
        } : s;

        if (activeStaffTab === 'doctors') setDoctors(doctors.map(updater));
        else setNurses(nurses.map(updater));
        setEditingStaffId(null);
    };
    const toggleStaffSkill = (skillId: string) => {
        setEditStaffSkills(prev => prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]);
    };

    const toggleStaffDisabled = (staff: Staff) => {
        const updatedStaff = { ...staff, isDisabled: !staff.isDisabled };
        if (activeStaffTab === 'doctors') setDoctors(doctors.map(d => d.id === staff.id ? updatedStaff : d));
        else setNurses(nurses.map(n => n.id === staff.id ? updatedStaff : n));
    };
    const executeDeleteStaff = (id: string) => {
        if (activeStaffTab === 'doctors') setDoctors(doctors.filter(d => d.id !== id));
        else setNurses(nurses.filter(n => n.id !== id));
        setDeletingStaffId(null);
    };

    const handleAddSpecialization = () => {
        if (!newSpecName.trim()) return;
        setSpecializations([...specializations, { id: `spec-${Date.now()}`, name: newSpecName.trim(), isDoctor: newSpecType === 'Doctor' }]);
        setNewSpecName('');
    };
    const executeDeleteSpec = (id: string) => {
        setSpecializations(specializations.filter(s => s.id !== id));
        setDeletingSpecId(null);
    };

    const handleAddSkill = () => {
        if (!newSkillName.trim()) return;
        setSkills([...skills, { id: `skill-${Date.now()}`, label: newSkillName.trim(), color: newSkillColor }]);
        setNewSkillName('');
    };
    const executeDeleteSkill = (id: string) => {
        setSkills(skills.filter(s => s.id !== id));
        setDeletingSkillId(null);
    };


    const handleAddSection = () => {
        if (!newSectionName.trim() || sections.includes(newSectionName.trim())) return;
        setSections([...sections, newSectionName.trim()]);
        setNewSectionName('');
    };

    const handleRenameSection = () => {
        if (!editingSectionName || !tempSectionName.trim() || sections.includes(tempSectionName.trim())) return;
        const oldName = editingSectionName;
        const newName = tempSectionName.trim();
        setSections(sections.map(s => s === oldName ? newName : s));
        setBeds(beds.map(b => b.section === oldName ? { ...b, section: newName } : b));
        setNurses(nurses.map(n => n.assignedSection === oldName ? { ...n, assignedSection: newName } : n));
        setEditingSectionName(null);
        if (selectedStructureSection === oldName) setSelectedStructureSection(newName);
    };

    const handleDeleteSection = (sectionName: string) => {
        if (beds.some(b => b.section === sectionName)) {
            alert('Negalima ištrinti posto, kuriame yra lovų. Pirmiausia ištrinkite arba perkelkite lovas.');
            return;
        }
        if (!window.confirm(`Ar tikrai ištrinti postą "${sectionName}"?`)) return;
        setSections(sections.filter(s => s !== sectionName));
        if (selectedStructureSection === sectionName) setSelectedStructureSection(null);
    };

    const handleAddBed = () => {
        if (!selectedStructureSection || !newBedLabel.trim()) return;
        const newBed: Bed = {
            id: `bed-${Date.now()}`,
            label: newBedLabel.trim(),
            section: selectedStructureSection,
            status: PatientStatus.EMPTY
        };
        setBeds([...beds, newBed]);
        setNewBedLabel('');
    };

    const handleDeleteBed = (bedId: string) => {
        if (beds.find(b => b.id === bedId)?.patient) {
            alert('Negalima ištrinti lovos su pacientu!');
            return;
        }
        if (!window.confirm('Ar tikrai ištrinti šią lovą?')) return;
        setBeds(beds.filter(b => b.id !== bedId));
    };

    const handleRenameBed = (bedId: string) => {
        if (!editBedLabel.trim()) return;
        setBeds(beds.map(b => b.id === bedId ? { ...b, label: editBedLabel.trim() } : b));
        setEditingBedId(null);
    };

    const handleAddProtocol = () => {
        if (!newProtocolName.trim()) return;
        const newProto: MedicationProtocol = {
            id: `prot-${Date.now()}`,
            name: newProtocolName.trim(),
            meds: [],
            actions: []
        };
        setProtocols([...protocols, newProto]);
        setNewProtocolName('');
    };

    const initDeleteProtocol = (id: string) => {
        setDeletingProtocolId(id);
    };

    const executeDeleteProtocol = (id: string) => {
        setProtocols(protocols.filter(p => p.id !== id));
        setDeletingProtocolId(null);
    };

    const handleAddItemToProtocol = (protocolId: string) => {
        setProtocols(protocols.map(p => {
            if (p.id !== protocolId) return p;
            if (newItemType === 'MED' && newProtoMedName.trim()) {
                return {
                    ...p,
                    meds: [...p.meds, { name: newProtoMedName.trim(), dose: newProtoMedDose, route: newProtoMedRoute }]
                };
            }
            if (newItemType === 'ACTION' && newProtoActionName.trim()) {
                return {
                    ...p,
                    actions: [...p.actions, { type: newProtoActionType, name: newProtoActionName.trim() }]
                };
            }
            return p;
        }));
        setNewProtoMedName(''); setNewProtoActionName('');
    };

    const removeItemFromProtocol = (protocolId: string, type: 'MED' | 'ACTION', index: number) => {
        setProtocols(protocols.map(p => {
            if (p.id !== protocolId) return p;
            if (type === 'MED') {
                return { ...p, meds: p.meds.filter((_, i) => i !== index) };
            } else {
                return { ...p, actions: p.actions.filter((_, i) => i !== index) };
            }
        }));
    };

    const handleSaveSupabase = () => { if (sbUrl && sbKey) updateSupabaseConfig(sbUrl, sbKey); };

    const selectedSectionBeds = useMemo(() => {
        return beds.filter(b => b.section === selectedStructureSection);
    }, [beds, selectedStructureSection]);

    const getActionIcon = (type: ActionType) => {
        switch (type) {
            case 'LABS': return <Microscope size={14} />;
            case 'XRAY': return <FileImage size={14} />;
            case 'CT': return <Activity size={14} />;
            case 'EKG': return <HeartPulse size={14} />;
            case 'ULTRASOUND': return <Waves size={14} />;
            default: return <ClipboardList size={14} />;
        }
    };

    const SKILL_COLORS = [
        { name: 'Blue', cls: 'bg-blue-500' },
        { name: 'Red', cls: 'bg-red-500' },
        { name: 'Green', cls: 'bg-green-500' },
        { name: 'Yellow', cls: 'bg-yellow-500' },
        { name: 'Purple', cls: 'bg-purple-500' },
        { name: 'Pink', cls: 'bg-pink-500' },
        { name: 'Indigo', cls: 'bg-indigo-500' },
        { name: 'Cyan', cls: 'bg-cyan-500' },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg"><RotateCcw size={24} className="text-slate-400" /></div>
                    Nustatymai
                </h2>

                <div className="flex flex-wrap gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'general' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Bendrieji</button>
                    <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'staff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Personalas</button>
                    <button onClick={() => setActiveTab('meds')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'meds' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Vaistai</button>
                    {isAdmin && (
                        <>
                            <button onClick={() => setActiveTab('structure')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'structure' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Struktūra</button>
                            <button onClick={() => setActiveTab('protocols')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'protocols' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Protokolai</button>
                        </>
                    )}
                </div>
            </div>

            {!isAdmin && (activeTab === 'staff' || activeTab === 'structure' || activeTab === 'protocols') && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
                    <Database size={20} className="text-red-500" />
                    <p>Šią sekciją redaguoti gali tik <strong>Administratorius</strong>.</p>
                </div>
            )}

            {/* --- TAB: STAFF --- */}
            {isAdmin && activeTab === 'staff' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex gap-6 min-h-[500px]">
                    <div className="flex-1 flex flex-col">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-6 border-b border-slate-800 pb-4 gap-4">
                            <div className="flex items-center gap-2 text-slate-100 text-lg font-semibold shrink-0">
                                <Users className="text-blue-500" size={20} />
                                <h3>Personalo Bankas</h3>
                            </div>
                            <div className="flex bg-slate-800 p-1 rounded-lg">
                                <button onClick={() => setActiveStaffTab('doctors')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeStaffTab === 'doctors' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Gydytojai</button>
                                <button onClick={() => setActiveStaffTab('nurses')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeStaffTab === 'nurses' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Slaugytojos</button>
                            </div>
                        </div>
                        {/* Add Staff */}
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex gap-3 items-end mb-4">
                            <div className="flex-1">
                                <label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Vardas Pavardė</label>
                                <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="Įveskite vardą..." className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                            </div>
                            <button onClick={handleAddStaff} disabled={!newStaffName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"><UserPlus size={16} /> Pridėti</button>
                        </div>
                        {/* Staff List */}
                        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                            {(activeStaffTab === 'doctors' ? doctors : nurses).map(staff => {
                                const stats = activeStaffTab === 'doctors' ? calculateStaffStats(staff.name) : null;
                                return (
                                    <div key={staff.id} className={`bg-slate-800 border rounded-lg p-3 group transition ${staff.isDisabled ? 'border-red-900/30 opacity-60' : 'border-slate-700 hover:border-slate-600'}`}>
                                        {editingStaffId === staff.id ? (
                                            <div className="space-y-4 p-2 bg-slate-950/30 rounded">
                                                {/* Header / Name Edit */}
                                                <div className="flex gap-2">
                                                    <input value={editStaffName} onChange={(e) => setEditStaffName(e.target.value)} className="flex-1 bg-slate-900 border border-blue-500 rounded px-3 py-2 text-sm outline-none text-white font-medium" autoFocus />
                                                    <button onClick={saveEditStaff} className="px-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold"><Check size={18} /></button>
                                                    <button onClick={() => setEditingStaffId(null)} className="px-3 bg-slate-700 hover:bg-slate-600 text-white rounded"><X size={18} /></button>
                                                </div>

                                                {/* Extended Fields Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1"><GraduationCap size={10} /> Specializacija</label>
                                                        <select
                                                            value={editStaffSpec}
                                                            onChange={(e) => setEditStaffSpec(e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-2 outline-none"
                                                        >
                                                            <option value="">-- Nėra --</option>
                                                            {specializations.filter(s => s.isDoctor === (staff.role === 'Doctor')).map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1"><Phone size={10} /> Telefonas / DECT</label>
                                                        <input
                                                            value={editStaffPhone}
                                                            onChange={(e) => setEditStaffPhone(e.target.value)}
                                                            placeholder="Pvz. 1234"
                                                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-2 outline-none placeholder:text-slate-600"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Skills Section */}
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1"><Palette size={10} /> Įgūdžiai (Badges)</label>
                                                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg">
                                                        {skills.map(skill => {
                                                            const isSelected = editStaffSkills.includes(skill.id);
                                                            return (
                                                                <button
                                                                    key={skill.id}
                                                                    onClick={() => toggleStaffSkill(skill.id)}
                                                                    className={`text-[10px] px-2 py-1 rounded border transition-all ${isSelected ? `${skill.color} text-white border-transparent` : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                                                                >
                                                                    {skill.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Performance Stats (Read Only) */}
                                                {stats && (
                                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/50">
                                                        <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                                            <span className="text-[10px] text-slate-500 uppercase">Pacientų istorijoje</span>
                                                            <span className="text-xs font-bold text-blue-400">{stats.totalPatients}</span>
                                                        </div>
                                                        <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                                            <span className="text-[10px] text-slate-500 uppercase">Vid. laikas</span>
                                                            <span className="text-xs font-bold text-emerald-400">{stats.avgTime}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : deletingStaffId === staff.id ? (
                                            <div className="flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                                <span className="text-red-400 text-xs font-bold">Ištrinti visam laikui?</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => executeDeleteStaff(staff.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">TAIP</button>
                                                    <button onClick={() => setDeletingStaffId(null)} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">NE</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between cursor-pointer" onClick={() => startEditingStaff(staff)}>
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${staff.isDisabled ? 'bg-slate-700 text-slate-500' : activeStaffTab === 'doctors' ? 'bg-blue-900/50 text-blue-300' : 'bg-emerald-900/50 text-emerald-300'}`}>{staff.name.substring(0, 2).toUpperCase()}</div>
                                                    <div>
                                                        <div className={`font-medium truncate text-sm flex items-center gap-2 ${staff.isDisabled ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                            {staff.name}
                                                            {staff.specializationId && (
                                                                <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                                                    {specializations.find(s => s.id === staff.specializationId)?.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            {staff.phone && <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Phone size={8} /> {staff.phone}</span>}
                                                            {staff.skillIds && staff.skillIds.length > 0 && (
                                                                <div className="flex gap-1">
                                                                    {staff.skillIds.map(skId => {
                                                                        const sk = skills.find(s => s.id === skId);
                                                                        return sk ? <div key={skId} className={`w-1.5 h-1.5 rounded-full ${sk.color}`} title={sk.label}></div> : null;
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => toggleStaffDisabled(staff)} className={`p-1.5 rounded hover:bg-slate-700 ${staff.isDisabled ? 'text-green-500 hover:text-green-400' : 'text-slate-500 hover:text-amber-400'}`}>{staff.isDisabled ? <UserCheck size={14} /> : <UserX size={14} />}</button>
                                                    <button onClick={() => startEditingStaff(staff)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 size={14} /></button>
                                                    <button onClick={() => setDeletingStaffId(staff.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Qualifications Manager Sidebar */}
                    <div className="w-1/3 border-l border-slate-800 pl-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm"><Award size={16} className="text-yellow-500" /> Kvalifikacijos</h3>
                            <button onClick={() => setShowQualManager(!showQualManager)} className="text-xs text-blue-400 hover:text-blue-300">{showQualManager ? 'Slėpti' : 'Valdyti'}</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                            {/* Specializations */}
                            <div>
                                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-1"><GraduationCap size={12} /> Specializacijos</h4>
                                <div className="space-y-1 mb-2">
                                    {specializations.map(spec => (
                                        <div key={spec.id} className="flex justify-between items-center text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
                                            <span>{spec.name} <span className="opacity-50">({spec.isDoctor ? 'Gyd' : 'Slaug'})</span></span>
                                            {showQualManager && (
                                                deletingSpecId === spec.id ? (
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => executeDeleteSpec(spec.id)} type="button" className="text-[9px] bg-red-600 text-white px-1.5 rounded font-bold hover:bg-red-700">TRINTI?</button>
                                                        <button onClick={() => setDeletingSpecId(null)} type="button" className="text-slate-400 hover:text-white px-1"><X size={10} /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeletingSpecId(spec.id)} type="button" className="text-slate-500 hover:text-red-400 p-1"><X size={12} /></button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {showQualManager && (
                                    <div className="flex gap-1">
                                        <input value={newSpecName} onChange={e => setNewSpecName(e.target.value)} placeholder="Nauja spec." className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs outline-none text-white" />
                                        <select value={newSpecType} onChange={e => setNewSpecType(e.target.value as any)} className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] rounded px-1 outline-none">
                                            <option value="Doctor">Gyd</option><option value="Nurse">Slaug</option>
                                        </select>
                                        <button onClick={handleAddSpecialization} disabled={!newSpecName.trim()} className="bg-blue-600 text-white p-1 rounded"><Plus size={12} /></button>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            <div>
                                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-1"><Palette size={12} /> Įgūdžiai / Badges</h4>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {skills.map(skill => (
                                        <span
                                            key={skill.id}
                                            className={`text-[10px] px-2 py-0.5 rounded text-white flex items-center gap-1 transition-all ${deletingSkillId === skill.id ? 'bg-red-600' : skill.color} ${deletingSkillId === skill.id ? 'cursor-pointer hover:bg-red-700' : ''}`}
                                            onClick={deletingSkillId === skill.id ? () => executeDeleteSkill(skill.id) : undefined}
                                        >
                                            {deletingSkillId === skill.id ? 'Trinti?' : skill.label}
                                            {showQualManager && (
                                                deletingSkillId === skill.id ? (
                                                    <button onClick={(e) => { e.stopPropagation(); setDeletingSkillId(null); }} type="button" className="text-white/70 hover:text-white ml-1"><X size={10} /></button>
                                                ) : (
                                                    <button onClick={() => setDeletingSkillId(skill.id)} type="button" className="hover:text-black/50 ml-1"><X size={10} /></button>
                                                )
                                            )}
                                        </span>
                                    ))}
                                </div>
                                {showQualManager && (
                                    <div className="space-y-2 bg-slate-950 p-2 rounded border border-slate-800">
                                        <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="Trumpinys (pvz. ECHO)" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none text-white" />
                                        <div className="flex flex-wrap gap-1">
                                            {SKILL_COLORS.map(c => (
                                                <button key={c.name} onClick={() => setNewSkillColor(c.cls)} className={`w-4 h-4 rounded-full ${c.cls} ${newSkillColor === c.cls ? 'ring-2 ring-white' : ''}`}></button>
                                            ))}
                                        </div>
                                        <button onClick={handleAddSkill} disabled={!newSkillName.trim()} className="w-full bg-blue-600 text-white py-1 rounded text-xs font-bold mt-1">Pridėti</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Medications tab removed - now in dedicated Medications module (Admin only) */}

            {/* --- TAB: MEDICATIONS --- */}
            {activeTab === 'meds' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 border-b border-slate-800 pb-4 gap-4">
                        <div className="flex items-center gap-2 text-slate-100 text-lg font-semibold shrink-0">
                            <Pill className="text-yellow-500" size={20} />
                            <h3>Vaistų bankas</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Ieškoti vaistų..."
                                    value={medSearch}
                                    onChange={(e) => setMedSearch(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <select
                                value={medCategoryFilter}
                                onChange={(e) => setMedCategoryFilter(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="ALL">Visos kategorijos</option>
                                {existingCategories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button
                                onClick={() => setShowMedModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                            >
                                <Plus size={16} /> Pridėti Vaistus
                            </button>
                        </div>
                    </div>

                    {/* Medications Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                                    <th className="p-3 font-medium">Pavadinimas</th>
                                    <th className="p-3 font-medium">Dozė</th>
                                    <th className="p-3 font-medium">Būdas</th>
                                    <th className="p-3 font-medium">Kategorija</th>
                                    <th className="p-3 font-medium text-center">Likutis</th>
                                    <th className="p-3 font-medium text-right">Veiksmai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredMeds.map(med => (
                                    <tr key={med.id} className="hover:bg-slate-800/50 transition group">
                                        <td className="p-3 font-medium text-slate-200">
                                            {editingMedId === med.id ? (
                                                <input
                                                    value={editMedData.name || ''}
                                                    onChange={(e) => setEditMedData({ ...editMedData, name: e.target.value })}
                                                    className="w-full bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                med.name
                                            )}
                                        </td>
                                        <td className="p-3 text-slate-400">
                                            {editingMedId === med.id ? (
                                                <input
                                                    value={editMedData.dose || ''}
                                                    onChange={(e) => setEditMedData({ ...editMedData, dose: e.target.value })}
                                                    className="w-full bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                                                />
                                            ) : (
                                                med.dose
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingMedId === med.id ? (
                                                <select
                                                    value={editMedData.route || ''}
                                                    onChange={(e) => setEditMedData({ ...editMedData, route: e.target.value })}
                                                    className="bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs outline-none"
                                                >
                                                    <option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option><option value="SC">SC</option><option value="INF">INF</option>
                                                </select>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300">{med.route}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-slate-400">
                                            {editingMedId === med.id ? (
                                                <input
                                                    value={editMedData.category || ''}
                                                    onChange={(e) => setEditMedData({ ...editMedData, category: e.target.value })}
                                                    className="w-full bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs outline-none"
                                                />
                                            ) : (
                                                med.category
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingMedId === med.id ? (
                                                <input
                                                    type="number"
                                                    value={editMedData.quantity || 0}
                                                    onChange={(e) => setEditMedData({ ...editMedData, quantity: parseInt(e.target.value) })}
                                                    className="w-20 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none text-center"
                                                />
                                            ) : (
                                                <span className={`fount-bold ${med.quantity <= (med.minQuantity || 10) ? 'text-red-400' : 'text-emerald-400'}`}>{med.quantity}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            {editingMedId === med.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={saveEditMed} className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded"><Check size={16} /></button>
                                                    <button onClick={() => setEditingMedId(null)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => startEditingMed(med)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 size={16} /></button>
                                                    <button onClick={() => deleteMed(med.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredMeds.length === 0 && <div className="p-8 text-center text-slate-500">Nėra vaistų</div>}
                    </div>

                    {/* Bulk Add Modal */}
                    {showMedModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><FolderInput size={24} className="text-green-500" /> Pridėti Vaistus</h3>
                                    <button onClick={() => setShowMedModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                                </div>

                                <div className="overflow-y-auto flex-1 mb-6 pr-2 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-slate-500 text-xs uppercase border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                                                <th className="p-2 w-10">#</th>
                                                <th className="p-2">Pavadinimas</th>
                                                <th className="p-2 w-24">Dozė</th>
                                                <th className="p-2 w-24">Būdas</th>
                                                <th className="p-2 w-32">Kategorija</th>
                                                <th className="p-2 w-24 text-center">Kiekis</th>
                                                <th className="p-2 w-24 text-center">Min.</th>
                                                <th className="p-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkMeds.map((med, index) => (
                                                <tr key={index} className="border-b border-slate-800/50">
                                                    <td className="p-2 text-slate-500 text-xs">{index + 1}</td>
                                                    <td className="p-2">
                                                        <input
                                                            value={med.name}
                                                            onChange={(e) => handleBulkChange(index, 'name', e.target.value)}
                                                            placeholder="Vaisto pavadinimas"
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                            autoFocus={index === bulkMeds.length - 1 && index > 0}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            value={med.dose}
                                                            onChange={(e) => handleBulkChange(index, 'dose', e.target.value)}
                                                            placeholder="Dozė"
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            value={med.route}
                                                            onChange={(e) => handleBulkChange(index, 'route', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                        >
                                                            <option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option><option value="SC">SC</option><option value="INF">INF</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            value={med.category}
                                                            onChange={(e) => handleBulkChange(index, 'category', e.target.value)}
                                                            placeholder="Kategorija"
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                                            list="category-suggestions"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            value={med.quantity}
                                                            onChange={(e) => handleBulkChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-center"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            value={med.minQuantity}
                                                            onChange={(e) => handleBulkChange(index, 'minQuantity', parseInt(e.target.value) || 0)}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-center"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        {bulkMeds.length > 1 && (
                                                            <button onClick={() => handleRemoveBulkRow(index)} className="text-slate-500 hover:text-red-500 transition">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={handleAddBulkRow}
                                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition px-4 py-2 hover:bg-slate-800 rounded-lg"
                                        >
                                            <Plus size={18} /> Pridėti dar vieną eilutę
                                        </button>
                                    </div>

                                    <datalist id="category-suggestions">
                                        {existingCategories.filter(c => c !== 'ALL').map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>

                                <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
                                    <button
                                        onClick={() => setShowMedModal(false)}
                                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition font-medium"
                                    >
                                        Atšaukti
                                    </button>
                                    <button
                                        onClick={saveBulkMeds}
                                        disabled={bulkMeds.every(m => !m.name.trim())}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Save size={18} /> Išsaugoti Visus ({bulkMeds.filter(m => m.name.trim()).length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* --- TAB: STRUCTURE --- */}
            {
                isAdmin && activeTab === 'structure' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm min-h-[500px] flex gap-6">
                        {/* Sections Panel (Left) */}
                        <div className="w-1/3 border-r border-slate-800 pr-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><LayoutTemplate size={20} className="text-purple-500" /> Zonos (Postai)</h3>

                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                                {sections.map(section => (
                                    <div key={section} className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center group ${selectedStructureSection === section ? 'bg-purple-900/20 border-purple-500/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`} onClick={() => setSelectedStructureSection(section)}>
                                        {editingSectionName === section ? (
                                            <div className="flex gap-1 w-full" onClick={e => e.stopPropagation()}>
                                                <input value={tempSectionName} onChange={e => setTempSectionName(e.target.value)} className="w-full bg-slate-950 border border-blue-500 rounded px-1 text-xs outline-none text-white" autoFocus onKeyDown={e => e.key === 'Enter' && handleRenameSection()} />
                                                <button onClick={handleRenameSection} className="text-green-500 hover:text-green-400"><Check size={14} /></button>
                                                <button onClick={() => setEditingSectionName(null)} className="text-red-500 hover:text-red-400"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-medium truncate">{section}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingSectionName(section); setTempSectionName(section); }} className="p-1 hover:text-blue-400"><Edit2 size={12} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section); }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex gap-2">
                                    <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Naujas postas" className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-purple-500 text-slate-200" />
                                    <button onClick={handleAddSection} disabled={!newSectionName.trim()} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition disabled:opacity-50"><Plus size={16} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Beds Panel (Right) */}
                        <div className="flex-1 flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><Square size={20} className="text-blue-500" /> Lovos: {selectedStructureSection || 'Pasirinkite zoną'}</h3>

                            {selectedStructureSection ? (
                                <>
                                    <div className="flex-1 bg-slate-950/30 rounded-xl border border-slate-800 p-4 overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {selectedSectionBeds.map(bed => (
                                                <div key={bed.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col justify-between items-center group relative hover:border-slate-500 transition">
                                                    {editingBedId === bed.id ? (
                                                        <div className="flex flex-col gap-2 w-full">
                                                            <input value={editBedLabel} onChange={e => setEditBedLabel(e.target.value)} className="bg-slate-950 border border-blue-500 rounded px-1 py-0.5 text-center text-sm outline-none text-white w-full" autoFocus onKeyDown={e => e.key === 'Enter' && handleRenameBed(bed.id)} />
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => handleRenameBed(bed.id)} className="text-green-500 bg-green-900/20 p-1 rounded"><Check size={12} /></button>
                                                                <button onClick={() => setEditingBedId(null)} className="text-red-500 bg-red-900/20 p-1 rounded"><X size={12} /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-lg font-bold text-slate-200">{bed.label}</span>
                                                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-slate-800/80 p-1 rounded">
                                                                <button onClick={() => { setEditingBedId(bed.id); setEditBedLabel(bed.label); }} className="text-slate-400 hover:text-blue-400"><Edit2 size={12} /></button>
                                                                <button onClick={() => handleDeleteBed(bed.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
                                                            </div>
                                                            <div className={`mt-2 w-2 h-2 rounded-full ${bed.status === 'Laisva' ? 'bg-slate-600' : 'bg-green-500'}`} title={bed.status}></div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                                        <input value={newBedLabel} onChange={e => setNewBedLabel(e.target.value)} placeholder="Naujos lovos Nr." className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-slate-200" />
                                        <button onClick={handleAddBed} disabled={!newBedLabel.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 flex items-center gap-2"><Plus size={16} /> Pridėti Lovą</button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                                    Pasirinkite zoną kairėje, kad matytumėte lovas.
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* --- TAB: PROTOCOLS --- */}
            {
                isAdmin && activeTab === 'protocols' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col">
                        <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4"><BookOpen size={20} className="text-emerald-500" /> Gydymo Protokolai</h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Protocol List */}
                            <div className="space-y-4">
                                {protocols.map(proto => (
                                    <div key={proto.id} className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
                                        <div className="p-3 bg-slate-800 flex justify-between items-center">
                                            {deletingProtocolId === proto.id ? (
                                                <div className="flex-1 flex items-center justify-between animate-in fade-in">
                                                    <span className="text-red-400 font-bold text-sm">Ištrinti protokolą?</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => executeDeleteProtocol(proto.id)} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold">TAIP</button>
                                                        <button onClick={() => setDeletingProtocolId(null)} className="px-3 py-1 bg-slate-700 text-white rounded text-xs">NE</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-bold text-slate-200">{proto.name}</h4>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingProtocolId(editingProtocolId === proto.id ? null : proto.id)} className={`p-1.5 rounded transition ${editingProtocolId === proto.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><Edit2 size={16} /></button>
                                                        <button onClick={() => initDeleteProtocol(proto.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"><Trash2 size={16} /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {/* Meds List */}
                                            {proto.meds.map((med, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <Pill size={14} className="text-blue-400" />
                                                        <span className="text-slate-300">{med.name}</span>
                                                        <span className="text-slate-500 text-xs">{med.dose} {med.route}</span>
                                                    </div>
                                                    {editingProtocolId === proto.id && <button onClick={() => removeItemFromProtocol(proto.id, 'MED', idx)} className="text-slate-600 hover:text-red-400"><X size={14} /></button>}
                                                </div>
                                            ))}
                                            {/* Actions List */}
                                            {proto.actions.map((act, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-yellow-500">{getActionIcon(act.type)}</div>
                                                        <span className="text-slate-300">{act.name}</span>
                                                        <span className="text-slate-500 text-[10px] uppercase">{act.type}</span>
                                                    </div>
                                                    {editingProtocolId === proto.id && <button onClick={() => removeItemFromProtocol(proto.id, 'ACTION', idx)} className="text-slate-600 hover:text-red-400"><X size={14} /></button>}
                                                </div>
                                            ))}
                                            {proto.meds.length === 0 && proto.actions.length === 0 && <p className="text-xs text-slate-500 italic">Tuščias protokolas</p>}
                                        </div>

                                        {/* Editor Panel inside Card */}
                                        {editingProtocolId === proto.id && (
                                            <div className="p-3 bg-slate-900 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex gap-2 mb-2">
                                                    <button onClick={() => setNewItemType('MED')} className={`flex-1 py-1 text-xs font-bold rounded ${newItemType === 'MED' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>+ Vaistas</button>
                                                    <button onClick={() => setNewItemType('ACTION')} className={`flex-1 py-1 text-xs font-bold rounded ${newItemType === 'ACTION' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'}`}>+ Veiksmas</button>
                                                </div>

                                                {newItemType === 'MED' ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input value={newProtoMedName} onChange={e => setNewProtoMedName(e.target.value)} placeholder="Vaistas" className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none" />
                                                        <div className="flex gap-2">
                                                            <input value={newProtoMedDose} onChange={e => setNewProtoMedDose(e.target.value)} placeholder="Dozė" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none" />
                                                            <select value={newProtoMedRoute} onChange={e => setNewProtoMedRoute(e.target.value)} className="w-20 bg-slate-950 border border-slate-700 rounded px-1 py-1 text-sm text-white outline-none">
                                                                <option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option>
                                                            </select>
                                                            <button onClick={() => handleAddItemToProtocol(proto.id)} className="bg-blue-600 text-white px-3 rounded"><Plus size={16} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <select value={newProtoActionType} onChange={e => setNewProtoActionType(e.target.value as ActionType)} className="w-24 bg-slate-950 border border-slate-700 rounded px-1 py-1 text-sm text-white outline-none">
                                                            <option value="LABS">Tyrimai</option><option value="XRAY">Rentgenas</option><option value="CT">KT</option><option value="EKG">EKG</option>
                                                        </select>
                                                        <input value={newProtoActionName} onChange={e => setNewProtoActionName(e.target.value)} placeholder="Pavadinimas" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none" />
                                                        <button onClick={() => handleAddItemToProtocol(proto.id)} className="bg-yellow-600 text-white px-3 rounded"><Plus size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Create New Protocol */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-fit sticky top-6">
                                <h4 className="font-bold text-slate-300 mb-4">Sukurti naują protokolą</h4>
                                <div className="flex gap-2 mb-4">
                                    <input value={newProtocolName} onChange={e => setNewProtocolName(e.target.value)} placeholder="Protokolo pavadinimas (pvz. Insultas)" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
                                </div>
                                <button onClick={handleAddProtocol} disabled={!newProtocolName.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold transition disabled:opacity-50">Sukurti</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- TAB: GENERAL SETTINGS --- */}
            {
                activeTab === 'general' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-800 pb-2">Bendrieji nustatymai</h3>

                        <div className="space-y-6">

                            {isAdmin && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Clock size={14} /> Pacientų buvimo laiko limitas (Alert)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={appSettings.overdueMinutes}
                                                onChange={e => setAppSettings({ ...appSettings, overdueMinutes: parseInt(e.target.value) || 240 })}
                                                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white w-24 text-center font-bold outline-none focus:border-blue-500"
                                            />
                                            <span className="text-slate-400 text-sm">minučių ({Math.floor(appSettings.overdueMinutes / 60)} val.)</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">Po šio laiko kortelė pradės mirksėti raudonai.</p>
                                    </div>
                                </div>
                            )}

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

                            {isAdmin && (
                                <>
                                    <div className="pt-4 border-t border-slate-800">
                                        <div className="bg-slate-900 border border-blue-900/30 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={100} className="text-blue-500" /></div>
                                            <div className="flex items-center gap-2 mb-4 text-slate-100 text-lg font-semibold border-b border-slate-800 pb-2 relative z-10">
                                                <Database className="text-blue-500" size={20} />
                                                <h3>Duomenų sinchronizacija (Supabase)</h3>
                                                {isSyncConfigured && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded ml-2 flex items-center gap-1"><CheckCircle size={10} /> Aktyvuota</span>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                <div><label className="block text-xs font-medium text-slate-500 uppercase mb-1">Project URL</label><input type="text" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-mono" /></div>
                                                <div><label className="block text-xs font-medium text-slate-500 uppercase mb-1">Anon / Public Key</label><input type="password" value={sbKey} onChange={(e) => setSbKey(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-mono" /></div>
                                            </div>
                                            <div className="mt-4 flex gap-3 relative z-10">
                                                <button type="button" onClick={handleSaveSupabase} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm shadow-lg shadow-blue-900/20"><Save size={16} /> Išsaugoti ir prisijungti</button>
                                                {isSyncConfigured && <button type="button" onClick={clearSupabaseConfig} className="px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg font-medium transition text-sm">Atsijungti</button>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm('DĖMESIO: Ar tikrai norite atstatyti visus nustatymus ir pacientų duomenis į pradinius? Visi pakeitimai bus prarasti.')) {
                                                    onResetData();
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-red-900/20 text-red-400 border border-red-900/30 hover:border-red-900/70 rounded-lg transition"
                                        >
                                            <RotateCcw size={18} />
                                            Atstatyti pradinius duomenis (Reset)
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SettingsView;
