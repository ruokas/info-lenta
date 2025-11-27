
import React, { useState, useMemo } from 'react';
import { Staff, UserProfile, MedicationItem } from '../types';
import { Trash2, Plus, User, Stethoscope, RefreshCw, RotateCcw, Database, Save, CheckCircle, Edit2, X, Check, AlertTriangle, Pill, Search, Eye, EyeOff, FolderOpen, ChevronDown, ChevronRight, Layers, Filter } from 'lucide-react';
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
}

const SettingsView: React.FC<SettingsViewProps> = ({
  doctors, setDoctors,
  nurses, setNurses,
  medicationBank, setMedications,
  autoRefresh, setAutoRefresh,
  onResetData,
  currentUser
}) => {
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newNurseName, setNewNurseName] = useState('');
  
  // Med Bank State
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('IV');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // NEW: Category filter state
  const [showInactiveMeds, setShowInactiveMeds] = useState(false);
  
  // Med Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMedName, setEditMedName] = useState('');
  const [editMedDose, setEditMedDose] = useState('');
  const [editMedRoute, setEditMedRoute] = useState('');
  const [editMedCategory, setEditMedCategory] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Supabase Config State
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('sb_key') || '');
  const isSyncConfigured = isSupabaseConfigured();

  // Collapsible Categories State
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const isAdmin = currentUser.role === 'Admin';

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) return;
    
    const newDoc: Staff = {
      id: `d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newDoctorName.trim(),
      role: 'Doctor'
    };
    
    setDoctors([...doctors, newDoc]);
    setNewDoctorName('');
  };

  const handleAddNurse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNurseName.trim()) return;
    
    const newNurse: Staff = {
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newNurseName.trim(),
      role: 'Nurse'
    };
    
    setNurses([...nurses, newNurse]);
    setNewNurseName('');
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed: MedicationItem = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newMedName.trim(),
        dose: newMedDose.trim(),
        route: newMedRoute,
        category: newMedCategory.trim() || 'Kiti',
        isActive: true
    };

    setMedications([...medicationBank, newMed]);
    setNewMedName('');
    setNewMedDose('');
    setNewMedCategory('');
  };

  const initDelete = (id: string) => {
    setEditingId(null);
    setDeletingId(id);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const executeDelete = (id: string, type: 'Doctor' | 'Nurse' | 'Med') => {
    if (type === 'Doctor') {
        setDoctors(doctors.filter(d => d.id !== id));
    } else if (type === 'Nurse') {
        setNurses(nurses.filter(n => n.id !== id));
    } else if (type === 'Med') {
        setMedications(medicationBank.filter(m => m.id !== id));
    }
    setDeletingId(null);
  };

  const toggleMedActive = (id: string) => {
    setMedications(medicationBank.map(m => {
        if (m.id === id) {
            return { ...m, isActive: m.isActive === undefined ? false : !m.isActive };
        }
        return m;
    }));
  };

  const startEditing = (item: any, type: 'Staff' | 'Med') => {
    setDeletingId(null);
    setEditingId(item.id);
    if (type === 'Staff') {
        setEditName(item.name);
    } else {
        setEditMedName(item.name);
        setEditMedDose(item.dose);
        setEditMedRoute(item.route);
        setEditMedCategory(item.category || '');
    }
  };

  const saveEdit = (id: string, type: 'Doctor' | 'Nurse' | 'Med') => {
    if (type === 'Doctor') {
        if (!editName.trim()) return;
        setDoctors(doctors.map(d => d.id === id ? { ...d, name: editName.trim() } : d));
    } else if (type === 'Nurse') {
        if (!editName.trim()) return;
        setNurses(nurses.map(n => n.id === id ? { ...n, name: editName.trim() } : n));
    } else if (type === 'Med') {
        if (!editMedName.trim()) return;
        setMedications(medicationBank.map(m => m.id === id ? { ...m, name: editMedName.trim(), dose: editMedDose.trim(), route: editMedRoute, category: editMedCategory.trim() || 'Kiti' } : m));
    }
    setEditingId(null);
  };

  const handleSaveSupabase = () => {
    if (sbUrl && sbKey) {
      updateSupabaseConfig(sbUrl, sbKey);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Derive unique categories from existing meds for suggestions and filter
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    medicationBank.forEach(m => {
        if (m.category) cats.add(m.category);
    });
    // Add default common categories if not present
    ['Antibiotikai', 'Nuskausminamieji', 'Kardiologiniai', 'Reanimaciniai', 'Virškinimo traktui', 'Neurologiniai'].forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [medicationBank]);

  // Filter Meds
  const filteredMeds = useMemo(() => {
    return medicationBank.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(medSearch.toLowerCase());
        const matchesActive = showInactiveMeds ? true : (m.isActive !== false);
        const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
        return matchesSearch && matchesActive && matchesCategory;
    });
  }, [medicationBank, medSearch, showInactiveMeds, selectedCategory]);

  // Group Meds
  const groupedMeds = useMemo(() => {
    const groups: Record<string, MedicationItem[]> = {};
    filteredMeds.forEach(m => {
        const cat = m.category || 'Kiti';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(m);
    });
    
    // Sort meds within groups
    Object.keys(groups).forEach(key => {
        groups[key].sort((a,b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredMeds]);

  // Sort Categories alphabetically, putting 'Kiti' last
  const sortedCategories = Object.keys(groupedMeds).sort((a,b) => {
      if (a === 'Kiti') return 1;
      if (b === 'Kiti') return -1;
      return a.localeCompare(b);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
        <div className="bg-slate-800 p-2 rounded-lg"><RotateCcw size={24} className="text-slate-400" /></div>
        Nustatymai
      </h2>

      {!isAdmin && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
           <Database size={20} className="text-red-500" />
           <p>Personalo sąrašus ir vaistų banką redaguoti gali tik <strong>Administratorius</strong>.</p>
        </div>
      )}

      {/* Cloud Sync Section */}
      {isAdmin && (
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
          Įveskite savo Supabase projekto duomenis, kad įgalintumėte realaus laiko duomenų sinchronizaciją tarp kelių įrenginių.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Project URL</label>
            <input 
              type="text" 
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Anon / Public Key</label>
            <input 
              type="password" 
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-3 relative z-10">
           <button 
             type="button"
             onClick={handleSaveSupabase}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm shadow-lg shadow-blue-900/20"
           >
             <Save size={16} /> Išsaugoti ir prisijungti
           </button>
           {isSyncConfigured && (
             <button 
              type="button"
              onClick={clearSupabaseConfig}
              className="px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg font-medium transition text-sm"
             >
               Atsijungti
             </button>
           )}
        </div>
      </div>
      )}

      {/* Medication Bank Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
         <div className="flex flex-col md:flex-row items-center justify-between mb-4 border-b border-slate-800 pb-2 gap-4">
            <div className="flex items-center gap-2 text-slate-100 text-lg font-semibold shrink-0">
                <Pill className="text-yellow-500" size={20} />
                <h3>Vaistų bankas</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative hidden md:block w-40">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-3 pr-8 py-1 text-xs outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="ALL">Visos kategorijos</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Filter size={14} className="absolute right-2 top-1.5 text-slate-500 pointer-events-none" />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200 shrink-0">
                    <input 
                        type="checkbox" 
                        checked={showInactiveMeds} 
                        onChange={(e) => setShowInactiveMeds(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800"
                    />
                    Rodyti neaktyvius
                </label>
                <div className="relative flex-1 md:flex-none">
                    <Search size={14} className="absolute left-2 top-1.5 text-slate-500" />
                    <input 
                    type="text"
                    placeholder="Ieškoti vaistų..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-200 w-full md:w-48 outline-none focus:border-blue-500"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    />
                </div>
            </div>
            {/* Mobile Category Select */}
            <div className="relative md:hidden w-full">
               <select 
                 value={selectedCategory}
                 onChange={(e) => setSelectedCategory(e.target.value)}
                 className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm outline-none focus:border-blue-500 appearance-none cursor-pointer"
               >
                 <option value="ALL">Visos kategorijos</option>
                 {existingCategories.map(cat => (
                   <option key={cat} value={cat}>{cat}</option>
                 ))}
               </select>
               <Filter size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
         </div>

         {isAdmin && (
            <div className="flex flex-col md:flex-row gap-2 mb-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800 items-end">
                <div className="flex-[2] w-full">
                    <label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Vaisto pavadinimas</label>
                    <input
                        type="text"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        placeholder="pvz. Paracetamolis"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Numatyta dozė</label>
                    <input
                        type="text"
                        value={newMedDose}
                        onChange={(e) => setNewMedDose(e.target.value)}
                        placeholder="pvz. 1000mg"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="w-full md:w-32">
                     <label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Kategorija</label>
                     <input
                        type="text"
                        list="category-suggestions"
                        value={newMedCategory}
                        onChange={(e) => setNewMedCategory(e.target.value)}
                        placeholder="Kiti"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                     <datalist id="category-suggestions">
                        {existingCategories.map(cat => <option key={cat} value={cat} />)}
                     </datalist>
                </div>
                <div className="w-full md:w-24">
                    <label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Būdas</label>
                    <select
                    value={newMedRoute}
                    onChange={(e) => setNewMedRoute(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-2 text-sm outline-none"
                    >
                        <option value="IV">IV</option>
                        <option value="PO">PO</option>
                        <option value="IM">IM</option>
                        <option value="SC">SC</option>
                        <option value="Inhal">Inhal</option>
                        <option value="Nebul">Nebul</option>
                        <option value="Topical">Top</option>
                        <option value="PR">PR</option>
                    </select>
                </div>
                <div>
                     <button 
                        type="button"
                        onClick={(e) => handleAddMedication(e)}
                        disabled={!newMedName.trim()}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 w-full md:w-auto flex justify-center"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {sortedCategories.map(category => {
                // Auto-expand if searching or if category selected, otherwise use state
                const isExpanded = expandedCategories.includes(category) || medSearch.trim() !== '' || selectedCategory !== 'ALL';
                
                return (
                <div key={category} className="border border-slate-800 rounded-lg overflow-hidden">
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 transition text-left"
                    >
                        <div className="flex items-center gap-2 font-semibold text-slate-300">
                             {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                             <Layers size={16} className="text-slate-500"/>
                             {category}
                             <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-0.5 rounded-full">
                                {groupedMeds[category].length}
                             </span>
                        </div>
                    </button>

                    {/* Expandable Content */}
                    {isExpanded && (
                        <div className="bg-slate-900/50 p-2 space-y-1">
                            {groupedMeds[category].map(med => (
                                <div key={med.id} className={`flex justify-between items-center p-2 rounded-lg border transition group ${deletingId === med.id ? 'border-red-500/50 bg-red-900/10' : med.isActive === false ? 'border-slate-800 bg-slate-900/30 opacity-60' : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'}`}>
                                    {editingId === med.id ? (
                                    <div className="flex-1 flex gap-2 flex-wrap">
                                        <input 
                                            value={editMedName}
                                            onChange={(e) => setEditMedName(e.target.value)}
                                            className="flex-[2] min-w-[120px] bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                                            placeholder="Pavadinimas"
                                        />
                                        <input 
                                            value={editMedDose}
                                            onChange={(e) => setEditMedDose(e.target.value)}
                                            className="flex-1 min-w-[80px] bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                                            placeholder="Dozė"
                                        />
                                        <input
                                            value={editMedCategory}
                                            onChange={(e) => setEditMedCategory(e.target.value)}
                                            list="category-suggestions"
                                            className="flex-1 min-w-[100px] bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                                            placeholder="Kategorija"
                                        />
                                        <select
                                            value={editMedRoute}
                                            onChange={(e) => setEditMedRoute(e.target.value)}
                                            className="w-20 bg-slate-950 border border-blue-500 rounded px-1 py-1 text-sm outline-none"
                                        >
                                            <option value="IV">IV</option>
                                            <option value="PO">PO</option>
                                            <option value="IM">IM</option>
                                            <option value="SC">SC</option>
                                            <option value="Inhal">Inhal</option>
                                            <option value="Nebul">Nebul</option>
                                            <option value="Topical">Top</option>
                                            <option value="PR">PR</option>
                                        </select>
                                        <button type="button" onClick={() => saveEdit(med.id, 'Med')} className="text-green-500 p-1 hover:bg-slate-700 rounded"><Check size={16}/></button>
                                        <button type="button" onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={16}/></button>
                                    </div>
                                    ) : deletingId === med.id ? (
                                    <div className="flex-1 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                        <span className="text-red-200 font-medium text-sm flex items-center gap-2"><AlertTriangle size={14}/> Ištrinti?</span>
                                        <div className="flex gap-2">
                                            <button 
                                            type="button"
                                            onClick={() => executeDelete(med.id, 'Med')}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-lg shadow-red-900/20"
                                            >
                                            TAIP
                                            </button>
                                            <button 
                                            type="button"
                                            onClick={cancelDelete}
                                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded"
                                            >
                                            NE
                                            </button>
                                        </div>
                                    </div>
                                    ) : (
                                    <>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium flex items-center gap-2 ${med.isActive === false ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                {med.name}
                                                {med.isActive === false && <span className="text-[10px] no-underline bg-slate-800 px-1 rounded border border-slate-700">Neaktyvus</span>}
                                            </span>
                                            <span className="text-slate-500 text-xs">{med.dose} {med.route}</span>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleMedActive(med.id); }}
                                                    className={`transition p-1.5 rounded ${med.isActive === false ? 'text-slate-500 hover:text-green-400 bg-slate-900/50 hover:bg-green-900/20' : 'text-green-500 hover:text-slate-400 bg-green-900/10 hover:bg-slate-900/50'}`}
                                                    title={med.isActive === false ? "Aktyvuoti" : "Deaktyvuoti (Paslėpti)"}
                                                >
                                                    {med.isActive === false ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); startEditing(med, 'Med'); }}
                                                    className="text-slate-400 hover:text-blue-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"
                                                    title="Redaguoti"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); initDelete(med.id); }}
                                                    className="text-slate-500 hover:text-red-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"
                                                    title="Ištrinti"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Doctors Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-100 text-lg font-semibold border-b border-slate-800 pb-2">
            <Stethoscope className="text-blue-500" size={20} />
            <h3>Gydytojų sąrašas</h3>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2 mb-4">
                <input
                type="text"
                value={newDoctorName}
                onChange={(e) => setNewDoctorName(e.target.value)}
                placeholder="Gyd. Vardas Pavardė"
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                type="button"
                onClick={(e) => handleAddDoctor(e)}
                disabled={!newDoctorName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <Plus size={20} />
                </button>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {doctors.map(doc => (
              <div key={doc.id} className={`flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border transition group ${deletingId === doc.id ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700/50 hover:bg-slate-800'}`}>
                {editingId === doc.id ? (
                   <div className="flex-1 flex gap-2">
                      <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                        autoFocus
                      />
                      <button type="button" onClick={() => saveEdit(doc.id, 'Doctor')} className="text-green-500 p-1 hover:bg-slate-700 rounded"><Check size={16}/></button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={16}/></button>
                   </div>
                ) : deletingId === doc.id ? (
                   <div className="flex-1 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <span className="text-red-200 font-medium text-sm flex items-center gap-2"><AlertTriangle size={14}/> Ištrinti?</span>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => executeDelete(doc.id, 'Doctor')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-lg shadow-red-900/20"
                        >
                          TAIP
                        </button>
                        <button 
                          type="button"
                          onClick={cancelDelete}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded"
                        >
                          NE
                        </button>
                      </div>
                   </div>
                ) : (
                   <>
                    <span className="text-slate-300">{doc.name}</span>
                    {isAdmin && (
                        <div className="flex gap-1">
                            <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startEditing(doc, 'Staff'); }}
                            className="text-slate-400 hover:text-blue-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"
                            title="Redaguoti"
                            >
                            <Edit2 size={14} />
                            </button>
                            <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); initDelete(doc.id); }}
                            className="text-slate-500 hover:text-red-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"
                            title="Ištrinti"
                            >
                            <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                   </>
                )}
              </div>
            ))}
            {doctors.length === 0 && <p className="text-slate-500 italic text-sm text-center py-2">Sąrašas tuščias</p>}
          </div>
        </div>

        {/* Nurses Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-100 text-lg font-semibold border-b border-slate-800 pb-2">
            <User className="text-green-500" size={20} />
            <h3>Slaugytojų sąrašas</h3>
          </div>

           {isAdmin && (
            <div className="flex gap-2 mb-4">
                <input
                type="text"
                value={newNurseName}
                onChange={(e) => setNewNurseName(e.target.value)}
                placeholder="Slaug. Vardas"
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
                <button 
                type="button"
                onClick={(e) => handleAddNurse(e)}
                disabled={!newNurseName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <Plus size={20} />
                </button>
            </div>
           )}

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {nurses.map(nurse => (
              <div key={nurse.id} className={`flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border transition group ${deletingId === nurse.id ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700/50 hover:bg-slate-800'}`}>
                {editingId === nurse.id ? (
                   <div className="flex-1 flex gap-2">
                      <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-green-500 rounded px-2 py-1 text-sm outline-none"
                        autoFocus
                      />
                      <button type="button" onClick={() => saveEdit(nurse.id, 'Nurse')} className="text-green-500 p-1 hover:bg-slate-700 rounded"><Check size={16}/></button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={16}/></button>
                   </div>
                ) : deletingId === nurse.id ? (
                   <div className="flex-1 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <span className="text-red-200 font-medium text-sm flex items-center gap-2"><AlertTriangle size={14}/> Ištrinti?</span>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => executeDelete(nurse.id, 'Nurse')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-lg shadow-red-900/20"
                        >
                          TAIP
                        </button>
                        <button 
                          type="button"
                          onClick={cancelDelete}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded"
                        >
                          NE
                        </button>
                      </div>
                   </div>
                ) : (
                   <>
                    <span className="text-slate-300">{nurse.name}</span>
                    {isAdmin && (
                        <div className="flex gap-1">
                            <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startEditing(nurse, 'Staff'); }}
                            className="text-slate-400 hover:text-blue-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"
                            title="Redaguoti"
                            >
                            <Edit2 size={14} />
                            </button>
                            <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); initDelete(nurse.id); }}
                            className="text-slate-500 hover:text-red-400 transition bg-slate-900/50 p-1.5 rounded hover:bg-slate-700"
                            title="Ištrinti"
                            >
                            <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                   </>
                )}
              </div>
            ))}
             {nurses.length === 0 && <p className="text-slate-500 italic text-sm text-center py-2">Sąrašas tuščias</p>}
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

            {isAdmin && (
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
            )}
         </div>
      </div>
    </div>
  );
};

export default SettingsView;
