
import React, { useState, useMemo, useEffect } from 'react';
import { Staff, UserProfile, MedicationItem, Bed, MedicationProtocol, AppSettings, ActionType, PatientStatus, StaffSpecialization, StaffSkill, PatientLogEntry } from '../types';
import { RefreshCw, RotateCcw, Database, Save, CheckCircle, Edit2, X, Check, AlertTriangle, Pill, Search, Eye, EyeOff, ChevronDown, ChevronRight, Layers, Filter, FolderInput, FolderMinus, Trash2, Users, UserPlus, MapPin, UserX, UserCheck, LayoutTemplate, Square, BookOpen, Clock, Plus, Activity, Microscope, FileImage, HeartPulse, Waves, ClipboardList, GraduationCap, Award, Palette, Phone, Timer, BarChart2 } from 'lucide-react';
import { isSupabaseConfigured, updateSupabaseConfig, clearSupabaseConfig } from '../lib/supabaseClient';

interface SettingsViewProps {
  doctors: Staff[];
  setDoctors: (doctors: Staff[]) => void;
  nurses: Staff[];
  setNurses: (nurses: Staff[]) => void;
  medicationBank: MedicationItem[];
  setMedications: (meds: MedicationItem[]) => void;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  onResetData: () => void;
  currentUser: UserProfile;
  beds: Bed[];
  setBeds: (beds: Bed[]) => void;
  sections: string[];
  setSections: (sections: string[]) => void;
  protocols: MedicationProtocol[];
  setProtocols: (protocols: MedicationProtocol[]) => void;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  specializations: StaffSpecialization[];
  setSpecializations: (specs: StaffSpecialization[]) => void;
  skills: StaffSkill[];
  setSkills: (skills: StaffSkill[]) => void;
  initialTab?: string;
  patientLogs?: PatientLogEntry[]; // New Prop
}

