
import React, { useState, useEffect, useMemo } from 'react';
import { Bed, PatientStatus, TriageCategory, Staff, UserProfile, MedicationOrder, MedicationStatus, ClinicalAction, ActionType, MedicationItem } from '../types';
import { MEDICATION_PROTOCOLS } from '../constants';
import { X, User, Activity, Stethoscope, AlertCircle, FileText, UserPlus, Trash2, AlertTriangle, Pill, Plus, CheckCircle, XCircle, Package, ClipboardList, RotateCcw, Microscope, FileImage, Clock, Waves, HeartPulse } from 'lucide-react';

interface EditPatientModalProps {
  bed: Bed;
  doctors: Staff[];
  currentUser: UserProfile; 
  medicationBank: MedicationItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBed: Bed) => void;
}

// Common abbreviations and brand names mapping to active ingredients
const DRUG_SYNONYMS: Record<string, string[]> = {
  'Sodium chloride': ['NaCl', 'Natris', 'Fiziologinis', 'Fizikas'],
  'Kalii chloridum': ['K', 'KCL', 'Kalis'],
  'Magnesium sulfatum': ['Mg', 'Magnis', 'MgSO4'],
  'Adrenalinum': ['Epinefrinas', 'Adr'],
  'Norepinefrinum': ['Noradrenalinas', 'Nor'],
  'Paracetamolum': ['PCM', 'Acetaminophen', 'Perfalgan'],
  'Acidum acetylsalicylicum': ['Aspirinas', 'Asp'],
  'Dexamethasonum': ['Dexa'],
  'Furosemidum': ['Laziksas', 'Lasix', 'Furo'],
  'Metoclopramidum': ['Cerucal', 'Cerukalis', 'Metro'],
  'Diclofenacum': ['Diclac', 'Olfen', 'Diclo'],
  'Ibuprofenum': ['Ibuprom', 'Ibumetin'],
  'Ketorolaci tromethaminum': ['Ketanov', 'Ketolgan', 'Keto'],
  'Diazepamum': ['Relanium', 'Diazepamas'],
  'Clemastinum': ['Tavegyl'],
  'Salbutamolum': ['Ventolin'],
  'Amiodaronum': ['Cordarone'],
  'Heparinum': ['Heparinas'],
  'Mannitol Fresenius': ['Manitolis'],
  'Glucose': ['Gliukozė'],
  'Aktyvioji anglis': ['Angliukas', 'Carbo'],
  'Hydrogenii peroxidi 3%': ['Peroksidas'],
  'Glyceroli trinitras': ['Nitras', 'NTG', 'Nitroglicerinas'],
  'Amoxicillinum/Acidum Clavulanicum': ['Amoksik', 'Augmentin'],
  'Ciprofloxacinum': ['Cipro'],
  'Pantoprazolum': ['Panto', 'Nolpaza'],
  'Omeprazolum': ['Ome'],
  'Tramadolum': ['Tramakas', 'Tramal'],
  'Morphinum': ['Morfinas'],
  'Fentanylum': ['Fentanilis'],
  'Midazolamum': ['Dormicum'],
  'Propofolum': ['Propofolis'],
  'Metronidazolum': ['Metro', 'Metris'],
  'Drotaverinum': ['No-spa', 'Nospa'],
  'Captoprilum': ['Kaptoprilis'],
  'Bisoprololum': ['Biso'],
};

