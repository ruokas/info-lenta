
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bed, PatientStatus, TriageCategory, Staff, UserProfile, MedicationOrder, MedicationStatus, ClinicalAction, ActionType, MedicationItem, WorkShift, Vitals, MedicationProtocol } from '../types';
import { X, User, Activity, Stethoscope, AlertCircle, FileText, UserPlus, Trash2, AlertTriangle, Pill, Plus, CheckCircle, XCircle, Package, ClipboardList, RotateCcw, Microscope, FileImage, Clock, Waves, HeartPulse, Sparkles, Wind, Thermometer, Brain, MapPin, Users, Mic, MicOff, ChevronRight, ChevronDown } from 'lucide-react';
import { STATUS_COLORS } from '../constants';
import { AuditService } from '../services/AuditService'; // NEW

interface EditPatientModalProps {
  bed: Bed;
  beds: Bed[];
  doctors: Staff[];
  nurses: Staff[];
  currentUser: UserProfile;
  medicationBank: MedicationItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBed: Bed) => void;
  workShifts?: WorkShift[];
  protocols: MedicationProtocol[];
  onMovePatient?: (fromBedId: string, toBedId: string) => void;
  medicationCombinations?: MedicationProtocol[];
  onSaveCombination?: (combo: MedicationProtocol) => void;
  personalizedTopMeds?: MedicationItem[];
  onDeleteCombination?: (id: string) => void;
}

// Common abbreviations mapping
const DRUG_SYNONYMS: Record<string, string[]> = {
  'Sodium chloride': ['NaCl', 'Natris', 'Fiziologinis', 'Fizikas'],
  'Kalii chloridum': ['K', 'KCL', 'Kalis'],
  'Magnesium sulfatum': ['Mg', 'Magnis', 'MgSO4'],
  'Adrenalinum': ['Epinefrinas', 'Adr'],
  'Paracetamolum': ['PCM', 'Acetaminophen', 'Perfalgan'],
  'Ketorolaci tromethaminum': ['Ketanov', 'Ketolgan', 'Keto'],
  'Diazepamum': ['Relanium', 'Diazepamas'],
  'Salbutamolum': ['Ventolin'],
  'Heparinum': ['Heparinas'],
  'Glucose': ['Gliukozė'],
};