const SettingsView: React.FC<SettingsViewProps> = ({
  doctors, setDoctors,
  nurses, setNurses,
  medicationBank, setMedications,
  autoRefresh, setAutoRefresh,
  onResetData,
  currentUser,
  beds, setBeds,
  sections, setSections,
  protocols, setProtocols,
  appSettings, setAppSettings,
  specializations, setSpecializations,
  skills, setSkills,
  initialTab,
  patientLogs = []
}) => {
  
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

  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('IV');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showInactiveMeds, setShowInactiveMeds] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMedName, setEditMedName] = useState('');
  const [editMedDose, setEditMedDose] = useState('');
  const [editMedRoute, setEditMedRoute] = useState('');
  const [editMedCategory, setEditMedCategory] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    const newMed: MedicationItem = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newMedName.trim(), dose: newMedDose.trim(), route: newMedRoute, category: newMedCategory.trim() || 'Kiti', isActive: true
    };
    setMedications([...medicationBank, newMed]);
    setNewMedName(''); setNewMedDose(''); setNewMedCategory('');
  };
  const initDelete = (id: string) => { setEditingId(null); setDeletingId(id); };
  const cancelDelete = () => { setDeletingId(null); };
  const executeDelete = (id: string) => { setMedications(medicationBank.filter(m => m.id !== id)); setDeletingId(null); };
  const toggleMedActive = (id: string) => {
    setMedications(medicationBank.map(m => m.id === id ? { ...m, isActive: m.isActive === undefined ? false : !m.isActive } : m));
  };
  const startEditing = (item: any) => {
    setDeletingId(null); setEditingId(item.id); setEditMedName(item.name); setEditMedDose(item.dose); setEditMedRoute(item.route); setEditMedCategory(item.category || '');
  };
  const saveEdit = (id: string) => {
    if (!editMedName.trim()) return;
    setMedications(medicationBank.map(m => m.id === id ? { ...m, name: editMedName.trim(), dose: editMedDose.trim(), route: editMedRoute, category: editMedCategory.trim() || 'Kiti' } : m));
    setEditingId(null);
  };
  const startEditingCategory = (categoryName: string) => { setEditingCategoryName(categoryName); setTempCategoryName(categoryName); };
  const saveCategoryRename = () => {
    if (!editingCategoryName || !tempCategoryName.trim()) return;
    const oldName = editingCategoryName; const newName = tempCategoryName.trim();
    if (oldName === newName) { setEditingCategoryName(null); return; }
    setMedications(medicationBank.map(med => med.category === oldName ? { ...med, category: newName } : med));
    setEditingCategoryName(null); setTempCategoryName('');
  };
  const deleteCategory = (categoryName: string) => {
    if (!window.confirm(`Ar tikrai norite panaikinti kategoriją "${categoryName}"?`)) return;
    setMedications(medicationBank.map(med => med.category === categoryName ? { ...med, category: 'Kiti' } : med));
  };
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    medicationBank.forEach(m => { if (m.category) cats.add(m.category); });
    ['Antibiotikai', 'Nuskausminamieji', 'Kardiologiniai', 'Reanimaciniai', 'Virškinimo traktui', 'Neurologiniai'].forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [medicationBank]);
  const filteredMeds = useMemo(() => medicationBank.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(medSearch.toLowerCase());
        const matchesActive = showInactiveMeds ? true : (m.isActive !== false);
        const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
        return matchesSearch && matchesActive && matchesCategory;
    }), [medicationBank, medSearch, showInactiveMeds, selectedCategory]);
  const groupedMeds = useMemo(() => {
    const groups: Record<string, MedicationItem[]> = {};
    filteredMeds.forEach(m => { const cat = m.category || 'Kiti'; if (!groups[cat]) groups[cat] = []; groups[cat].push(m); });
    Object.keys(groups).forEach(key => { groups[key].sort((a,b) => a.name.localeCompare(b.name)); });
    return groups;
  }, [filteredMeds]);
  const sortedCategories = Object.keys(groupedMeds).sort((a,b) => { if (a === 'Kiti') return 1; if (b === 'Kiti') return -1; return a.localeCompare(b); });

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
          case 'LABS': return <Microscope size={14}/>;
          case 'XRAY': return <FileImage size={14}/>;
          case 'CT': return <Activity size={14}/>;
          case 'EKG': return <HeartPulse size={14}/>;
          case 'ULTRASOUND': return <Waves size={14}/>;
          default: return <ClipboardList size={14}/>;
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
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
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

      {!isAdmin && (activeTab === 'staff' || activeTab === 'meds' || activeTab === 'structure' || activeTab === 'protocols') && (
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
                                        <button onClick={saveEditStaff} className="px-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold"><Check size={18}/></button>
                                        <button onClick={() => setEditingStaffId(null)} className="px-3 bg-slate-700 hover:bg-slate-600 text-white rounded"><X size={18}/></button>
                                    </div>
                                    
                                    {/* Extended Fields Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1"><GraduationCap size={10}/> Specializacija</label>
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
                                            <label className="block text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1"><Phone size={10}/> Telefonas / DECT</label>
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
                                        <label className="block text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1"><Palette size={10}/> Įgūdžiai (Badges)</label>
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
                                                {staff.phone && <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Phone size={8}/> {staff.phone}</span>}
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
                                        <button onClick={() => toggleStaffDisabled(staff)} className={`p-1.5 rounded hover:bg-slate-700 ${staff.isDisabled ? 'text-green-500 hover:text-green-400' : 'text-slate-500 hover:text-amber-400'}`}>{staff.isDisabled ? <UserCheck size={14}/> : <UserX size={14}/>}</button>
                                        <button onClick={() => startEditingStaff(staff)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 size={14}/></button>
                                        <button onClick={() => setDeletingStaffId(staff.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            )}
                            </div>
                        );})}
                </div>
           </div>

           {/* Qualifications Manager Sidebar */}
           <div className="w-1/3 border-l border-slate-800 pl-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm"><Award size={16} className="text-yellow-500"/> Kvalifikacijos</h3>
                    <button onClick={() => setShowQualManager(!showQualManager)} className="text-xs text-blue-400 hover:text-blue-300">{showQualManager ? 'Slėpti' : 'Valdyti'}</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Specializations */}
                    <div>
                        <h4 className="text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-1"><GraduationCap size={12}/> Specializacijos</h4>
                        <div className="space-y-1 mb-2">
                            {specializations.map(spec => (
                                <div key={spec.id} className="flex justify-between items-center text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
                                    <span>{spec.name} <span className="opacity-50">({spec.isDoctor ? 'Gyd' : 'Slaug'})</span></span>
                                    {showQualManager && (
                                        deletingSpecId === spec.id ? (
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => executeDeleteSpec(spec.id)} type="button" className="text-[9px] bg-red-600 text-white px-1.5 rounded font-bold hover:bg-red-700">TRINTI?</button>
                                                <button onClick={() => setDeletingSpecId(null)} type="button" className="text-slate-400 hover:text-white px-1"><X size={10}/></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeletingSpecId(spec.id)} type="button" className="text-slate-500 hover:text-red-400 p-1"><X size={12}/></button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                        {showQualManager && (
                            <div className="flex gap-1">
                                <input value={newSpecName} onChange={e => setNewSpecName(e.target.value)} placeholder="Nauja spec." className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs outline-none text-white"/>
                                <select value={newSpecType} onChange={e => setNewSpecType(e.target.value as any)} className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] rounded px-1 outline-none">
                                    <option value="Doctor">Gyd</option><option value="Nurse">Slaug</option>
                                </select>
                                <button onClick={handleAddSpecialization} disabled={!newSpecName.trim()} className="bg-blue-600 text-white p-1 rounded"><Plus size={12}/></button>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    <div>
                        <h4 className="text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-1"><Palette size={12}/> Įgūdžiai / Badges</h4>
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
                                            <button onClick={(e) => { e.stopPropagation(); setDeletingSkillId(null); }} type="button" className="text-white/70 hover:text-white ml-1"><X size={10}/></button>
                                        ) : (
                                            <button onClick={() => setDeletingSkillId(skill.id)} type="button" className="hover:text-black/50 ml-1"><X size={10}/></button>
                                        )
                                    )}
                                </span>
                            ))}
                        </div>
                        {showQualManager && (
                            <div className="space-y-2 bg-slate-950 p-2 rounded border border-slate-800">
                                <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="Trumpinys (pvz. ECHO)" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none text-white"/>
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

      {/* --- TAB: MEDICATIONS --- */}
      {activeTab === 'meds' && (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
         <div className="flex flex-col md:flex-row items-center justify-between mb-4 border-b border-slate-800 pb-2 gap-4">
            <div className="flex items-center gap-2 text-slate-100 text-lg font-semibold shrink-0">
                <Pill className="text-yellow-500" size={20} />
                <h3>Vaistų bankas</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative hidden md:block w-40">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-3 pr-8 py-1 text-xs outline-none focus:border-blue-500 appearance-none cursor-pointer">
                    <option value="ALL">Visos kategorijos</option>
                    {existingCategories.map(cat => ( <option key={cat} value={cat}>{cat}</option> ))}
                  </select>
                  <Filter size={14} className="absolute right-2 top-1.5 text-slate-500 pointer-events-none" />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200 shrink-0"><input type="checkbox" checked={showInactiveMeds} onChange={(e) => setShowInactiveMeds(e.target.checked)} className="rounded border-slate-700 bg-slate-800"/> Rodyti neaktyvius</label>
                <div className="relative flex-1 md:flex-none">
                    <Search size={14} className="absolute left-2 top-1.5 text-slate-500" />
                    <input type="text" placeholder="Ieškoti vaistų..." className="bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-200 w-full md:w-48 outline-none focus:border-blue-500" value={medSearch} onChange={(e) => setMedSearch(e.target.value)} />
                </div>
            </div>
         </div>

         {isAdmin && (
            <div className="flex flex-col md:flex-row gap-2 mb-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800 items-end">
                <div className="flex-[2] w-full"><label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Vaisto pavadinimas</label><input type="text" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="pvz. Paracetamolis" className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div className="flex-1 w-full"><label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Numatyta dozė</label><input type="text" value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} placeholder="pvz. 1000mg" className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div className="w-full md:w-32"><label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Kategorija</label><input type="text" list="category-suggestions" value={newMedCategory} onChange={(e) => setNewMedCategory(e.target.value)} placeholder="Kiti" className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /><datalist id="category-suggestions">{existingCategories.map(cat => <option key={cat} value={cat} />)}</datalist></div>
                <div className="w-full md:w-24"><label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Būdas</label><select value={newMedRoute} onChange={(e) => setNewMedRoute(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-2 text-sm outline-none"><option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option><option value="SC">SC</option><option value="Inhal">Inhal</option><option value="Nebul">Nebul</option><option value="Topical">Top</option><option value="PR">PR</option></select></div>
                <div><button type="button" onClick={(e) => handleAddMedication(e)} disabled={!newMedName.trim()} className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 w-full md:w-auto flex justify-center"><CheckCircle size={20} /></button></div>
            </div>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {sortedCategories.map(category => {
                const isExpanded = expandedCategories.includes(category) || medSearch.trim() !== '' || selectedCategory !== 'ALL';
                const isEditingCategory = editingCategoryName === category;
                return (
                <div key={category} className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 transition">
                        {isEditingCategory ? (
                          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                             <FolderInput size={18} className="text-blue-500" />
                             <input value={tempCategoryName} onChange={(e) => setTempCategoryName(e.target.value)} className="bg-slate-900 border border-blue-500 rounded px-2 py-1 text-sm outline-none text-white w-48" autoFocus placeholder="Naujas pavadinimas" />
                             <button onClick={saveCategoryRename} className="p-1 bg-green-600/20 text-green-500 rounded hover:bg-green-600 hover:text-white"><Check size={14}/></button>
                             <button onClick={() => setEditingCategoryName(null)} className="p-1 bg-red-600/20 text-red-500 rounded hover:bg-red-600 hover:text-white"><X size={14}/></button>
                          </div>
                        ) : (
                          <button onClick={() => toggleCategory(category)} className="flex-1 flex items-center gap-2 font-semibold text-slate-300 text-left">
                             {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} <Layers size={16} className="text-slate-500"/> {category}
                             <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-0.5 rounded-full">{groupedMeds[category].length}</span>
                          </button>
                        )}
                        {isAdmin && !isEditingCategory && category !== 'Kiti' && (
                           <div className="flex items-center gap-1 ml-2">
                              <button onClick={(e) => { e.stopPropagation(); startEditingCategory(category); }} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded transition"><FolderInput size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteCategory(category); }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition"><FolderMinus size={14} /></button>
                           </div>
                        )}
                    </div>
                    {isExpanded && (
                        <div className="bg-slate-900/50 p-2 space-y-1">
                            {groupedMeds[category].map(med => (
                                <div key={med.id} className={`flex justify-between items-center p-2 rounded-lg border transition group ${deletingId === med.id ? 'border-red-500/50 bg-red-900/10' : med.isActive === false ? 'border-slate-800 bg-slate-900/30 opacity-60' : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'}`}>
                                    {editingId === med.id ? (
                                    <div className="flex-1 flex gap-2 flex-wrap">
                                        <input value={editMedName} onChange={(e) => setEditMedName(e.target.value)} className="flex-[2] min-w-[120px] bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none" placeholder="Pavadinimas" />
                                        <input value={editMedDose} onChange={(e) => setEditMedDose(e.target.value)} className="flex-1 min-w-[80px] bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none" placeholder="Dozė" />
                                        <input value={editMedCategory} onChange={(e) => setEditMedCategory(e.target.value)} list="category-suggestions" className="flex-1 min-w-[100px] bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none" placeholder="Kategorija" />
                                        <select value={editMedRoute} onChange={(e) => setEditMedRoute(e.target.value)} className="w-20 bg-slate-950 border border-blue-500 rounded px-1 py-1 text-sm outline-none"><option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option><option value="SC">SC</option><option value="Inhal">Inhal</option><option value="Nebul">Nebul</option><option value="Topical">Top</option><option value="PR">PR</option></select>
                                        <button type="button" onClick={() => saveEdit(med.id)} className="text-green-500 p-1 hover:bg-slate-700 rounded"><Check size={16}/></button>
                                        <button type="button" onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={16}/></button>
                                    </div>
                                    ) : deletingId === med.id ? (
                                    <div className="flex-1 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                        <span className="text-red-200 font-medium text-sm flex items-center gap-2"><AlertTriangle size={14}/> Ištrinti?</span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => executeDelete(med.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-lg shadow-red-900/20">TAIP</button>
                                            <button type="button" onClick={cancelDelete} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded">NE</button>
                                        </div>
                                    </div>
                                    ) : (
                                    <>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium flex items-center gap-2 ${med.isActive === false ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{med.name} {med.isActive === false && <span className="text-[10px] no-underline bg-slate-800 px-1 rounded border border-slate-700">Neaktyvus</span>}</span>
                                            <span className="text-slate-500 text-xs">{med.dose} {med.route}</span>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); toggleMedActive(med.id); }} className={`transition p-1.5 rounded ${med.isActive === false ? 'text-slate-500 hover:text-green-400 bg-slate-900/50 hover:bg-green-900/20' : 'text-green-500 hover:text-slate-400 bg-green-900/10 hover:bg-slate-900/50'}`}>{med.isActive === false ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); startEditing(med); }} className="text-slate-400 hover:text-blue-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"><Edit2 size={14} /></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); initDelete(med.id); }} className="text-slate-500 hover:text-red-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              );
            })}
             {filteredMeds.length === 0 && <p className="text-slate-500 italic text-sm text-center py-2">Nerasta vaistų.</p>}
          </div>
      </div>
      )}

      {/* --- TAB: STRUCTURE --- */}
      {isAdmin && activeTab === 'structure' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm min-h-[500px] flex gap-6">
            {/* Sections Panel (Left) */}
            <div className="w-1/3 border-r border-slate-800 pr-6 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><LayoutTemplate size={20} className="text-purple-500"/> Zonos (Postai)</h3>
                
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {sections.map(section => (
                        <div key={section} className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center group ${selectedStructureSection === section ? 'bg-purple-900/20 border-purple-500/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`} onClick={() => setSelectedStructureSection(section)}>
                            {editingSectionName === section ? (
                                <div className="flex gap-1 w-full" onClick={e => e.stopPropagation()}>
                                    <input value={tempSectionName} onChange={e => setTempSectionName(e.target.value)} className="w-full bg-slate-950 border border-blue-500 rounded px-1 text-xs outline-none text-white" autoFocus onKeyDown={e => e.key === 'Enter' && handleRenameSection()}/>
                                    <button onClick={handleRenameSection} className="text-green-500 hover:text-green-400"><Check size={14}/></button>
                                    <button onClick={() => setEditingSectionName(null)} className="text-red-500 hover:text-red-400"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium truncate">{section}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingSectionName(section); setTempSectionName(section); }} className="p-1 hover:text-blue-400"><Edit2 size={12}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section); }} className="p-1 hover:text-red-400"><Trash2 size={12}/></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex gap-2">
                        <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Naujas postas" className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-purple-500 text-slate-200" />
                        <button onClick={handleAddSection} disabled={!newSectionName.trim()} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition disabled:opacity-50"><Plus size={16}/></button>
                    </div>
                </div>
            </div>

            {/* Beds Panel (Right) */}
            <div className="flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2"><Square size={20} className="text-blue-500"/> Lovos: {selectedStructureSection || 'Pasirinkite zoną'}</h3>
                
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
                                                    <button onClick={() => handleRenameBed(bed.id)} className="text-green-500 bg-green-900/20 p-1 rounded"><Check size={12}/></button>
                                                    <button onClick={() => setEditingBedId(null)} className="text-red-500 bg-red-900/20 p-1 rounded"><X size={12}/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-lg font-bold text-slate-200">{bed.label}</span>
                                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-slate-800/80 p-1 rounded">
                                                    <button onClick={() => { setEditingBedId(bed.id); setEditBedLabel(bed.label); }} className="text-slate-400 hover:text-blue-400"><Edit2 size={12}/></button>
                                                    <button onClick={() => handleDeleteBed(bed.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={12}/></button>
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
                            <button onClick={handleAddBed} disabled={!newBedLabel.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 flex items-center gap-2"><Plus size={16}/> Pridėti Lovą</button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                        Pasirinkite zoną kairėje, kad matytumėte lovas.
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- TAB: PROTOCOLS --- */}
      {isAdmin && activeTab === 'protocols' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col">
            <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4"><BookOpen size={20} className="text-emerald-500"/> Gydymo Protokolai</h3>
            
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
                                            <button onClick={() => setEditingProtocolId(editingProtocolId === proto.id ? null : proto.id)} className={`p-1.5 rounded transition ${editingProtocolId === proto.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><Edit2 size={16}/></button>
                                            <button onClick={() => initDeleteProtocol(proto.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"><Trash2 size={16}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-3 space-y-2">
                                {/* Meds List */}
                                {proto.meds.map((med, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <Pill size={14} className="text-blue-400"/>
                                            <span className="text-slate-300">{med.name}</span>
                                            <span className="text-slate-500 text-xs">{med.dose} {med.route}</span>
                                        </div>
                                        {editingProtocolId === proto.id && <button onClick={() => removeItemFromProtocol(proto.id, 'MED', idx)} className="text-slate-600 hover:text-red-400"><X size={14}/></button>}
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
                                        {editingProtocolId === proto.id && <button onClick={() => removeItemFromProtocol(proto.id, 'ACTION', idx)} className="text-slate-600 hover:text-red-400"><X size={14}/></button>}
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
                                            <input value={newProtoMedName} onChange={e => setNewProtoMedName(e.target.value)} placeholder="Vaistas" className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none"/>
                                            <div className="flex gap-2">
                                                <input value={newProtoMedDose} onChange={e => setNewProtoMedDose(e.target.value)} placeholder="Dozė" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none"/>
                                                <select value={newProtoMedRoute} onChange={e => setNewProtoMedRoute(e.target.value)} className="w-20 bg-slate-950 border border-slate-700 rounded px-1 py-1 text-sm text-white outline-none">
                                                    <option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option>
                                                </select>
                                                <button onClick={() => handleAddItemToProtocol(proto.id)} className="bg-blue-600 text-white px-3 rounded"><Plus size={16}/></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <select value={newProtoActionType} onChange={e => setNewProtoActionType(e.target.value as ActionType)} className="w-24 bg-slate-950 border border-slate-700 rounded px-1 py-1 text-sm text-white outline-none">
                                                <option value="LABS">Tyrimai</option><option value="XRAY">Rentgenas</option><option value="CT">KT</option><option value="EKG">EKG</option>
                                            </select>
                                            <input value={newProtoActionName} onChange={e => setNewProtoActionName(e.target.value)} placeholder="Pavadinimas" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none"/>
                                            <button onClick={() => handleAddItemToProtocol(proto.id)} className="bg-yellow-600 text-white px-3 rounded"><Plus size={16}/></button>
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
                        <input value={newProtocolName} onChange={e => setNewProtocolName(e.target.value)} placeholder="Protokolo pavadinimas (pvz. Insultas)" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"/>
                    </div>
                    <button onClick={handleAddProtocol} disabled={!newProtocolName.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold transition disabled:opacity-50">Sukurti</button>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB: GENERAL SETTINGS --- */}
      {activeTab === 'general' && (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
         <h3 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-800 pb-2">Bendrieji nustatymai</h3>
         
         <div className="space-y-6">
            
            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Clock size={14}/> Pacientų buvimo laiko limitas (Alert)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={appSettings.overdueMinutes} 
                                onChange={e => setAppSettings({...appSettings, overdueMinutes: parseInt(e.target.value) || 240})} 
                                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white w-24 text-center font-bold outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-400 text-sm">minučių ({Math.floor(appSettings.overdueMinutes/60)} val.)</span>
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
                            {isSyncConfigured && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded ml-2 flex items-center gap-1"><CheckCircle size={10}/> Aktyvuota</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            <div><label className="block text-xs font-medium text-slate-500 uppercase mb-1">Project URL</label><input type="text" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-mono"/></div>
                            <div><label className="block text-xs font-medium text-slate-500 uppercase mb-1">Anon / Public Key</label><input type="password" value={sbKey} onChange={(e) => setSbKey(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-mono"/></div>
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
                    if(window.confirm('DĖMESIO: Ar tikrai norite atstatyti visus nustatymus ir pacientų duomenis į pradinius? Visi pakeitimai bus prarasti.')) {
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
      )}
    </div>
  );
};

export default SettingsView;