const EditPatientModal: React.FC<EditPatientModalProps> = ({ bed, doctors, currentUser, medicationBank, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Bed>(bed);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'actions' | 'meds'>('info');

  // Medication Form State
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('IV');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [medActionConfirm, setMedActionConfirm] = useState<{ id: string, status: MedicationStatus, name: string } | null>(null);
  
  // Medication Reminder State
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderHours, setReminderHours] = useState(1); // Default 1 hour for quick repeat

  // Action Form State
  const [newActionType, setNewActionType] = useState<ActionType>('LABS');
  const [newActionName, setNewActionName] = useState('');
  const [newActionTime, setNewActionTime] = useState('');

  // Priority list for Quick Picks
  const quickPickMeds = useMemo(() => {
    if (!medicationBank) return [];
    
    // Expanded list covering Pain, Fever, Emergency, Nausea, etc.
    const COMMON_PRIORITY = [
      'Ketorolaci tromethaminum',
      'Paracetamolum', 
      'Ibuprofenum',
      'Metoclopramidum',
      'Sodium chloride', // Fluids
      'Diazepamum', 
      'Morphinum',
      'Adrenalinum',
      'Captoprilum',
      'Furosemidum',
      'Salbutamolum',
      'Glyceroli trinitras'
    ];

    // Filter active meds that match common priority names
    const priorityMeds = medicationBank.filter(m => 
        m.isActive !== false && 
        COMMON_PRIORITY.some(p => m.name.includes(p))
    );

    priorityMeds.sort((a, b) => {
        const idxA = COMMON_PRIORITY.findIndex(p => a.name.includes(p));
        const idxB = COMMON_PRIORITY.findIndex(p => b.name.includes(p));
        // Push found items to front based on priority index
        const iA = idxA === -1 ? Infinity : idxA;
        const iB = idxB === -1 ? Infinity : idxB;
        if (iA === iB) return a.name.localeCompare(b.name);
        return iA - iB;
    });

    // Return top 20 relevant quick picks
    return priorityMeds.slice(0, 20); 
  }, [medicationBank]);

  // Filtered Suggestions with Synonym Support
  const filteredSuggestions = useMemo(() => {
    if (!newMedName) return [];
    const q = newMedName.toLowerCase();
    
    return medicationBank.filter(med => {
        if (med.isActive === false) return false;
        
        // 1. Direct Name Match
        if (med.name.toLowerCase().includes(q)) return true;
        
        // 2. Synonym/Abbreviation Match
        // Find synonyms based on the medication name
        let syns = DRUG_SYNONYMS[med.name];
        
        // If exact key match failed, try partial key match (e.g. "Sodium chloride 0.9%")
        if (!syns) {
            const key = Object.keys(DRUG_SYNONYMS).find(k => med.name.includes(k));
            if (key) syns = DRUG_SYNONYMS[key];
        }
        
        if (syns && syns.some(s => s.toLowerCase().includes(q))) return true;

        return false;
    }).slice(0, 20); // Limit to 20 results for performance
  }, [newMedName, medicationBank]);

  // Helper to get the synonym that matched the search query for display
  const getMatchedSynonym = (medName: string, query: string): string | null => {
    const q = query.toLowerCase();
    if (medName.toLowerCase().includes(q)) return null; // Matched by name, no need to show synonym
    
    let syns = DRUG_SYNONYMS[medName];
    if (!syns) {
        const key = Object.keys(DRUG_SYNONYMS).find(k => medName.includes(k));
        if (key) syns = DRUG_SYNONYMS[key];
    }
    
    const match = syns?.find(s => s.toLowerCase().includes(q));
    return match || null;
  };

  useEffect(() => {
    setFormData(bed);
    setIsDeleteConfirmOpen(false);
    setIsDiscardConfirmOpen(false);
    setMedActionConfirm(null);
    setActiveTab('info');
    setNewMedName('');
    setNewMedDose('');
    setNewActionName('');
    setEnableReminder(false);
    setReminderHours(1);
    setShowSuggestions(false);
    
    // Set default action time to now
    const now = new Date();
    setNewActionTime(now.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' }));
  }, [bed]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(bed) !== JSON.stringify(formData);
  }, [bed, formData]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Bed, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (field: string, value: any) => {
    if (!formData.patient) return;
    setFormData(prev => ({
      ...prev,
      patient: prev.patient ? { ...prev.patient, [field]: value } : undefined
    }));
  };

  const handleVitalsChange = (field: string, value: string) => {
    if (!formData.patient) return;
    const numValue = value === '' ? undefined : Number(value);
    setFormData(prev => ({
      ...prev,
      patient: {
        ...prev.patient!,
        vitals: {
          ...prev.patient!.vitals,
          [field]: numValue,
          lastUpdated: new Date().toISOString()
        }
      }
    }));
  };

  const handleAdmit = () => {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    setFormData(prev => ({
      ...prev,
      status: PatientStatus.ADMITTING,
      patient: {
        id: Date.now().toString(),
        name: '',
        symptoms: '',
        triageCategory: TriageCategory.URGENT,
        arrivalTime: timeString,
        medications: [],
        actions: [],
        vitals: { lastUpdated: new Date().toISOString() }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setIsDiscardConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClear = () => {
    const clearedBed: Bed = {
      ...formData,
      patient: undefined,
      status: PatientStatus.EMPTY,
      comment: '',
      assignedDoctorId: undefined
    };
    onSave(clearedBed);
  };

  // --- Action Logic ---
  const addAction = (type: ActionType, name: string) => {
    if (!formData.patient) return;
    
    // Construct requested timestamp from today's date + selected time
    let requestedAtStr = new Date().toISOString();
    if (newActionTime) {
      const now = new Date();
      const [hours, minutes] = newActionTime.split(':').map(Number);
      now.setHours(hours, minutes, 0, 0);
      requestedAtStr = now.toISOString();
    }

    const newAction: ClinicalAction = {
      id: `act-${Date.now()}`,
      type,
      name,
      isCompleted: false,
      requestedAt: requestedAtStr
    };
    setFormData(prev => ({
      ...prev,
      patient: {
        ...prev.patient!,
        actions: [...(prev.patient!.actions || []), newAction]
      }
    }));
    setNewActionName('');
  };

  const toggleAction = (actionId: string) => {
    if (!formData.patient?.actions) return;
    
    const updatedActions = formData.patient.actions.map(a => {
      if (a.id === actionId) {
        const isNowCompleted = !a.isCompleted;
        return { 
          ...a, 
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined
        };
      }
      return a;
    });

    setFormData(prev => ({
      ...prev,
      patient: { ...prev.patient!, actions: updatedActions }
    }));
  };

  const removeAction = (actionId: string) => {
    if (!formData.patient?.actions) return;
    setFormData(prev => ({
      ...prev,
      patient: { ...prev.patient!, actions: prev.patient!.actions!.filter(a => a.id !== actionId) }
    }));
  };

  // --- Medication Logic ---
  const calculateReminderTime = () => {
    if (!enableReminder) return undefined;
    const now = new Date();
    now.setHours(now.getHours() + reminderHours);
    return now.toISOString();
  };

  const addMedication = (name: string = newMedName, dose: string = newMedDose, route: string = newMedRoute) => {
    if (!formData.patient || !name) return;

    const newOrder: MedicationOrder = {
      id: `med-${Date.now()}-${Math.random()}`,
      name,
      dose,
      route,
      orderedBy: currentUser.id,
      orderedAt: new Date().toISOString(),
      status: MedicationStatus.PENDING,
      reminderAt: calculateReminderTime()
    };

    setFormData(prev => ({
      ...prev,
      patient: {
        ...prev.patient!,
        medications: [...(prev.patient!.medications || []), newOrder]
      }
    }));

    setNewMedName('');
    setNewMedDose('');
    setShowSuggestions(false);
  };

  const applyProtocol = (protocol: { name: string, meds: { name: string, dose: string, route: string }[] }) => {
    if (!formData.patient) return;
    
    const reminder = calculateReminderTime();

    const newOrders: MedicationOrder[] = protocol.meds.map(med => ({
      id: `med-${Date.now()}-${Math.random()}`,
      name: med.name,
      dose: med.dose,
      route: med.route,
      orderedBy: currentUser.id,
      orderedAt: new Date().toISOString(),
      status: MedicationStatus.PENDING,
      reminderAt: reminder
    }));

    setFormData(prev => ({
      ...prev,
      patient: {
        ...prev.patient!,
        medications: [...(prev.patient!.medications || []), ...newOrders]
      }
    }));
  };

  const repeatMedication = (med: MedicationOrder) => {
    addMedication(med.name, med.dose, med.route);
  };

  const updateMedicationStatus = (medId: string, status: MedicationStatus) => {
    if (!formData.patient?.medications) return;

    const updatedMeds = formData.patient.medications.map(med => {
      if (med.id === medId) {
        return {
          ...med,
          status,
          administeredBy: status === MedicationStatus.GIVEN ? currentUser.id : undefined,
          administeredAt: status === MedicationStatus.GIVEN ? new Date().toISOString() : undefined
        };
      }
      return med;
    });

    setFormData(prev => ({
      ...prev,
      patient: { ...prev.patient!, medications: updatedMeds }
    }));
  };

  const requestMedStatusChange = (med: MedicationOrder, status: MedicationStatus) => {
      setMedActionConfirm({ id: med.id, status, name: med.name });
  };
  
  const confirmMedStatusChange = () => {
      if (!medActionConfirm) return;
      updateMedicationStatus(medActionConfirm.id, medActionConfirm.status);
      setMedActionConfirm(null);
  };

  const handleMedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMedName(val);
    setShowSuggestions(true);
  };

  const selectMedication = (med: MedicationItem) => {
      setNewMedName(med.name);
      setNewMedDose(med.dose);
      setNewMedRoute(med.route);
      setShowSuggestions(false);
  };

  const isNurse = currentUser.role === 'Nurse';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out text-slate-200 flex flex-col max-h-[90vh] relative">
        
        {/* Medication Action Confirmation Overlay */}
        {medActionConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`p-3 rounded-full ${medActionConfirm.status === MedicationStatus.GIVEN ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                  {medActionConfirm.status === MedicationStatus.GIVEN ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {medActionConfirm.status === MedicationStatus.GIVEN ? 'Patvirtinti suleidimą' : 'Patvirtinti atšaukimą'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Ar tikrai norite pažymėti vaistą <strong>{medActionConfirm.name}</strong> kaip {medActionConfirm.status === MedicationStatus.GIVEN ? 'suleistą' : 'atšauktą'}?
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    type="button"
                    onClick={() => setMedActionConfirm(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                  >
                    Atšaukti
                  </button>
                  <button
                    type="button"
                    onClick={confirmMedStatusChange}
                    className={`flex-1 py-2.5 text-white rounded-lg font-bold shadow-lg transition ${medActionConfirm.status === MedicationStatus.GIVEN ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20' : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'}`}
                  >
                    Patvirtinti
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-slate-950 text-white p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl bg-slate-800 px-3 py-1 rounded text-slate-100">Lova {formData.label}</span>
            <span className="text-slate-400 text-sm">Postas: {formData.section}</span>
          </div>
          <button onClick={handleCloseAttempt} className="hover:bg-slate-800 p-1 rounded transition text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        {formData.patient && (
          <div className="flex border-b border-slate-800 bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'info' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
            >
              <User size={16} /> Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'actions' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
            >
              <ClipboardList size={16} /> Tyrimai / Veiksmai
              {formData.patient.actions && formData.patient.actions.some(a => !a.isCompleted) && (
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meds')}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'meds' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
            >
              <Pill size={16} /> Vaistai
              {formData.patient.medications && formData.patient.medications.some(m => m.status === MedicationStatus.PENDING) && (
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              )}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex-1">
          {!formData.patient ? (
             <div className="bg-slate-950 border border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full">
                 <p className="text-slate-400 mb-6">Šioje lovoje nėra registruoto paciento.</p>
                 <button 
                  type="button"
                  onClick={handleAdmit}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/50 transition transform hover:scale-105"
                 >
                   <UserPlus size={20} />
                   Registruoti pacientą
                 </button>
              </div>
          ) : (
             <form id="patient-form" onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                
                {/* --- TAB: INFO --- */}
                {activeTab === 'info' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                     {/* Patient Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800 pb-2">
                          <User size={18} className="text-blue-500" />
                          <h3>Pagrindiniai duomenys</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Vardas Pavardė</label>
                            <input
                              type="text"
                              required
                              value={formData.patient.name}
                              onChange={(e) => handlePatientChange('name', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                             <div>
                              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Kategorija</label>
                              <select
                                value={formData.patient.triageCategory}
                                onChange={(e) => handlePatientChange('triageCategory', parseInt(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value={1}>1 - Reanimacinė</option>
                                <option value={2}>2 - Skubi (Raudona)</option>
                                <option value={3}>3 - Skubi (Geltona)</option>
                                <option value={4}>4 - Standartinė</option>
                                <option value={5}>5 - Neskubi</option>
                              </select>
                            </div>
                            <div>
                               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Atvyko</label>
                               <input
                                type="time"
                                value={formData.patient.arrivalTime}
                                onChange={(e) => handlePatientChange('arrivalTime', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                               />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Simptomai</label>
                            <input
                              type="text"
                              value={formData.patient.symptoms}
                              onChange={(e) => handlePatientChange('symptoms', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1 text-red-400">Alergijos</label>
                            <input
                              type="text"
                              value={formData.patient.allergies || ''}
                              onChange={(e) => handlePatientChange('allergies', e.target.value)}
                              placeholder="Nėra"
                              className="w-full bg-slate-900 border border-red-900/30 focus:border-red-500 text-red-200 rounded-lg px-3 py-2 outline-none placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800 pb-2">
                          <Activity size={18} className="text-blue-500" />
                          <h3>Klinikinė būklė & Vitals</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Statusas</label>
                            <select
                              value={formData.status}
                              onChange={(e) => handleChange('status', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {Object.values(PatientStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                          
                           <div className="col-span-2">
                             <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Paskirtas gydytojas</label>
                             <div className="relative">
                                <Stethoscope className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <select
                                  value={formData.assignedDoctorId || ''}
                                  onChange={(e) => handleChange('assignedDoctorId', e.target.value)}
                                  className="w-full pl-9 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                  <option value="">-- Pasirinkti gydytoją --</option>
                                  {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                  ))}
                                </select>
                             </div>
                          </div>
                        </div>

                        {/* Vitals Grid */}
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
                            <div className="relative">
                               <label className="text-[10px] text-slate-500 uppercase block mb-1">AKS (mmHg)</label>
                               <div className="flex items-center gap-1">
                                 <input 
                                   type="number" 
                                   placeholder="120"
                                   value={formData.patient.vitals?.bpSystolic || ''} 
                                   onChange={(e) => handleVitalsChange('bpSystolic', e.target.value)}
                                   className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-center text-sm"
                                 />
                                 <span className="text-slate-500">/</span>
                                 <input 
                                   type="number" 
                                   placeholder="80"
                                   value={formData.patient.vitals?.bpDiastolic || ''} 
                                   onChange={(e) => handleVitalsChange('bpDiastolic', e.target.value)}
                                   className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-center text-sm"
                                 />
                               </div>
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 uppercase block mb-1 flex items-center gap-1 border-b border-transparent">ŠSD (bpm)</label>
                               <input 
                                 type="number" 
                                 placeholder="75"
                                 value={formData.patient.vitals?.heartRate || ''} 
                                 onChange={(e) => handleVitalsChange('heartRate', e.target.value)}
                                 className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-center text-sm"
                               />
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 uppercase block mb-1 flex items-center gap-1 border-b border-transparent">SpO2 (%)</label>
                               <input 
                                 type="number" 
                                 placeholder="98"
                                 value={formData.patient.vitals?.spO2 || ''} 
                                 onChange={(e) => handleVitalsChange('spO2', e.target.value)}
                                 className={`w-full bg-slate-800 border border-slate-700 rounded p-1 text-center text-sm font-bold ${formData.patient.vitals?.spO2 && formData.patient.vitals.spO2 < 92 ? 'text-red-500 border-red-500' : 'text-slate-200'}`}
                               />
                            </div>
                            <div>
                               <label className="text-[10px] text-slate-500 uppercase block mb-1 flex items-center gap-1 border-b border-transparent">Temp (°C)</label>
                               <input 
                                 type="number" 
                                 placeholder="36.6"
                                 value={formData.patient.vitals?.temperature || ''} 
                                 onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                                 className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-center text-sm"
                               />
                            </div>
                        </div>

                      </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800 pb-2">
                        <FileText size={18} className="text-blue-500" />
                        <h3>Užrašai</h3>
                      </div>
                      <textarea
                        rows={3}
                        value={formData.comment || ''}
                        onChange={(e) => handleChange('comment', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-slate-600"
                        placeholder="Komentarai..."
                      />
                    </div>
                  </div>
                )}

                {/* --- TAB: ACTIONS (WORKFLOW) --- */}
                {activeTab === 'actions' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                       <h3 className="text-sm font-semibold text-slate-300 mb-3">Paskirti tyrimą ar konsultaciją</h3>
                       <div className="flex gap-2 mb-3 flex-wrap">
                          <button type="button" onClick={() => addAction('LABS', 'Kraujo tyrimai')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs flex items-center gap-2 transition"><Microscope size={14} className="text-blue-400"/> Kraujas</button>
                          <button type="button" onClick={() => addAction('XRAY', 'Rentgenas')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs flex items-center gap-2 transition"><FileImage size={14} className="text-yellow-400"/> Rentgenas</button>
                          <button type="button" onClick={() => addAction('CT', 'KT')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs flex items-center gap-2 transition"><Activity size={14} className="text-purple-400"/> KT</button>
                          <button type="button" onClick={() => addAction('EKG', 'EKG')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs flex items-center gap-2 transition"><HeartPulse size={14} className="text-red-400"/> EKG</button>
                          <button type="button" onClick={() => addAction('ULTRASOUND', 'Ultragarsas')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-xs flex items-center gap-2 transition"><Waves size={14} className="text-cyan-400"/> UG</button>
                       </div>
                       
                       <div className="flex gap-2">
                          <select 
                            value={newActionType}
                            onChange={(e) => setNewActionType(e.target.value as ActionType)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none"
                          >
                            <option value="LABS">Tyrimai</option>
                            <option value="XRAY">Rentgenas</option>
                            <option value="CT">Kompiuterinė T.</option>
                            <option value="EKG">EKG</option>
                            <option value="ULTRASOUND">Ultragarsas</option>
                            <option value="CONSULT">Konsultacija</option>
                            <option value="OTHER">Kita</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder="Aprašymas (pvz. Neurologas, Pilvo echoskopija)" 
                            value={newActionName}
                            onChange={(e) => setNewActionName(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none"
                          />
                          {/* Time Input */}
                          <input
                            type="time"
                            value={newActionTime}
                            onChange={(e) => setNewActionTime(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none w-24 text-center"
                          />
                          <button type="button" onClick={() => newActionName && addAction(newActionType, newActionName)} className="bg-blue-600 px-3 rounded text-white"><Plus size={18}/></button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <h3 className="text-sm font-semibold text-slate-300 mb-2">Paskirti veiksmai</h3>
                       {!formData.patient.actions || formData.patient.actions.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-lg">Nėra paskirtų veiksmų.</div>
                       ) : (
                          formData.patient.actions.map(action => (
                            <div key={action.id} className={`flex items-center justify-between p-3 rounded-lg border ${action.isCompleted ? 'bg-green-900/10 border-green-900/30' : 'bg-slate-800 border-slate-700'}`}>
                               <div className="flex items-center gap-3">
                                  <button 
                                    type="button" 
                                    onClick={() => toggleAction(action.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition ${action.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 hover:border-blue-400'}`}
                                  >
                                    {action.isCompleted && <CheckCircle size={14} />}
                                  </button>
                                  <div>
                                     <div className={`font-medium text-sm ${action.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{action.name}</div>
                                     <div className="flex gap-2 text-[10px] text-slate-500 uppercase tracking-wide">
                                       <span>{action.type}</span>
                                       <span>• {new Date(action.requestedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                  </div>
                               </div>
                               <button onClick={() => removeAction(action.id)} className="text-slate-600 hover:text-red-400"><X size={16}/></button>
                            </div>
                          ))
                       )}
                    </div>
                  </div>
                )}

                {/* --- TAB: MEDICATIONS --- */}
                {activeTab === 'meds' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                    
                     {formData.patient.allergies && (
                        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-3 text-red-200 mb-4">
                           <AlertCircle className="text-red-500 shrink-0" size={20} />
                           <div>
                              <div className="font-bold text-sm">DĖMESIO: ALERGIJA</div>
                              <div className="text-xs uppercase">{formData.patient.allergies}</div>
                           </div>
                        </div>
                     )}

                    {/* New Order Form (Doctors Only) */}
                    {!isNurse && (
                      <div className="space-y-4">
                        {/* Protocol Section */}
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Package size={14}/> Greitieji Protokolai</h3>
                            <div className="flex flex-wrap gap-2">
                                {MEDICATION_PROTOCOLS.map((protocol) => (
                                    <button
                                        key={protocol.name}
                                        type="button"
                                        onClick={() => applyProtocol(protocol)}
                                        className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-800/50 rounded text-xs font-medium text-blue-200 transition"
                                    >
                                        {protocol.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                           <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                             <Plus size={16} className="text-green-500" />
                             Naujas paskyrimas
                           </h3>
                           
                           {/* Quick Picks - Show prioritized common drugs */}
                           <div className="mb-4">
                              <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block tracking-wider">Dažniausi vaistai (Greita parinktis)</label>
                              <div className="flex flex-wrap gap-2">
                                  {quickPickMeds.map((drug) => (
                                     <button
                                       key={drug.id}
                                       type="button"
                                       onClick={() => selectMedication(drug)}
                                       className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded text-xs text-slate-300 transition flex items-center gap-1.5"
                                     >
                                       <span className="font-medium text-slate-200">{drug.name}</span>
                                       <span className="text-slate-500 border-l border-slate-700 pl-1.5">{drug.dose}</span>
                                     </button>
                                  ))}
                              </div>
                           </div>

                           <div className="flex gap-2 items-end mb-3">
                              <div className="flex-1 relative">
                                 <input 
                                   type="text" 
                                   placeholder="Vaisto pavadinimas (pvz. NaCl, Ketanov...)" 
                                   className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                   value={newMedName}
                                   onChange={handleMedNameChange}
                                   onFocus={() => setShowSuggestions(true)}
                                   onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                   autoComplete="off"
                                 />
                                 
                                 {/* Custom Autocomplete Dropdown */}
                                 {showSuggestions && newMedName && filteredSuggestions.length > 0 && (
                                   <ul className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                                      {filteredSuggestions.map((med) => {
                                        const matchedSynonym = getMatchedSynonym(med.name, newMedName);
                                        return (
                                          <li 
                                            key={med.id}
                                            onMouseDown={(e) => { e.preventDefault(); selectMedication(med); }} // Use onMouseDown to trigger before onBlur
                                            className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-700/50 last:border-0"
                                          >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-200">{med.name}</span>
                                                {matchedSynonym && <span className="text-xs text-blue-400 font-mono italic">({matchedSynonym})</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                               {med.dose} • {med.route} {med.category && `• ${med.category}`}
                                            </div>
                                          </li>
                                        );
                                      })}
                                   </ul>
                                 )}
                              </div>
                              <div className="w-20">
                                 <input 
                                   type="text" 
                                   placeholder="Dozė" 
                                   className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                   value={newMedDose}
                                   onChange={(e) => setNewMedDose(e.target.value)}
                                 />
                              </div>
                              <div className="w-20">
                                 <select 
                                   className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-1.5 text-sm outline-none focus:border-blue-500"
                                   value={newMedRoute}
                                   onChange={(e) => setNewMedRoute(e.target.value)}
                                 >
                                   <option value="IV">IV</option>
                                   <option value="IM">IM</option>
                                   <option value="PO">PO</option>
                                   <option value="SC">SC</option>
                                   <option value="Inhal">Inhal</option>
                                   <option value="Nebul">Nebul</option>
                                   <option value="Topical">Top</option>
                                   <option value="PR">PR</option>
                                 </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => addMedication()}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition"
                                disabled={!newMedName}
                              >
                                <Plus size={20} />
                              </button>
                           </div>

                           {/* Reminder Toggle */}
                           <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                             <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={enableReminder}
                                  onChange={(e) => setEnableReminder(e.target.checked)}
                                  className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                />
                                <Clock size={14} className="text-yellow-500" />
                                Priminti suleisti po:
                             </label>
                             {enableReminder && (
                               <div className="flex items-center gap-1">
                                 <input 
                                   type="number" 
                                   min="1"
                                   max="24"
                                   value={reminderHours}
                                   onChange={(e) => setReminderHours(Math.max(1, parseInt(e.target.value) || 1))}
                                   className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-xs text-center outline-none"
                                 />
                                 <span className="text-xs text-slate-500">val.</span>
                               </div>
                             )}
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Orders List */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                         <Pill size={16} className="text-blue-500" />
                         Paskyrimų sąrašas
                       </h3>
                       
                       {!formData.patient.medications || formData.patient.medications.length === 0 ? (
                         <div className="text-center py-6 text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-lg">
                           Nėra aktyvių paskyrimų.
                         </div>
                       ) : (
                         formData.patient.medications.map((med) => (
                           <div key={med.id} className={`flex items-center justify-between p-3 rounded-lg border animate-in fade-in slide-in-from-left-2 duration-300 ${med.status === MedicationStatus.GIVEN ? 'bg-green-900/10 border-green-900/30' : med.status === MedicationStatus.CANCELLED ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
                              <div className="flex-1">
                                 <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${med.status === MedicationStatus.GIVEN ? 'text-green-400' : med.status === MedicationStatus.CANCELLED ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                      {med.name}
                                    </span>
                                    <span className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">{med.dose} {med.route}</span>
                                 </div>
                                 <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                                   <span>Paskyrė: {doctors.find(d => d.id === med.orderedBy)?.name || 'Gydytojas'} ({new Date(med.orderedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                                   {med.reminderAt && med.status === MedicationStatus.PENDING && (
                                     <span className="flex items-center gap-1 text-yellow-500/80">
                                       <Clock size={10} /> Priminimas: {new Date(med.reminderAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     </span>
                                   )}
                                   {med.administeredBy && (
                                     <span className="text-green-500/70">Suleido: {med.administeredBy} ({new Date(med.administeredAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                                   )}
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                 {/* Nurse Actions */}
                                 {med.status === MedicationStatus.PENDING && (
                                   <>
                                      <button
                                        type="button"
                                        onClick={() => requestMedStatusChange(med, MedicationStatus.GIVEN)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition shadow-sm"
                                        title="Pažymėti kaip suleistą"
                                      >
                                        <CheckCircle size={14} /> Suleisti
                                      </button>
                                      {!isNurse && (
                                        <button
                                          type="button"
                                          onClick={() => requestMedStatusChange(med, MedicationStatus.CANCELLED)}
                                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition"
                                          title="Atšaukti paskyrimą"
                                        >
                                          <XCircle size={16} />
                                        </button>
                                      )}
                                   </>
                                 )}
                                 
                                 {/* Doctor Actions */}
                                 {!isNurse && (
                                    <button
                                        type="button"
                                        onClick={() => repeatMedication(med)}
                                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition"
                                        title="Pakartoti paskyrimą"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                 )}

                                 {med.status === MedicationStatus.GIVEN && (
                                    <span className="flex items-center gap-1 text-green-500 text-xs font-bold px-2 py-1 bg-green-900/20 rounded border border-green-900/30">
                                      <CheckCircle size={12} /> SULEISTA
                                    </span>
                                 )}
                                 {med.status === MedicationStatus.CANCELLED && (
                                    <span className="text-xs text-slate-500 font-medium">Atšaukta</span>
                                 )}
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                )}
             </form>
          )}
        </div>

        {/* Footer Actions */}
        {formData.patient && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
             <div className="flex gap-3 items-center">
                {isDiscardConfirmOpen ? (
                  <div className="flex-1 flex items-center justify-end gap-2 bg-yellow-900/20 border border-yellow-900/50 rounded-lg px-3 py-1.5 animate-in slide-in-from-bottom-1 duration-200 ease-out">
                    <AlertTriangle size={16} className="text-yellow-500 ml-1" />
                    <span className="text-xs text-yellow-200 font-semibold px-1">Turite neišsaugotų pakeitimų.</span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold rounded transition"
                    >
                      Uždaryti neįšsaugojus
                    </button>
                    <button
                       type="button"
                       onClick={() => setIsDiscardConfirmOpen(false)}
                       className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition"
                    >
                      Grįžti
                    </button>
                  </div>
                ) : !isDeleteConfirmOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="px-4 py-2 text-red-400 hover:bg-red-900/20 border border-red-900/50 rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Atlaisvinti lovą
                    </button>
                    <div className="flex-1"></div>
                    <button
                      type="button"
                      onClick={handleCloseAttempt}
                      className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg font-medium transition"
                    >
                      Atšaukti
                    </button>
                    <button
                      type="button" 
                      onClick={(e) => handleSubmit(e as any)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-900/50 transition"
                    >
                      Išsaugoti
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/50 rounded-lg px-2 py-1.5 animate-in slide-in-from-bottom-1 duration-200 ease-out w-full justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500 ml-1" />
                        <span className="text-xs text-red-200 font-semibold px-1">Ar tikrai ištrinti?</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmClear}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition"
                        >
                          TAIP
                        </button>
                        <button
                           type="button"
                           onClick={() => setIsDeleteConfirmOpen(false)}
                           className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition"
                        >
                          NE
                        </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPatientModal;
