
import React, { useState, useMemo } from 'react';
import { Staff, UserProfile, MedicationItem } from '../types';
import { RefreshCw, RotateCcw, Database, Save, CheckCircle, Edit2, X, Check, AlertTriangle, Pill, Search, Eye, EyeOff, ChevronDown, ChevronRight, Layers, Filter, FolderInput, FolderMinus, Trash2, Users, UserPlus, MapPin, UserX, UserCheck } from 'lucide-react';
import { isSupabaseConfigured, updateSupabaseConfig, clearSupabaseConfig } from '../lib/supabaseClient';
import { PHYSICAL_SECTIONS } from '../constants';

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
  
  // Med Bank State
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('IV');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // Category filter state
  const [showInactiveMeds, setShowInactiveMeds] = useState(false);
  
  // Med Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMedName, setEditMedName] = useState('');
  const [editMedDose, setEditMedDose] = useState('');
  const [editMedRoute, setEditMedRoute] = useState('');
  const [editMedCategory, setEditMedCategory] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Category Management State
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');
  
  // Staff Management State
  const [activeStaffTab, setActiveStaffTab] = useState<'doctors' | 'nurses'>('doctors');
  const [newStaffName, setNewStaffName] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  // Supabase Config State
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('sb_key') || '');
  const isSyncConfigured = isSupabaseConfigured();

  // Collapsible Categories State
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const isAdmin = currentUser.role === 'Admin';

  // --- Staff Management Logic ---
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newStaff: Staff = {
        id: `${activeStaffTab === 'doctors' ? 'd' : 'n'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: newStaffName.trim(),
        role: activeStaffTab === 'doctors' ? 'Doctor' : 'Nurse',
        isActive: false, // Default to inactive in shift
        isDisabled: false // Default to enabled in bank
    };

    if (activeStaffTab === 'doctors') {
        setDoctors([...doctors, newStaff]);
    } else {
        setNurses([...nurses, newStaff]);
    }
    setNewStaffName('');
  };

  const startEditingStaff = (staff: Staff) => {
      setDeletingStaffId(null);
      setEditingStaffId(staff.id);
      setEditStaffName(staff.name);
  };

  const saveEditStaff = () => {
      if (!editStaffName.trim()) return;
      
      if (activeStaffTab === 'doctors') {
          setDoctors(doctors.map(d => d.id === editingStaffId ? { ...d, name: editStaffName.trim() } : d));
      } else {
          setNurses(nurses.map(n => n.id === editingStaffId ? { ...n, name: editStaffName.trim() } : n));
      }
      setEditingStaffId(null);
  };

  const toggleStaffDisabled = (staff: Staff) => {
      const updatedStaff = { ...staff, isDisabled: !staff.isDisabled };
      if (activeStaffTab === 'doctors') {
          setDoctors(doctors.map(d => d.id === staff.id ? updatedStaff : d));
      } else {
          setNurses(nurses.map(n => n.id === staff.id ? updatedStaff : n));
      }
  };

  const executeDeleteStaff = (id: string) => {
      if (activeStaffTab === 'doctors') {
          setDoctors(doctors.filter(d => d.id !== id));
      } else {
          setNurses(nurses.filter(n => n.id !== id));
      }
      setDeletingStaffId(null);
  };

  // --- Medication Logic ---

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

  const executeDelete = (id: string) => {
    setMedications(medicationBank.filter(m => m.id !== id));
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

  const startEditing = (item: any) => {
    setDeletingId(null);
    setEditingId(item.id);
    setEditMedName(item.name);
    setEditMedDose(item.dose);
    setEditMedRoute(item.route);
    setEditMedCategory(item.category || '');
  };

  const saveEdit = (id: string) => {
    if (!editMedName.trim()) return;
    setMedications(medicationBank.map(m => m.id === id ? { ...m, name: editMedName.trim(), dose: editMedDose.trim(), route: editMedRoute, category: editMedCategory.trim() || 'Kiti' } : m));
    setEditingId(null);
  };

  // --- Category Management Logic ---
  
  const startEditingCategory = (categoryName: string) => {
    setEditingCategoryName(categoryName);
    setTempCategoryName(categoryName);
  };

  const saveCategoryRename = () => {
    if (!editingCategoryName || !tempCategoryName.trim()) return;
    
    const oldName = editingCategoryName;
    const newName = tempCategoryName.trim();

    if (oldName === newName) {
      setEditingCategoryName(null);
      return;
    }

    // Bulk update all medications in this category
    const updatedMeds = medicationBank.map(med => {
      if (med.category === oldName) {
        return { ...med, category: newName };
      }
      return med;
    });

    setMedications(updatedMeds);
    setEditingCategoryName(null);
    setTempCategoryName('');
  };

  const deleteCategory = (categoryName: string) => {
    if (!window.confirm(`Ar tikrai norite panaikinti kategoriją "${categoryName}"? Visi šios kategorijos vaistai bus perkelti į "Kiti".`)) return;

    // Bulk update: move items to 'Kiti'
    const updatedMeds = medicationBank.map(med => {
      if (med.category === categoryName) {
        return { ...med, category: 'Kiti' };
      }
      return med;
    });

    setMedications(updatedMeds);
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

      {/* Staff Bank Management */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
           <div className="flex flex-col md:flex-row items-center justify-between mb-6 border-b border-slate-800 pb-4 gap-4">
              <div className="flex items-center gap-2 text-slate-100 text-lg font-semibold shrink-0">
                  <Users className="text-emerald-500" size={20} />
                  <h3>Personalo Bankas (Registras)</h3>
              </div>
              
              <div className="flex bg-slate-800 p-1 rounded-lg">
                 <button
                   onClick={() => setActiveStaffTab('doctors')}
                   className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeStaffTab === 'doctors' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   Gydytojai
                 </button>
                 <button
                   onClick={() => setActiveStaffTab('nurses')}
                   className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeStaffTab === 'nurses' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   Slaugytojos
                 </button>
              </div>
           </div>

           <div className="space-y-4">
              {/* Add New Staff Form */}
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex gap-3 items-end">
                 <div className="flex-1">
                    <label className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Vardas Pavardė</label>
                    <input 
                      type="text" 
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Įveskite vardą..."
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                 </div>
                 <button 
                   onClick={handleAddStaff}
                   disabled={!newStaffName.trim()}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                 >
                   <UserPlus size={16} /> Pridėti
                 </button>
              </div>

              {/* Staff List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                 {(activeStaffTab === 'doctors' ? doctors : nurses).map(staff => (
                    <div key={staff.id} className={`bg-slate-800 border rounded-lg p-3 flex items-center justify-between group transition ${staff.isDisabled ? 'border-red-900/30 opacity-60' : 'border-slate-700 hover:border-slate-600'}`}>
                       {editingStaffId === staff.id ? (
                          <div className="flex-1 flex gap-2">
                             <input 
                               value={editStaffName}
                               onChange={(e) => setEditStaffName(e.target.value)}
                               className="flex-1 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                               autoFocus
                             />
                             <button onClick={saveEditStaff} className="p-1 bg-green-900/30 text-green-500 rounded hover:bg-green-700 hover:text-white"><Check size={14}/></button>
                             <button onClick={() => setEditingStaffId(null)} className="p-1 bg-red-900/30 text-red-500 rounded hover:bg-red-700 hover:text-white"><X size={14}/></button>
                          </div>
                       ) : deletingStaffId === staff.id ? (
                          <div className="flex-1 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                             <span className="text-red-400 text-xs font-bold">Ištrinti visam laikui?</span>
                             <div className="flex gap-2">
                                <button onClick={() => executeDeleteStaff(staff.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">TAIP</button>
                                <button onClick={() => setDeletingStaffId(null)} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">NE</button>
                             </div>
                          </div>
                       ) : (
                          <>
                             <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${staff.isDisabled ? 'bg-slate-700 text-slate-500' : activeStaffTab === 'doctors' ? 'bg-blue-900/50 text-blue-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                                   {staff.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="truncate">
                                   <div className={`font-medium truncate text-sm flex items-center gap-2 ${staff.isDisabled ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                      {staff.name}
                                      {staff.isDisabled && <span className="no-underline text-[10px] bg-red-900/20 text-red-400 px-1.5 rounded border border-red-900/30">Atostogos</span>}
                                   </div>
                                </div>
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button 
                                    onClick={() => toggleStaffDisabled(staff)} 
                                    className={`p-1.5 rounded hover:bg-slate-700 ${staff.isDisabled ? 'text-green-500 hover:text-green-400' : 'text-slate-500 hover:text-amber-400'}`}
                                    title={staff.isDisabled ? "Aktyvuoti (Grįžo į darbą)" : "Laikinai išjungti (Atostogos/Biuletenis)"}
                                >
                                    {staff.isDisabled ? <UserCheck size={14}/> : <UserX size={14}/>}
                                </button>
                                <button onClick={() => startEditingStaff(staff)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded"><Edit2 size={14}/></button>
                                <button onClick={() => setDeletingStaffId(staff.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded"><Trash2 size={14}/></button>
                             </div>
                          </>
                       )}
                    </div>
                 ))}
              </div>
           </div>
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
                        <CheckCircle size={20} />
                    </button>
                </div>
            </div>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {sortedCategories.map(category => {
                // Auto-expand if searching or if category selected, otherwise use state
                const isExpanded = expandedCategories.includes(category) || medSearch.trim() !== '' || selectedCategory !== 'ALL';
                const isEditingCategory = editingCategoryName === category;
                
                return (
                <div key={category} className="border border-slate-800 rounded-lg overflow-hidden">
                    <div 
                        className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 transition"
                    >
                        {isEditingCategory ? (
                          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                             <FolderInput size={18} className="text-blue-500" />
                             <input 
                               value={tempCategoryName}
                               onChange={(e) => setTempCategoryName(e.target.value)}
                               className="bg-slate-900 border border-blue-500 rounded px-2 py-1 text-sm outline-none text-white w-48"
                               autoFocus
                               placeholder="Naujas pavadinimas"
                             />
                             <button onClick={saveCategoryRename} className="p-1 bg-green-600/20 text-green-500 rounded hover:bg-green-600 hover:text-white"><Check size={14}/></button>
                             <button onClick={() => setEditingCategoryName(null)} className="p-1 bg-red-600/20 text-red-500 rounded hover:bg-red-600 hover:text-white"><X size={14}/></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => toggleCategory(category)}
                            className="flex-1 flex items-center gap-2 font-semibold text-slate-300 text-left"
                          >
                             {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                             <Layers size={16} className="text-slate-500"/>
                             {category}
                             <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-0.5 rounded-full">
                                {groupedMeds[category].length}
                             </span>
                          </button>
                        )}

                        {/* Category Actions (Admin Only) */}
                        {isAdmin && !isEditingCategory && category !== 'Kiti' && (
                           <div className="flex items-center gap-1 ml-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); startEditingCategory(category); }}
                                className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded transition"
                                title="Pervadinti kategoriją"
                              >
                                <FolderInput size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteCategory(category); }}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition"
                                title="Ištrinti kategoriją (Vaistai bus perkelti į 'Kiti')"
                              >
                                <FolderMinus size={14} />
                              </button>
                           </div>
                        )}
                    </div>

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
                                        <button type="button" onClick={() => saveEdit(med.id)} className="text-green-500 p-1 hover:bg-slate-700 rounded"><Check size={16}/></button>
                                        <button type="button" onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={16}/></button>
                                    </div>
                                    ) : deletingId === med.id ? (
                                    <div className="flex-1 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                        <span className="text-red-200 font-medium text-sm flex items-center gap-2"><AlertTriangle size={14}/> Ištrinti?</span>
                                        <div className="flex gap-2">
                                            <button 
                                            type="button"
                                            onClick={() => executeDelete(med.id)}
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
                                                    onClick={(e) => { e.stopPropagation(); startEditing(med); }}
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