const EditPatientModal: React.FC<EditPatientModalProps> = ({ bed, beds, doctors, nurses, currentUser, medicationBank = [], isOpen, onClose, onSave, workShifts, protocols = [], onMovePatient, medicationCombinations = [], onSaveCombination, onDeleteCombination, personalizedTopMeds = [] }) => {
  const [formData, setFormData] = useState<Bed>(bed);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'actions' | 'meds'>('info');

  // UI State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(true);

  // Medication Form State
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('IV');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [medActionConfirm, setMedActionConfirm] = useState<{ id: string, status: MedicationStatus, name: string } | null>(null);
  const [inlineWarning, setInlineWarning] = useState<{ type: 'MED' | 'PROTOCOL', text: string, data: any } | null>(null);

  console.log("EditPatientModal Render. InlineWarning:", inlineWarning);

  // Medication Reminder State
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderHours, setReminderHours] = useState(1);
  const [isCompoundMode, setIsCompoundMode] = useState(false); // NEW: Compound Mode State

  // Save Combination State
  const [isSavingCombo, setIsSavingCombo] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboToDelete, setComboToDelete] = useState<string | null>(null);

  // Helper for feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action Form State
  const [newActionType, setNewActionType] = useState<ActionType>('LABS');
  const [newActionName, setNewActionName] = useState('');
  const [newActionTime, setNewActionTime] = useState('');

  // ARPA Suggestion State
  const [suggestedDoctor, setSuggestedDoctor] = useState<{ id: string, name: string, score: number } | null>(null);

  // Transfer State
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Available beds for transfer
  const availableBeds = useMemo(() => {
    return beds.filter(b => b.status === PatientStatus.EMPTY || b.status === PatientStatus.CLEANING);
  }, [beds]);

  const handleTransfer = (targetBedId: string) => {
    if (onMovePatient && formData.patient) {
      onMovePatient(bed.id, targetBedId);
      onClose();
      setIsTransferOpen(false);
    }
  };

  // Voice Dictation State
  const [listeningField, setListeningField] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const activeDoctors = useMemo(() => {
    return doctors.filter(d => d.role === 'Doctor' && d.isActive !== false);
  }, [doctors]);

  const sectionNurses = useMemo(() => {
    return nurses.filter(n => n.assignedSection === formData.section && !n.isDisabled && n.isActive);
  }, [nurses, formData.section]);

  const quickPickMeds = useMemo(() => {
    if (!medicationBank || !Array.isArray(medicationBank)) return [];
    const COMMON_PRIORITY = ['Ketorolaci tromethaminum', 'Paracetamolum', 'Ibuprofenum', 'Metoclopramidum', 'Sodium chloride', 'Diazepamum', 'Morphinum', 'Adrenalinum', 'Captoprilum', 'Furosemidum', 'Salbutamolum', 'Glyceroli trinitras'];

    // Safety check: ensure m and m.name exist
    const priorityMeds = medicationBank.filter(m => m && m.name && m.isActive !== false && COMMON_PRIORITY.some(p => m.name.includes(p)));

    priorityMeds.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      const idxA = COMMON_PRIORITY.findIndex(p => nameA.includes(p));
      const idxB = COMMON_PRIORITY.findIndex(p => nameB.includes(p));
      return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB);
    });
    return priorityMeds.slice(0, 20);
  }, [medicationBank]);

  const filteredSuggestions = useMemo(() => {
    if (!newMedName || !medicationBank || !Array.isArray(medicationBank)) return [];

    // If in compound mode, filter based on the LAST term
    const searchTerm = isCompoundMode ? newMedName.split('+').pop()?.trim() || '' : newMedName;
    if (searchTerm.length < 2) return []; // Require 2 chars
    const q = searchTerm.toLowerCase();

    return medicationBank.filter(med => {
      if (!med || !med.name || med.isActive === false) return false;
      if (med.name.toLowerCase().includes(q)) return true;
      let syns = DRUG_SYNONYMS[med.name];
      if (!syns) { const key = Object.keys(DRUG_SYNONYMS).find(k => med.name.includes(k)); if (key) syns = DRUG_SYNONYMS[key]; }
      if (syns && syns.some(s => s.toLowerCase().includes(q))) return true;
      return false;
    }).slice(0, 20);
  }, [newMedName, medicationBank, isCompoundMode]);

  const getMatchedSynonym = (medName: string, query: string): string | null => {
    if (!medName) return null;
    const term = isCompoundMode ? query.split('+').pop()?.trim() || '' : query;
    const q = term.toLowerCase();
    if (medName.toLowerCase().includes(q)) return null;
    let syns = DRUG_SYNONYMS[medName];
    if (!syns) { const key = Object.keys(DRUG_SYNONYMS).find(k => medName.includes(k)); if (key) syns = DRUG_SYNONYMS[key]; }
    const match = syns?.find(s => s.toLowerCase().includes(q));
    return match || null;
  };

  // Updated selectMedication
  const selectMedication = (med: MedicationItem) => {
    if (isCompoundMode) {
      setNewMedName(prev => {
        const parts = prev.split('+').map(p => p.trim());
        // If the last part was partial input, replace it
        // Check if we are "in the middle" of typing the last part
        // Simple logic: remove last part, add new
        // Actually, filteredSuggestions runs on current input. 
        // If I typed "Ring", parts=["Ring"]. Pop "Ring", push "Ringer".
        parts.pop();
        parts.push(med.name);
        return parts.join(' + ') + ' + ';
      });
      // Do not override dose/route in compound mode usually, or maybe set if empty
    } else {
      setNewMedName(med.name);
      if (med.dose) setNewMedDose(med.dose);
      if (med.route) setNewMedRoute(med.route);
    }
    setShowSuggestions(false);
  };

  useEffect(() => {
    setFormData(bed);
    setIsDeleteConfirmOpen(false);
    setIsDiscardConfirmOpen(false);
    setMedActionConfirm(null);
    setActiveTab('info');
    setNewMedName(''); setNewMedDose(''); setNewActionName('');
    setEnableReminder(false); setReminderHours(1); setShowSuggestions(false); setSuggestedDoctor(null);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setNewActionTime(`${hh}:${mm}`);
    setListeningField(null);
  }, [bed]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const hasUnsavedChanges = useMemo(() => JSON.stringify(bed) !== JSON.stringify(formData), [bed, formData]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Bed, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };
  const handlePatientChange = (field: string, value: any) => { if (!formData.patient) return; setFormData(prev => ({ ...prev, patient: prev.patient ? { ...prev.patient, [field]: value } : undefined })); };
  const handleVitalsChange = (field: string, value: any) => { if (!formData.patient) return; const numValue = (field === 'onOxygen' || field === 'consciousness') ? value : (value === '' ? undefined : Number(value)); setFormData(prev => ({ ...prev, patient: { ...prev.patient!, vitals: { ...prev.patient!.vitals, [field]: numValue, lastUpdated: new Date().toISOString() } } })); };

  // --- Voice Dictation Logic ---
  const toggleDictation = (fieldId: string, currentText: string, onUpdate: (text: string) => void) => {
    if (listeningField === fieldId) {
      // Stop
      if (recognitionRef.current) recognitionRef.current.stop();
      setListeningField(null);
      return;
    }

    // Start
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Jūsų naršyklė nepalaiko balso įvedimo (reikalinga Chrome/Edge).');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'lt-LT';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListeningField(fieldId);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newText = currentText ? `${currentText} ${transcript}` : transcript;
      onUpdate(newText);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setListeningField(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // NEWS2 Calculation
  const calculateNEWS2 = (vitals?: Vitals) => {
    if (!vitals) return { score: 0, level: 'N/A' };
    let score = 0;
    if (vitals.respRate) { if (vitals.respRate <= 8 || vitals.respRate >= 25) score += 3; else if (vitals.respRate >= 21) score += 2; else if (vitals.respRate <= 11) score += 1; }
    if (vitals.spO2) { if (vitals.spO2 <= 91) score += 3; else if (vitals.spO2 <= 93) score += 2; else if (vitals.spO2 <= 95) score += 1; }
    if (vitals.onOxygen) score += 2;
    if (vitals.bpSystolic) { if (vitals.bpSystolic <= 90 || vitals.bpSystolic >= 220) score += 3; else if (vitals.bpSystolic <= 100) score += 2; else if (vitals.bpSystolic <= 110) score += 1; }
    if (vitals.heartRate) { if (vitals.heartRate <= 40 || vitals.heartRate >= 131) score += 3; else if (vitals.heartRate >= 111) score += 2; else if (vitals.heartRate <= 50 || vitals.heartRate >= 91) score += 1; }
    if (vitals.consciousness === 'CVPU') score += 3;
    if (vitals.temperature) { if (vitals.temperature <= 35.0) score += 3; else if (vitals.temperature >= 39.1) score += 2; else if (vitals.temperature <= 36.0 || vitals.temperature >= 38.1) score += 1; }
    return { score, level: score >= 7 ? 'High' : score >= 5 ? 'Medium' : score >= 1 ? 'Low' : 'Low' };
  };
  const news2 = calculateNEWS2(formData.patient?.vitals);

  const handleAdmit = () => {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    setFormData(prev => ({ ...prev, status: PatientStatus.WAITING_EXAM, patient: { id: Date.now().toString(), name: '', symptoms: '', triageCategory: 0 as TriageCategory, arrivalTime: timeString, medications: [], actions: [], vitals: { lastUpdated: new Date().toISOString() } } }));
    AuditService.log(currentUser, 'ADMIT_PATIENT', `Registruojamas naujas pacientas į lovą ${bed.label}`);
  };

  const calculateArpaSuggestions = () => {
    if (activeDoctors.length > 0) {
      setSuggestedDoctor({ id: activeDoctors[0].id, name: activeDoctors[0].name, score: 5.5 });
      handleChange('assignedDoctorId', activeDoctors[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
  const handleCloseAttempt = () => { if (hasUnsavedChanges) setIsDiscardConfirmOpen(true); else onClose(); };
  const handleConfirmClear = () => {
    onSave({ ...formData, patient: undefined, status: PatientStatus.CLEANING, comment: '', assignedDoctorId: undefined });
    AuditService.log(currentUser, 'CLEAR_BED', `Atlaisvinta lova ${bed.label}`);
  };

  const addAction = (type: ActionType, name: string) => {
    if (!formData.patient) return;
    let requestedAtStr = new Date().toISOString();
    if (newActionTime) { const now = new Date(); const [h, m] = newActionTime.split(':').map(Number); now.setHours(h, m, 0, 0); requestedAtStr = now.toISOString(); }
    const newAction: ClinicalAction = { id: `act-${Date.now()}`, type, name, isCompleted: false, requestedAt: requestedAtStr };
    setFormData(prev => ({ ...prev, patient: { ...prev.patient!, actions: [...(prev.patient!.actions || []), newAction] } }));
    setNewActionName('');
    AuditService.log(currentUser, 'ADD_ACTION', `Paskirtas veiksmas: ${name} (${type}) pacientui ${formData.patient.name}`);
  };
  const toggleAction = (actionId: string) => {
    if (!formData.patient?.actions) return;
    const updatedActions = formData.patient.actions.map(a => a.id === actionId ? { ...a, isCompleted: !a.isCompleted, completedAt: !a.isCompleted ? new Date().toISOString() : undefined } : a);
    setFormData(prev => ({ ...prev, patient: { ...prev.patient!, actions: updatedActions } }));

    const action = formData.patient.actions.find(a => a.id === actionId);
    if (action) AuditService.log(currentUser, action.isCompleted ? 'UNDO_ACTION' : 'COMPLETE_ACTION', `${action.isCompleted ? 'Atšauktas' : 'Atliktas'} veiksmas: ${action.name}`);
  };
  const removeAction = (actionId: string) => {
    const action = formData.patient?.actions?.find(a => a.id === actionId);
    if (action) AuditService.log(currentUser, 'REMOVE_ACTION', `Pašalintas veiksmas: ${action.name}`);
    setFormData(prev => ({ ...prev, patient: { ...prev.patient!, actions: prev.patient!.actions!.filter(a => a.id !== actionId) } }));
  };

  const calculateReminderTime = () => { if (!enableReminder) return undefined; const now = new Date(); now.setHours(now.getHours() + reminderHours); return now.toISOString(); };
  const addMedication = (name: string = newMedName, dose: string = newMedDose, route: string = newMedRoute, force: boolean = false) => {
    if (!formData.patient || !name) return;

    // Check for duplicates (only if not forced)
    if (!force) {
      const isDuplicate = formData.patient.medications?.some(m => m.name.toLowerCase() === name.toLowerCase() && m.status === MedicationStatus.PENDING);
      if (isDuplicate) {
        setInlineWarning({ type: 'MED', text: `Vaistas "${name}" jau yra paskirtas.`, data: { name, dose, route } });
        return;
      }
    }

    const newOrder: MedicationOrder = { id: `med-${Date.now()}-${Math.random()}`, name, dose, route, orderedBy: currentUser.id, orderedAt: new Date().toISOString(), status: MedicationStatus.PENDING, reminderAt: calculateReminderTime() };
    setFormData(prev => ({ ...prev, patient: { ...prev.patient!, medications: [...(prev.patient!.medications || []), newOrder] } }));

    // Only clear inputs if it was a manual add
    if (name === newMedName) {
      setNewMedName(''); setNewMedDose(''); setShowSuggestions(false);
    }

    AuditService.log(currentUser, 'ADD_MED', `Paskirtas vaistas: ${name} ${dose} ${route} pacientui ${formData.patient.name}`);
    showToast(`Pridėta: ${name}`);
    setInlineWarning(null);
  };

  const applyProtocol = (protocol: MedicationProtocol, force: boolean = false) => {
    if (!formData.patient) return;

    // Check for duplicates in the protocol
    if (!force) {
      const existingPendingNames = new Set(formData.patient.medications?.filter(m => m.status === MedicationStatus.PENDING).map(m => m.name.toLowerCase()));
      const duplicates = protocol.meds.filter(m => existingPendingNames.has(m.name.toLowerCase()));

      if (duplicates.length > 0) {
        setInlineWarning({
          type: 'PROTOCOL',
          text: `Pasikartojantys vaistai: ${duplicates.map(d => d.name).join(', ')}.`,
          data: protocol
        });
        return;
      }
    }

    const reminder = calculateReminderTime();

    // Add Meds
    const newOrders: MedicationOrder[] = protocol.meds.map(med => ({
      id: `med-${Date.now()}-${Math.random()}`,
      name: med.name, dose: med.dose, route: med.route,
      orderedBy: currentUser.id, orderedAt: new Date().toISOString(),
      status: MedicationStatus.PENDING, reminderAt: reminder
    }));

    // Add Actions
    const newActions: ClinicalAction[] = (protocol.actions || []).map(act => ({
      id: `act-${Date.now()}-${Math.random()}`,
      type: act.type,
      name: act.name,
      isCompleted: false,
      requestedAt: new Date().toISOString()
    }));

    setFormData(prev => ({
      ...prev,
      patient: {
        ...prev.patient!,
        medications: [...(prev.patient!.medications || []), ...newOrders],
        actions: [...(prev.patient!.actions || []), ...newActions]
      }
    }));
    AuditService.log(currentUser, 'APPLY_PROTOCOL', `Pritaikytas protokolas: ${protocol.name} pacientui ${formData.patient.name}`);
    showToast(`Pritaikytas derinys: ${protocol.name}`);
  };

  const updateMedicationStatus = (medId: string, status: MedicationStatus) => {
    if (!formData.patient?.medications) return;
    const updatedMeds = formData.patient.medications.map(med => med.id === medId ? { ...med, status, administeredBy: status === MedicationStatus.GIVEN ? currentUser.id : undefined, administeredAt: status === MedicationStatus.GIVEN ? new Date().toISOString() : undefined } : med);
    setFormData(prev => ({ ...prev, patient: { ...prev.patient!, medications: updatedMeds } }));

    const med = formData.patient.medications.find(m => m.id === medId);
    if (med) AuditService.log(currentUser, 'UPDATE_MED_STATUS', `Vaisto ${med.name} statusas: ${status}`);
  };
  const requestMedStatusChange = (med: MedicationOrder, status: MedicationStatus) => { setMedActionConfirm({ id: med.id, status, name: med.name }); };
  const confirmMedStatusChange = () => { if (!medActionConfirm) return; updateMedicationStatus(medActionConfirm.id, medActionConfirm.status); setMedActionConfirm(null); };

  const handleSaveCurrentCombination = () => {
    if (!onSaveCombination) return;

    // Check pending or given meds (exclude cancelled)
    const validMeds = formData.patient?.medications?.filter(m => m && (m.status === MedicationStatus.PENDING || m.status === MedicationStatus.GIVEN)) || [];
    console.log("Saving Combo - Valid Meds:", validMeds.length);

    if (validMeds.length === 0) {
      alert("Pirmiausia pridėkite vaistus į sąrašą (Paskirta), tada išsaugokite kaip derinį.");
      setIsSavingCombo(false);
      return;
    }

    if (!comboName.trim()) {
      alert("Įveskite derinio pavadinimą.");
      return;
    }

    const newCombo: MedicationProtocol = {
      id: `combo-${Date.now()}`,
      name: comboName,
      meds: validMeds.map(m => ({ name: m.name, dose: m.dose, route: m.route })),
      actions: []
    };

    console.log("EditPatientModal: Saving Combination:", newCombo);
    if (onSaveCombination) {
      onSaveCombination(newCombo);
      console.log("EditPatientModal: onSaveCombination called successfully");
    } else {
      console.error("EditPatientModal: onSaveCombination prop is MISSING");
      alert("Klaida: Nepavyko išsaugoti (trūksta funkcijos).");
    }

    setIsSavingCombo(false);
    setComboName('');
    AuditService.log(currentUser, 'CREATE_PROTOCOL', `Sukurtas naujas derinys: ${comboName}`);
    showToast(`Išsaugotas derinys: ${comboName}`);
  };

  const isNurse = currentUser.role === 'Nurse';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4">
      <div className="bg-slate-900 sm:border border-slate-700 w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-xl shadow-2xl overflow-hidden text-slate-200 flex flex-col relative animate-in zoom-in-95 duration-200">

        {/* Medication Action Confirmation Overlay */}
        {medActionConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-slate-100">{medActionConfirm.status === MedicationStatus.GIVEN ? 'Patvirtinti suleidimą' : 'Patvirtinti atšaukimą'}</h3>
              <div className="flex gap-3 w-full mt-4">
                <button type="button" onClick={() => setMedActionConfirm(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">Atšaukti</button>
                <button type="button" onClick={confirmMedStatusChange} className={`flex-1 py-3 text-white rounded-lg font-bold ${medActionConfirm.status === MedicationStatus.GIVEN ? 'bg-green-600' : 'bg-red-600'}`}>Patvirtinti</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Combination Confirmation Overlay */}
        {comboToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><AlertCircle className="text-red-500" /> Ištrinti derinį?</h3>
              <p className="text-slate-400 text-sm mt-2">Ar tikrai norite pašalinti šį vaistų derinį? Veiksmo negalima atšaukti.</p>
              <div className="flex gap-3 w-full mt-6">
                <button type="button" onClick={() => setComboToDelete(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">Atšaukti</button>
                <button type="button" onClick={() => {
                  if (onDeleteCombination && comboToDelete) {
                    onDeleteCombination(comboToDelete);
                    showToast("Derinys ištrintas");
                  }
                  setComboToDelete(null);
                }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-900/20">Ištrinti</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-800 border border-green-500/50 shadow-2xl shadow-green-900/20 px-6 py-3 rounded-full flex items-center gap-3">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-slate-200 font-bold text-sm">{toastMessage}</span>
            </div>
          </div>
        )}



        {isDiscardConfirmOpen && (
          <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 p-4 shadow-2xl flex items-center justify-between safe-area-pb">
            <div className="flex items-center gap-3"><AlertCircle className="text-yellow-500" size={24} /><div><h4 className="font-bold text-slate-200">Neišsaugoti pakeitimai</h4></div></div>
            <div className="flex gap-3"><button type="button" onClick={() => setIsDiscardConfirmOpen(false)} className="px-4 py-3 bg-slate-800 text-slate-200 rounded-lg">Tęsti</button><button type="button" onClick={onClose} className="px-4 py-3 bg-red-600 text-white rounded-lg">Uždaryti</button></div>
          </div>
        )}

        <div className="bg-slate-950 text-white pl-4 pr-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => onMovePatient && setIsTransferOpen(!isTransferOpen)}
                className={`font-bold text-xl px-3 py-1 rounded text-slate-100 flex items-center gap-2 transition ${onMovePatient ? 'bg-slate-800 hover:bg-slate-700 cursor-pointer' : 'bg-slate-800 cursor-default'}`}
              >
                Lova {formData.label}
                {onMovePatient && <RotateCcw size={16} className="text-slate-400" />}
              </button>

              {/* Transfer Dropdown */}
              {isTransferOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 bg-slate-950">
                    <h4 className="text-sm font-bold text-slate-400 uppercase">Perkelti į lovą:</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {availableBeds.length > 0 ? (
                      availableBeds.map(b => (
                        <button
                          key={b.id}
                          onClick={() => handleTransfer(b.id)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-blue-900/30 hover:text-blue-400 rounded-lg flex justify-between items-center mb-1 last:mb-0"
                        >
                          <span className="font-bold">{b.label}</span>
                          <span className="text-xs text-slate-500">{b.section}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-sm">Nėra laisvų lovų</div>
                    )}
                  </div>
                  {/* Close Dropdown Overlay */}
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsTransferOpen(false)}></div>
                </div>
              )}
            </div>
            <span className="text-slate-400 text-sm hidden sm:inline">{formData.section}</span>
          </div>
          <button onClick={handleCloseAttempt} className="bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {formData.patient && (
          <div className="flex border-b border-slate-800 bg-slate-900 shrink-0">
            <button type="button" onClick={() => setActiveTab('info')} className={`flex-1 py-3 md:py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'info' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400'}`}><User size={18} /> Info</button>
            <button type="button" onClick={() => setActiveTab('actions')} className={`flex-1 py-3 md:py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'actions' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400'}`}><ClipboardList size={18} /> Veiksmai {formData.patient.actions?.some(a => !a.isCompleted) && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}</button>
            <button type="button" onClick={() => setActiveTab('meds')} className={`flex-1 py-3 md:py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'meds' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400'}`}><Pill size={18} /> Vaistai {formData.patient.medications?.some(m => m.status === MedicationStatus.PENDING) && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}</button>
          </div>
        )}

        <div className="overflow-y-auto custom-scrollbar p-4 md:p-6 flex-1 safe-area-pb">
          {!formData.patient ? (
            <div className="flex flex-col h-full">
              {/* Info Card */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-4 md:p-8">

                <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 mb-4 shadow-xl">
                    <span className="text-4xl font-bold text-slate-100">{formData.label}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-200">{formData.section}</h2>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Users size={16} />
                    <span>{sectionNurses.length > 0 ? sectionNurses.map(n => n.name).join(', ') : 'Nepriskirta'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-slate-500 uppercase text-xs font-bold">Statusas</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[formData.status] || 'bg-slate-800 text-slate-400'}`}>
                      {formData.status}
                    </span>
                  </div>
                  {formData.comment ? (
                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase text-xs font-bold">Komentaras</span>
                      <p className="text-slate-300 text-sm italic">"{formData.comment}"</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-600 text-xs italic py-2">Komentarų nėra</div>
                  )}
                </div>

                <button type="button" onClick={handleAdmit} className="flex gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 shadow-lg shadow-blue-900/30 transition-transform hover:scale-105 active:scale-95"><UserPlus size={24} /> Registruoti pacientą</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === 'info' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Patient Basic Info */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Vardas Pavardė</label>
                          <input type="text" required value={formData.patient.name} onChange={(e) => handlePatientChange('name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Kategorija</label>
                            <select value={formData.patient.triageCategory} onChange={(e) => handlePatientChange('triageCategory', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-3 outline-none text-base"><option value={0}>--</option><option value={1}>1 - Reanimacinė</option><option value={2}>2 - Skubi (Raudona)</option><option value={3}>3 - Skubi (Geltona)</option><option value={4}>4 - Standartinė</option><option value={5}>5 - Neskubi</option></select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Atvyko</label>
                            <input type="time" value={formData.patient.arrivalTime} onChange={(e) => handlePatientChange('arrivalTime', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-3 outline-none text-base text-center" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Statusas</label>
                          <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-3 outline-none text-base">{Object.values(PatientStatus).map(status => (<option key={status} value={status}>{status}</option>))}</select>
                        </div>
                        <div className="col-span-2">
                          <div className="flex justify-between items-center mb-1"><label className="block text-xs font-medium text-slate-500 uppercase">Gydytojas</label><button type="button" onClick={calculateArpaSuggestions} className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-900/20 px-2 py-1 rounded"><Sparkles size={12} /> Siūlyti (ARPA)</button></div>
                          <select value={formData.assignedDoctorId || ''} onChange={(e) => handleChange('assignedDoctorId', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-3 outline-none text-base"><option value="">--</option>{activeDoctors.map(doc => (<option key={doc.id} value={doc.id}>{doc.name}</option>))}</select>
                        </div>
                      </div>

                    </div>
                  </div>


                  {/* Full Width Row for Symptoms and Allergies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">Simptomai</label>
                        <button type="button" onClick={() => toggleDictation('symptoms', formData.patient?.symptoms || '', (t) => handlePatientChange('symptoms', t))} className={`p-1.5 rounded-full transition-all ${listeningField === 'symptoms' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-800'}`} title="Balsinis įvedimas">
                          {listeningField === 'symptoms' ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>
                      </div>
                      <input type="text" value={formData.patient.symptoms} onChange={(e) => handlePatientChange('symptoms', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none text-base" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 h-[26px]">
                        <label className="block text-xs font-medium text-slate-500 uppercase text-red-400">Alergijos</label>
                      </div>
                      <input type="text" value={formData.patient.allergies || ''} onChange={(e) => handlePatientChange('allergies', e.target.value)} className="w-full bg-slate-900 border border-red-900/30 text-red-200 rounded-lg px-4 py-3 outline-none text-base placeholder-red-900/30" placeholder="Nėra" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-slate-500 uppercase">Komentarai</label>
                      <button type="button" onClick={() => toggleDictation('comment', formData.comment || '', (t) => handleChange('comment', t))} className={`p-1.5 rounded-full transition-all ${listeningField === 'comment' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-800'}`} title="Balsinis įvedimas">
                        {listeningField === 'comment' ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    </div>
                    <textarea rows={3} value={formData.comment || ''} onChange={(e) => handleChange('comment', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none text-base" />
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Paskirti veiksmą</h3>
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                      <button type="button" onClick={() => addAction('LABS', 'Kraujo tyrimai')} className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm flex gap-2 whitespace-nowrap"><Microscope size={16} className="text-blue-400" /> Kraujas</button>
                      <button type="button" onClick={() => addAction('XRAY', 'Rentgenas')} className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm flex gap-2 whitespace-nowrap"><FileImage size={16} className="text-yellow-400" /> Rentgenas</button>
                      <button type="button" onClick={() => addAction('CT', 'KT')} className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm flex gap-2 whitespace-nowrap"><Activity size={16} className="text-purple-400" /> KT</button>
                      <button type="button" onClick={() => addAction('EKG', 'EKG')} className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm flex gap-2 whitespace-nowrap"><HeartPulse size={16} className="text-red-400" /> EKG</button>
                      <button type="button" onClick={() => addAction('ULTRASOUND', 'Ultragarsas')} className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm flex gap-2 whitespace-nowrap"><Waves size={16} className="text-cyan-400" /> UG</button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select value={newActionType} onChange={(e) => setNewActionType(e.target.value as ActionType)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-base outline-none flex-1"><option value="LABS">Tyrimai</option><option value="XRAY">Rentgenas</option><option value="CT">KT</option><option value="EKG">EKG</option><option value="ULTRASOUND">UG</option><option value="CONSULT">Konsultacija</option><option value="OTHER">Kita</option></select>
                        <input type="time" value={newActionTime} onChange={(e) => setNewActionTime(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-base outline-none w-24 text-center" />
                      </div>
                      <div className="flex gap-2 flex-1">
                        <input type="text" placeholder="Aprašymas" value={newActionName} onChange={(e) => setNewActionName(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-base outline-none" />
                        <button type="button" onClick={() => newActionName && addAction(newActionType, newActionName)} className="bg-blue-600 px-4 rounded-lg text-white"><Plus size={20} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formData.patient.actions?.map(action => (
                      <div key={action.id} className={`flex items-center justify-between p-4 rounded-xl border ${action.isCompleted ? 'bg-green-900/10 border-green-900/30' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={() => toggleAction(action.id)} className={`w-6 h-6 rounded border flex items-center justify-center transition ${action.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500'}`}>{action.isCompleted && <CheckCircle size={16} />}</button>
                          <div><div className={`font-medium text-base ${action.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{action.name}</div><div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{action.type}</div></div>
                        </div>
                        <button onClick={() => removeAction(action.id)} className="text-slate-600 hover:text-red-400 p-2"><X size={20} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="space-y-6">
                  {!isNurse && (
                    <div className="space-y-4">
                      {/* Top 10 Horizontal Scroll */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase text-slate-500 font-bold block tracking-wider">Mano Dažniausi (Top 10)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right">
                          {personalizedTopMeds.map((drug) => (
                            <button key={drug.id} type="button" onClick={() => selectMedication(drug)} className="shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition flex items-center gap-1.5 whitespace-nowrap"><span className="font-medium text-slate-200">{drug.name}</span>{drug.dose && <span className="text-slate-500 border-l border-slate-700 pl-1.5">{drug.dose}</span>}</button>
                          ))}
                        </div>
                      </div>

                      {/* Presets Section (Combinations & Protocols) */}
                      <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="w-full flex justify-between items-center p-3 hover:bg-slate-900/50 transition-colors border-b border-slate-900/50 cursor-pointer" onClick={() => setIsPresetsOpen(!isPresetsOpen)}>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2"><Package size={14} /> Išsaugoti Rinkiniai</h3>
                            <div className="flex items-center gap-2">
                              {isPresetsOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                            </div>
                          </div>

                          {/* Header Controls: Edit & Create New */}
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            {/* Create New UI in Header */}
                            {isPresetsOpen && onSaveCombination && (
                              <div className="flex items-center">
                                {isSavingCombo ? (
                                  <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <span className="text-[10px] text-slate-500 mr-1 hidden sm:inline">Pavadinimas:</span>
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder="..."
                                      value={comboName}
                                      onChange={(e) => setComboName(e.target.value)}
                                      className="bg-slate-800 border border-purple-500/50 rounded px-2 py-0.5 text-[11px] text-purple-200 outline-none w-24 sm:w-32"
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCurrentCombination(); if (e.key === 'Escape') { setIsSavingCombo(false); setComboName(''); } }}
                                    />
                                    <button type="button" onClick={handleSaveCurrentCombination} className="p-0.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30"><CheckCircle size={14} /></button>
                                    <button type="button" onClick={() => { setIsSavingCombo(false); setComboName(''); }} className="p-0.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700"><X size={14} /></button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => setIsSavingCombo(true)} className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-900/10 px-2 py-0.5 rounded border border-purple-900/20 transition-all hover:bg-purple-900/20">
                                    <Plus size={10} /> <span className="hidden sm:inline">Kurti</span> Rinkinį
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Edit Mode Toggle */}
                            {medicationCombinations && medicationCombinations.length > 0 && isPresetsOpen && (
                              <button
                                type="button"
                                onClick={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded transition-colors ${isDeleteConfirmOpen ? 'bg-red-900/30 text-red-400' : 'text-slate-600 hover:text-slate-400'}`}
                              >
                                {isDeleteConfirmOpen ? 'Baigti' : 'Redaguoti'}
                              </button>
                            )}
                          </div>
                        </div>

                        {isPresetsOpen && (
                          <div className="p-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Saved Combinations - Compact Chips */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {medicationCombinations?.map((combo, idx) => (
                                <div key={`combo-${idx}`} className={`flex items-center bg-purple-900/20 border ${isDeleteConfirmOpen ? 'border-red-900/50 animate-pulse' : 'border-purple-800/30'} rounded-md overflow-hidden group hover:border-purple-600/50 transition-colors`}>
                                  <button type="button" onClick={() => applyProtocol(combo)} className="px-2 py-1 text-[11px] font-bold text-purple-300 transition hover:bg-purple-900/30 flex items-center gap-1"><Sparkles size={10} /> {combo.name}</button>
                                  {onDeleteCombination && isDeleteConfirmOpen && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setComboToDelete(combo.id);
                                      }}
                                      className="px-1.5 py-1 bg-red-900/20 text-red-400 hover:text-white hover:bg-red-600 transition-colors border-l border-purple-800/30 h-full flex items-center justify-center"
                                      title="Ištrinti"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {medicationCombinations?.length === 0 && <span className="text-[10px] text-slate-600 italic">Nėra išsaugotų derinių</span>}
                            </div>

                            {/* Protocols - Compact List */}
                            <div className="flex flex-wrap gap-1.5">
                              {protocols.map((protocol) => (
                                <button key={protocol.id} type="button" onClick={() => applyProtocol(protocol)} className="px-2 py-1 bg-blue-900/20 hover:bg-blue-800/40 border border-blue-800/30 rounded-md text-[11px] font-bold text-blue-300 transition uppercase tracking-wide opacity-80 hover:opacity-100">{protocol.name}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-800"></div></div>
                        <div className="relative flex justify-center"><span className="bg-slate-900 px-2 text-xs text-slate-500 font-medium uppercase tracking-widest">Naujas Paskyrimas</span></div>
                      </div>

                      {/* Inline Warning */}
                      {inlineWarning && (
                        <div className="mb-3 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
                            <span className="text-sm text-yellow-200">{inlineWarning.text}</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setInlineWarning(null)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors">Atšaukti</button>
                            <button type="button" onClick={() => {
                              if (inlineWarning.type === 'PROTOCOL') applyProtocol(inlineWarning.data, true);
                              else addMedication(inlineWarning.data.name, inlineWarning.data.dose, inlineWarning.data.route, true);
                            }} className="px-3 py-1.5 text-xs font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded transition-colors shadow-lg shadow-yellow-900/20">Pridėti vis tiek</button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 items-end mb-3">
                        <div className="flex-1 w-full relative">
                          <input type="text" placeholder={isCompoundMode ? "Vaistas 1 + Vaistas 2 + ..." : "Vaistas"} className={`w-full bg-slate-800 border ${isCompoundMode ? 'border-purple-500/50' : 'border-slate-700'} rounded-lg px-3 py-2.5 text-base outline-none focus:border-blue-500 transition-colors`} value={newMedName} onChange={(e) => { setNewMedName(e.target.value); setShowSuggestions(true); }} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
                          {showSuggestions && newMedName && filteredSuggestions.length > 0 && (<ul className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">{filteredSuggestions.map((med) => { const syn = getMatchedSynonym(med.name, newMedName); return (<li key={med.id} onMouseDown={(e) => { e.preventDefault(); selectMedication(med); }} className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-700/50"><div className="flex justify-between"><span className="font-medium text-slate-200">{med.name}</span>{syn && <span className="text-xs text-blue-400 font-mono">({syn})</span>}</div><div className="text-xs text-slate-500">{med.dose} • {med.route}</div></li>); })}</ul>)}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <div className="w-24 sm:w-20"><input type="text" placeholder="Dozė" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2.5 text-base outline-none text-center" value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} /></div>
                          <div className="w-24 sm:w-20"><select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2.5 text-base outline-none" value={newMedRoute} onChange={(e) => setNewMedRoute(e.target.value)}><option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option><option value="SC">SC</option></select></div>
                          <button type="button" onClick={() => addMedication()} className="bg-blue-600 text-white p-2.5 rounded-lg flex-1 sm:flex-none flex justify-center" disabled={!newMedName}><Plus size={24} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" checked={enableReminder} onChange={(e) => setEnableReminder(e.target.checked)} className="rounded bg-slate-800 w-4 h-4" /> <Clock size={16} className="text-yellow-500" /> Priminti po:</label>{enableReminder && (<div className="flex items-center gap-1"><input type="number" min="1" value={reminderHours} onChange={(e) => setReminderHours(Math.max(1, parseInt(e.target.value) || 1))} className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-sm text-center" /><span className="text-xs text-slate-500">val.</span></div>)}
                        <div className="flex-1"></div>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer text-purple-200 font-medium" title="Leidžia sudėti kelis vaistus į vieną eilutę"><input type="checkbox" checked={isCompoundMode} onChange={(e) => setIsCompoundMode(e.target.checked)} className="rounded bg-slate-800 w-4 h-4 accent-purple-500" /> Mix (Sudėtinis)</label>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {formData.patient.medications?.map((med) => (
                      <div key={med.id} className={`flex items-center justify-between p-2 pl-3 rounded-lg border gap-3 ${med.status === MedicationStatus.GIVEN ? 'bg-green-950/20 border-green-900/30' : med.status === MedicationStatus.CANCELLED ? 'bg-slate-900 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700'} hover:border-slate-600 transition-colors`}>
                        <div className="flex-1 flex items-center gap-3 overflow-hidden">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${med.status === MedicationStatus.GIVEN ? 'bg-green-500' : med.status === MedicationStatus.PENDING ? 'bg-yellow-500' : 'bg-slate-600'}`}></div>
                          <div className="flex items-baseline gap-2 truncate">
                            <span className={`font-bold text-sm ${med.status === MedicationStatus.GIVEN ? 'text-green-400' : med.status === MedicationStatus.CANCELLED ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{med.name}</span>
                            <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-mono border border-slate-700/50">{med.dose} {med.route}</span>
                          </div>
                          <div className="hidden sm:block text-[10px] text-slate-600">
                            {new Date(med.orderedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {doctors.find(d => d.id === med.orderedBy)?.name.split(' ')[0]}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {med.status === MedicationStatus.PENDING && (
                            <>
                              <button type="button" onClick={() => requestMedStatusChange(med, MedicationStatus.GIVEN)} className="p-1.5 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white rounded transition-colors" title="Suleisti"><CheckCircle size={16} /></button>
                              {!isNurse && <button type="button" onClick={() => requestMedStatusChange(med, MedicationStatus.CANCELLED)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors" title="Atšaukti"><XCircle size={16} /></button>}
                            </>
                          )}
                          {!isNurse && med.status !== MedicationStatus.CANCELLED && (
                            <button type="button" onClick={() => addMedication(med.name, med.dose, med.route)} className="p-1.5 text-blue-400 hover:bg-blue-900/20 rounded hover:text-blue-300 transition-colors" title="Kartoti"><RotateCcw size={16} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer for bottom bar safe area */}
              <div className="h-16"></div>

              <div className="absolute bottom-0 left-0 right-0 bg-slate-900 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-800 flex justify-between items-center z-10">
                {formData.patient ? (isDeleteConfirmOpen ? (<div className="flex items-center gap-2 w-full"><span className="text-xs font-bold text-red-400 hidden sm:inline">Tikrai atlaisvinti?</span><button type="button" onClick={handleConfirmClear} className="flex-1 sm:flex-none px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm">TAIP</button><button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 sm:flex-none px-4 py-3 bg-slate-700 text-slate-200 rounded-xl text-sm">NE</button></div>) : (<button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="flex items-center justify-center gap-2 text-red-400 px-3 py-2 rounded-xl hover:bg-red-900/10"><Trash2 size={20} /> <span className="hidden sm:inline pt-0.5">Atlaisvinti</span></button>)) : (<div></div>)}
                <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/40 text-base"><CheckCircle size={20} /> Išsaugoti</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div >
  );
};

export default EditPatientModal;
