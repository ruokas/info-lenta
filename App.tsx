
import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, List, Activity, Users, Settings, Bell, Search, Menu, BarChart3, Filter, FileText, Stethoscope, LogOut, ChevronDown, User as UserIcon, X, Check, Trash2, Briefcase, UserPlus, FileBarChart, LayoutDashboard, ClipboardList } from 'lucide-react';
import BedTableView from './components/BedTableView';
import BedMapView from './components/BedMapView';
import EditPatientModal from './components/EditPatientModal';
import SettingsView from './components/SettingsView';
import PatientLogView from './components/PatientLogView';
import ShiftManagerView from './components/ShiftManagerView';
import LoginView from './components/LoginView';
import TriageModal from './components/TriageModal';
import ReportsView from './components/ReportsView';
import AdminDashboardView from './components/AdminDashboardView';
import TasksView from './components/TasksView'; // NEW IMPORT
import { DataService } from './services/DataService';
import { Bed, PatientStatus, Staff, PatientLogEntry, UserProfile, AppNotification, TriageCategory, MedicationStatus, MedicationItem, AssignmentLog, WorkShift, RegistrationLog, Patient } from './types';
import { INITIAL_BEDS, DOCTORS, NURSES, INITIAL_MEDICATIONS, PHYSICAL_SECTIONS } from './constants';

const App: React.FC = () => {
  const [doctors, setDoctors] = useState<Staff[]>(DOCTORS);
  const [nurses, setNurses] = useState<Staff[]>(NURSES);
  const [medicationBank, setMedicationBank] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
  const [beds, setBeds] = useState<Bed[]>(INITIAL_BEDS);
  const [patientLog, setPatientLog] = useState<PatientLogEntry[]>([]);
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLog[]>([]);
  const [registrationLogs, setRegistrationLogs] = useState<RegistrationLog[]>([]); 
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('er_auto_refresh');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('er_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Updated viewMode type
  const [viewMode, setViewMode] = useState<'table' | 'map' | 'settings' | 'log' | 'shift' | 'reports' | 'admin_dashboard' | 'tasks'>('table');
  const [activeTab, setActiveTab] = useState<'general' | 'ambulatory'>('general');
  
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PatientStatus | 'ALL'>('ALL');
  const [filterNurse, setFilterNurse] = useState<string>('ALL');
  const [filterDoctor, setFilterDoctor] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Migration helper
  const migrateBedSections = (beds: Bed[]) => {
    const map: Record<string, string> = {
      'Aušra': '1 Postas',
      'Deimantė': '2 Postas',
      'Kristina M.': '3 Postas',
      'Armanda': '4 Postas',
      'Kristina A.': '5 Postas',
      'Ambulatorinis (2 slaug.)': 'Ambulatorija'
    };
    
    let changed = false;
    const newBeds = beds.map(b => {
      if (map[b.section]) {
        changed = true;
        return { ...b, section: map[b.section] };
      }
      return b;
    });
    
    return changed ? newBeds : beds;
  };

  useEffect(() => {
    const loadData = async () => {
      let loadedBeds = await DataService.fetchBeds();
      
      const migratedBeds = migrateBedSections(loadedBeds);
      if (JSON.stringify(migratedBeds) !== JSON.stringify(loadedBeds)) {
          loadedBeds = migratedBeds;
          DataService.saveBeds(loadedBeds);
      }
      setBeds(loadedBeds);

      const loadedDoctors = await DataService.fetchStaff('doctors');
      const sanitizedDocs: Staff[] = loadedDoctors.map(d => ({ ...d, isActive: d.isActive !== undefined ? d.isActive : true }));
      setDoctors(sanitizedDocs);

      let loadedNurses = await DataService.fetchStaff('nurses');
      let sanitizedNurses: Staff[] = loadedNurses.map(n => ({ ...n, isActive: n.isActive !== undefined ? n.isActive : true }));
      
      if (!sanitizedNurses.some(n => n.assignedSection === 'Triažas')) {
          const triageNurse: Staff = { 
              id: 'n_triage_auto', 
              name: 'Triažo Slaug.', 
              role: 'Nurse', 
              assignedSection: 'Triažas', 
              isActive: true 
          };
          sanitizedNurses = [...sanitizedNurses, triageNurse];
          DataService.saveStaff('nurses', sanitizedNurses); 
      }

      setNurses(sanitizedNurses);

      const loadedMeds = await DataService.fetchMedications();
      setMedicationBank(loadedMeds);

      const loadedLogs = await DataService.fetchLogs();
      setPatientLog(loadedLogs);
      
      const savedAssigns = localStorage.getItem('er_assignment_logs');
      if (savedAssigns) setAssignmentLogs(JSON.parse(savedAssigns));

      const savedShifts = localStorage.getItem('er_work_shifts');
      if (savedShifts) setWorkShifts(JSON.parse(savedShifts));
      
      const savedRegLogs = localStorage.getItem('er_registration_logs');
      if (savedRegLogs) setRegistrationLogs(JSON.parse(savedRegLogs));
    };
    loadData();
  }, []);

  useEffect(() => {
    const { unsubscribe } = DataService.subscribeToBeds((updatedBeds) => {
      setBeds(updatedBeds);
      setLastUpdated(new Date());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('er_work_shifts', JSON.stringify(workShifts));
    
    const checkShifts = () => {
        const now = new Date().getTime();
        let updated = false;
        
        const newDoctors: Staff[] = doctors.map(doc => {
            const shift = workShifts.find(s => s.doctorId === doc.id);
            if (!shift) return doc; 
            
            const start = new Date(shift.start).getTime();
            const end = new Date(shift.end).getTime();
            const isActive = now >= start && now < end;
            
            if (doc.isActive !== isActive || doc.currentShiftId !== shift.id) {
                updated = true;
                return { ...doc, isActive, currentShiftId: shift.id };
            }
            return doc;
        });

        if (updated) {
            setDoctors(newDoctors);
            DataService.saveStaff('doctors', newDoctors);
        }
    };

    checkShifts();
    const interval = setInterval(checkShifts, 60000); 
    return () => clearInterval(interval);
  }, [workShifts, doctors]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addNotification = (type: AppNotification['type'], message: string, bedId?: string) => {
    const newNotif: AppNotification = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      timestamp: new Date(),
      isRead: false,
      bedId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const checkOverduePatients = () => {
    const now = new Date();
    beds.forEach(bed => {
      if (bed && bed.patient && bed.status !== PatientStatus.EMPTY) {
        const [hours, minutes] = bed.patient.arrivalTime.split(':').map(Number);
        const arrivalDate = new Date();
        arrivalDate.setHours(hours, minutes, 0, 0);
        let diff = now.getTime() - arrivalDate.getTime();
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        const diffMinutes = Math.floor(diff / 60000);

        if (diffMinutes > 240) {
          const msg = `Pacientas ${bed.patient.name} (Lova ${bed.label}) skyriuje > 4 val.`;
          const alreadyNotified = notifications.some(n => n.message === msg && !n.isRead);
          
          if (!alreadyNotified) {
            addNotification('WARNING', msg, bed.id);
          }
        }
      }
    });
  };

  const checkMedicationReminders = () => {
    const now = new Date();
    beds.forEach(bed => {
       if (bed && bed.patient && bed.patient.medications) {
          bed.patient.medications.forEach(med => {
             if (med.status === MedicationStatus.PENDING && med.reminderAt) {
                const reminderTime = new Date(med.reminderAt);
                if (now >= reminderTime) {
                   const msg = `PRIMINIMAS: Laikas suleisti vaistus (${med.name}) pacientui ${bed.patient?.name} (Lova ${bed.label})`;
                   const alreadyNotified = notifications.some(n => n.message === msg && !n.isRead);
                   if (!alreadyNotified) {
                      addNotification('WARNING', msg, bed.id);
                   }
                }
             }
          });
       }
    });
  };

  const updateDoctors = (newDocs: Staff[]) => {
    setDoctors(newDocs);
    DataService.saveStaff('doctors', newDocs);
  };

  const updateNurses = (newNurses: Staff[]) => {
    setNurses(newNurses);
    DataService.saveStaff('nurses', newNurses);
  };

  const updateMedications = (newMeds: MedicationItem[]) => {
    setMedicationBank(newMeds);
    DataService.saveMedications(newMeds);
  };

  useEffect(() => { localStorage.setItem('er_auto_refresh', JSON.stringify(autoRefresh)); }, [autoRefresh]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        setLastUpdated(new Date());
        checkOverduePatients();
        checkMedicationReminders();
      }, 60000);
    }
    return () => clearInterval(intervalId);
  }, [autoRefresh, beds, notifications]);

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    setIsModalOpen(true);
  };

  const calculateDurationString = (arrivalTime: string) => {
    const now = new Date();
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const arrivalDate = new Date();
    arrivalDate.setHours(hours, minutes, 0, 0);
    let diff = now.getTime() - arrivalDate.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    const diffMinutes = Math.floor(diff / 60000);
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}h ${m}m`;
  };

  // Triage Registration Logic
  const handleTriageRegistration = async (data: { name: string; symptoms: string; triageCategory: TriageCategory; bedId: string; assignedDoctorId?: string }) => {
    const bedIndex = beds.findIndex(b => b.id === data.bedId);
    if (bedIndex === -1 || !currentUser) return;

    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        name: data.name,
        symptoms: data.symptoms,
        triageCategory: data.triageCategory,
        arrivalTime: timeString,
        registeredBy: currentUser.id,
        medications: [],
        actions: [],
        vitals: { lastUpdated: now.toISOString() }
    };

    const updatedBed: Bed = {
        ...beds[bedIndex],
        status: PatientStatus.WAITING_EXAM,
        patient: newPatient,
        assignedDoctorId: data.assignedDoctorId 
    };

    const newRegLog: RegistrationLog = {
        id: `reg-${Date.now()}`,
        nurseId: currentUser.id,
        patientName: data.name,
        triageCategory: data.triageCategory,
        timestamp: now.toISOString()
    };
    
    const updatedRegLogs = [...registrationLogs, newRegLog];
    setRegistrationLogs(updatedRegLogs);
    localStorage.setItem('er_registration_logs', JSON.stringify(updatedRegLogs));

    await handleSaveBed(updatedBed);
    setIsTriageModalOpen(false);
    addNotification('SUCCESS', `Pacientas ${data.name} sėkmingai užregistruotas (Lova ${updatedBed.label})`, updatedBed.id);
  };

  const handleSaveBed = async (updatedBed: Bed) => {
    let newLogs = [...patientLog];
    const oldBed = beds.find(b => b.id === updatedBed.id);

    if (updatedBed.patient && updatedBed.patient.triageCategory === TriageCategory.IMMEDIATE) {
       if (!oldBed?.patient || oldBed.patient.triageCategory !== TriageCategory.IMMEDIATE) {
          addNotification('ALERT', `SKUBU: Naujas 1 kat. pacientas Lovoje ${updatedBed.label}`, updatedBed.id);
       }
    }
    if (currentUser && updatedBed.assignedDoctorId === currentUser.id) {
       if (oldBed?.assignedDoctorId !== currentUser.id) {
          addNotification('INFO', `Jums priskirtas naujas pacientas: Lova ${updatedBed.label}`, updatedBed.id);
       }
    }
    const oldMeds = oldBed?.patient?.medications || [];
    const newMeds = updatedBed.patient?.medications || [];
    if (newMeds.length > oldMeds.length) {
       const latestMed = newMeds[newMeds.length - 1];
       addNotification('INFO', `Naujas paskyrimas lovoje ${updatedBed.label}: ${latestMed.name}`, updatedBed.id);
    }

    if (updatedBed.patient && updatedBed.assignedDoctorId && updatedBed.status !== PatientStatus.EMPTY) {
        const isNewAssignment = 
            (oldBed?.assignedDoctorId !== updatedBed.assignedDoctorId) || 
            (oldBed?.patient?.id !== updatedBed.patient.id);
        
        if (isNewAssignment) {
            const newLog: AssignmentLog = {
                id: `assign-${Date.now()}`,
                doctorId: updatedBed.assignedDoctorId,
                patientName: updatedBed.patient.name,
                triageCategory: updatedBed.patient.triageCategory,
                assignedAt: new Date().toISOString()
            };
            const updatedAssignments = [...assignmentLogs, newLog];
            setAssignmentLogs(updatedAssignments);
            localStorage.setItem('er_assignment_logs', JSON.stringify(updatedAssignments));
        }
    }

    const newBeds = beds.map(b => b.id === updatedBed.id ? updatedBed : b);
    setBeds(newBeds);
    
    if (oldBed?.patient && (!updatedBed.patient || updatedBed.status === PatientStatus.EMPTY)) {
      const docName = doctors.find(d => d.id === oldBed.assignedDoctorId)?.name;
      
      const logEntry: PatientLogEntry = {
        id: `log-${Date.now()}`,
        patientName: oldBed.patient.name,
        symptoms: oldBed.patient.symptoms,
        triageCategory: oldBed.patient.triageCategory,
        arrivalTime: oldBed.patient.arrivalTime,
        dischargeTime: new Date().toISOString(),
        totalDuration: calculateDurationString(oldBed.patient.arrivalTime),
        treatedByDoctorName: docName,
        finalStatus: oldBed.status,
        allergies: oldBed.patient.allergies,
        medications: oldBed.patient.medications,
        actions: oldBed.patient.actions
      };
      
      newLogs = [logEntry, ...newLogs];
      setPatientLog(newLogs);
      DataService.saveLogs(newLogs);
    }

    await DataService.saveBeds(newBeds);
    
    setIsModalOpen(false);
    setSelectedBed(null);
  };

  const handleQuickStatusChange = (bed: Bed, newStatus: PatientStatus) => {
    const updatedBed: Bed = {
      ...bed,
      status: newStatus
    };
    handleSaveBed(updatedBed);
  };

  const handleQuickDischarge = async (bed: Bed) => {
    if (!bed.patient) return;
    
    const updatedBed: Bed = {
      ...bed,
      patient: undefined,
      status: PatientStatus.EMPTY,
      comment: '',
      assignedDoctorId: undefined
    };
    await handleSaveBed(updatedBed);
    addNotification('SUCCESS', `Pacientas išrašytas iš lovos ${bed.label}`);
  };

  const handleResetData = async () => {
    setDoctors(DOCTORS);
    setNurses(NURSES);
    setMedicationBank(INITIAL_MEDICATIONS);
    setBeds(INITIAL_BEDS);
    setPatientLog([]);
    setAssignmentLogs([]);
    setWorkShifts([]);
    setRegistrationLogs([]); 
    setNotifications([]);
    setAutoRefresh(true);
    localStorage.clear();
    await DataService.saveBeds(INITIAL_BEDS);
    await DataService.saveStaff('doctors', DOCTORS);
    await DataService.saveStaff('nurses', NURSES);
    await DataService.saveMedications(INITIAL_MEDICATIONS);
    await DataService.saveLogs([]);
    window.location.reload(); 
  };

  const handleMovePatient = async (fromBedId: string, toBedId: string) => {
    if (fromBedId === toBedId) return;

    const newBeds = [...beds];
    const fromIndex = newBeds.findIndex(b => b.id === fromBedId);
    const toIndex = newBeds.findIndex(b => b.id === toBedId);

    if (fromIndex === -1 || toIndex === -1) return;

    const fromBed = newBeds[fromIndex];
    const toBed = newBeds[toIndex];

    if (fromBed.status === PatientStatus.EMPTY && !fromBed.patient) return;

    const tempPatient = fromBed.patient;
    const tempStatus = fromBed.status;
    const tempDoctor = fromBed.assignedDoctorId;
    const tempComment = fromBed.comment;

    newBeds[fromIndex] = {
      ...fromBed,
      patient: toBed.patient,
      status: toBed.status,
      assignedDoctorId: toBed.assignedDoctorId,
      comment: toBed.comment
    };

    newBeds[toIndex] = {
      ...toBed,
      patient: tempPatient,
      status: tempStatus,
      assignedDoctorId: tempDoctor,
      comment: tempComment
    };

    setBeds(newBeds);
    await DataService.saveBeds(newBeds);
    addNotification('INFO', `Pacientas perkeltas iš ${fromBed.label} į ${toBed.label}`);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('er_current_user', JSON.stringify(user));
    if (user.role === 'Admin') {
        setViewMode('admin_dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('er_current_user');
    setViewMode('table'); 
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const filteredBeds = beds.filter(bed => {
    if (!bed) return false;
    
    const isAmbulatory = bed.section === 'Ambulatorija';
    if (activeTab === 'general' && isAmbulatory) return false;
    if (activeTab === 'ambulatory' && !isAmbulatory) return false;

    if (filterStatus !== 'ALL' && bed.status !== filterStatus) return false;
    
    if (filterNurse !== 'ALL') {
        const selectedNurse = nurses.find(n => n.name === filterNurse);
        if (selectedNurse && selectedNurse.assignedSection) {
             if (bed.section !== selectedNurse.assignedSection) return false;
        } else {
             return false;
        }
    }
    
    if (filterDoctor !== 'ALL' && bed.assignedDoctorId !== filterDoctor) return false;
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const doctorName = doctors.find(d => d.id === bed.assignedDoctorId)?.name.toLowerCase() || '';
    return (
      (bed.patient?.name.toLowerCase().includes(lowerQuery) || false) ||
      bed.label.toLowerCase().includes(lowerQuery) ||
      bed.section.toLowerCase().includes(lowerQuery) ||
      doctorName.includes(lowerQuery)
    );
  });

  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter(b => b && b.status !== PatientStatus.EMPTY).length;
  const criticalPatients = beds.filter(b => b && b.patient && b.patient.triageCategory <= 2).length;
  const waitingPatients = beds.filter(b => b && b.status === PatientStatus.WAITING_EXAM).length;
  const unreadCount = notifications.length;

  const generalOccupied = beds.filter(b => b && b.section !== 'Ambulatorija' && b.status !== PatientStatus.EMPTY).length;
  const ambulatoryOccupied = beds.filter(b => b && b.section === 'Ambulatorija' && b.status !== PatientStatus.EMPTY).length;

  const isTriageMode = currentUser && currentUser.assignedSection === 'Triažas';
  const isAdmin = currentUser && currentUser.role === 'Admin';

  if (!currentUser) {
    return <LoginView doctors={doctors} nurses={nurses} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans">
      <aside className="w-full md:w-20 lg:w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-all duration-300 border-r border-slate-800">
        <div className="h-16 flex items-center px-4 md:justify-center lg:justify-start gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Activity size={24} />
          </div>
          <h1 className="font-bold text-slate-100 text-lg hidden lg:block tracking-tight">ER Flow Manager</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {isAdmin && (
            <button 
                onClick={() => setViewMode('admin_dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'admin_dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
            >
                <LayoutDashboard size={20} />
                <span className="hidden lg:block font-medium">Dashboard</span>
            </button>
          )}

          <button 
            onClick={() => setViewMode('table')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <List size={20} />
            <span className="hidden lg:block font-medium">Sąrašas</span>
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <LayoutGrid size={20} />
            <span className="hidden lg:block font-medium">Žemėlapis</span>
          </button>

          {/* New Tasks Button */}
          <button 
            onClick={() => setViewMode('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <ClipboardList size={20} />
            <span className="hidden lg:block font-medium">Užduotys</span>
          </button>

           <button 
            onClick={() => setViewMode('log')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'log' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <FileText size={20} />
            <span className="hidden lg:block font-medium">Pacientų istorija</span>
          </button>

           <button 
            onClick={() => setViewMode('shift')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'shift' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <Briefcase size={20} />
            <span className="hidden lg:block font-medium">Pamainos valdymas</span>
          </button>

          <button 
            onClick={() => setViewMode('reports')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${viewMode === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}`}
          >
            <FileBarChart size={20} />
            <span className="hidden lg:block font-medium">Ataskaitos</span>
          </button>
          
          <div className="my-4 border-t border-slate-800"></div>
          
          <div className="hidden lg:block">
            <div className="flex items-center gap-2 px-3 mb-3 text-slate-500">
               <BarChart3 size={16} />
               <h3 className="text-xs uppercase font-bold">Skyriaus statistika</h3>
            </div>
            
            <div className="px-3 space-y-4">
               <div className="space-y-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Užimta (Viso)</span>
                      <span className="text-blue-400 font-bold">{occupiedBedsCount}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${(occupiedBedsCount / totalBedsCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50 mt-2">
                      <div className="bg-slate-900/50 p-2 rounded">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Salė</div>
                          <div className="text-lg font-bold text-blue-400">{generalOccupied}</div>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Amb</div>
                          <div className="text-lg font-bold text-amber-500">{ambulatoryOccupied}</div>
                      </div>
                  </div>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-sm items-center p-2 rounded hover:bg-slate-800/50 transition">
                    <span className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                      Kritiniai
                    </span>
                    <span className="font-bold text-slate-200">{criticalPatients}</span>
                 </div>
                 <div className="flex justify-between text-sm items-center p-2 rounded hover:bg-slate-800/50 transition">
                     <span className="flex items-center gap-2 text-slate-400">
                       <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                       Laukia apž.
                     </span>
                    <span className="font-bold text-slate-200">{waitingPatients}</span>
                 </div>
               </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setViewMode('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${viewMode === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Settings size={20} />
            <span className="hidden lg:block">Nustatymai</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
           
           <div className="flex items-center gap-4 w-full max-w-5xl">
             
             {isTriageMode ? (
                <div className="flex-1 flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                    <button 
                        onClick={() => setIsTriageModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 transform hover:scale-105 transition"
                    >
                        <UserPlus size={20} />
                        NAUJAS PACIENTAS (TRIAŽAS)
                    </button>
                    <div className="h-8 w-px bg-slate-800 mx-2"></div>
                    <div className="bg-slate-800 px-3 py-1 rounded text-slate-300 text-sm font-medium border border-blue-500/30">
                        Jūsų postas: <span className="text-blue-400 font-bold">Triažas</span>
                    </div>
                </div>
             ) : (
                <>
                    <div className="relative w-full max-w-xs lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                        type="text" 
                        placeholder="Ieškoti paciento, lovos, gydytojo..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm placeholder:text-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative w-40 lg:w-48 hidden sm:block">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as PatientStatus | 'ALL')}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none cursor-pointer"
                        >
                        <option value="ALL">Visi statusai</option>
                        {Object.values(PatientStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                        </select>
                    </div>

                    <div className="relative w-40 lg:w-48 hidden md:block">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select 
                        value={filterNurse}
                        onChange={(e) => setFilterNurse(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none cursor-pointer"
                        >
                        <option value="ALL">Visi postai</option>
                        {nurses.map(nurse => (
                            <option key={nurse.id} value={nurse.name}>{nurse.name}</option>
                        ))}
                        </select>
                    </div>

                    <div className="relative w-40 lg:w-48 hidden lg:block">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select 
                        value={filterDoctor}
                        onChange={(e) => setFilterDoctor(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none cursor-pointer"
                        >
                        <option value="ALL">Visi gydytojai</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                        </select>
                    </div>
                </>
             )}
           </div>

           <div className="flex items-center gap-4">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                   <Bell size={20} />
                   {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                   )}
                </button>
                
                {isNotifOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/50">
                      <h3 className="font-semibold text-sm text-slate-200">Pranešimai</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={clearAllNotifications}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Išvalyti visus
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                          <Bell size={24} className="mx-auto mb-2 opacity-50" />
                          Nėra naujų pranešimų
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition group relative">
                             <div className="flex gap-3">
                                <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${notif.type === 'ALERT' ? 'bg-red-500' : notif.type === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                <div className="flex-1">
                                   <p className="text-sm text-slate-200 leading-tight">{notif.message}</p>
                                   <p className="text-[10px] text-slate-500 mt-1">{notif.timestamp.toLocaleTimeString()}</p>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                                  className="text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X size={14} />
                                </button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 hover:bg-slate-800 pl-1 pr-3 py-1 rounded-full transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-900/50">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-800">
                      <p className="font-semibold text-slate-200">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{currentUser.role === 'Assistant' ? 'Administrator' : currentUser.role}</p>
                      {currentUser.assignedSection && (
                        <p className="text-[10px] text-blue-400 mt-0.5">Postas: {currentUser.assignedSection}</p>
                      )}
                    </div>
                    <div className="p-1">
                      {isAdmin && (
                        <button 
                            onClick={() => { setViewMode('admin_dashboard'); setIsUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition"
                        >
                            <LayoutDashboard size={14} /> Dashboard
                        </button>
                      )}
                      <button 
                        onClick={() => { setViewMode('settings'); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition"
                      >
                         <Settings size={14} /> Nustatymai
                      </button>
                      <button 
                        onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition mt-1"
                      >
                         <LogOut size={14} /> Atsijungti
                      </button>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </header>
        
        {/* Tab Navigation (Only visible in Table/Map view) */}
        {(viewMode === 'table' || viewMode === 'map') && (
          <div className="flex items-center px-6 pt-2 gap-1 border-b border-slate-800 bg-slate-950 shrink-0">
             <button
               onClick={() => setActiveTab('general')}
               className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-800'}`}
             >
                Salė
                {generalOccupied > 0 && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full text-[10px]">{generalOccupied}</span>}
             </button>
             <button
               onClick={() => setActiveTab('ambulatory')}
               className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ambulatory' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-800'}`}
             >
                Ambulatorija
                {ambulatoryOccupied > 0 && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full text-[10px]">{ambulatoryOccupied}</span>}
             </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'table' ? (
            <div className="absolute inset-0 overflow-auto custom-scrollbar">
               <BedTableView 
                beds={filteredBeds} 
                doctors={doctors}
                nurses={nurses} 
                onRowClick={handleBedClick}
                onDischarge={handleQuickDischarge}
                onStatusChange={handleQuickStatusChange}
               />
            </div>
          ) : viewMode === 'map' ? (
            <div className="absolute inset-0 overflow-hidden">
               <BedMapView 
                 beds={filteredBeds} 
                 doctors={doctors} 
                 nurses={nurses} 
                 onBedClick={handleBedClick} 
                 onMovePatient={handleMovePatient}
               />
            </div>
          ) : viewMode === 'tasks' ? ( // Tasks View
            <div className="absolute inset-0 overflow-hidden">
               <TasksView 
                 beds={beds}
                 doctors={doctors}
                 currentUser={currentUser}
                 onUpdateBed={handleSaveBed}
               />
            </div>
          ) : viewMode === 'log' ? (
            <div className="absolute inset-0 overflow-hidden">
              <PatientLogView 
                logs={patientLog}
                doctors={doctors}
              />
            </div>
          ) : viewMode === 'shift' ? (
            <div className="absolute inset-0 overflow-hidden">
              <ShiftManagerView 
                doctors={doctors}
                setDoctors={updateDoctors}
                nurses={nurses}
                setNurses={updateNurses}
                beds={beds}
                patientLogs={patientLog}
                assignmentLogs={assignmentLogs}
                workShifts={workShifts}
                setWorkShifts={setWorkShifts}
                registrationLogs={registrationLogs} 
              />
            </div>
          ) : viewMode === 'reports' ? ( 
            <div className="absolute inset-0 overflow-hidden">
              <ReportsView 
                registrationLogs={registrationLogs}
                nurses={nurses}
              />
            </div>
          ) : viewMode === 'admin_dashboard' ? ( 
            <div className="absolute inset-0 overflow-hidden">
              <AdminDashboardView 
                beds={beds}
                doctors={doctors}
                nurses={nurses}
                patientLogs={patientLog}
                registrationLogs={registrationLogs}
                onNavigate={(view) => setViewMode(view)}
              />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-auto custom-scrollbar">
              <SettingsView 
                doctors={doctors}
                setDoctors={updateDoctors}
                nurses={nurses}
                setNurses={updateNurses}
                medicationBank={medicationBank}
                setMedications={updateMedications}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                onResetData={handleResetData}
                currentUser={currentUser}
              />
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {isModalOpen && selectedBed && (
        <EditPatientModal
          bed={selectedBed}
          beds={beds}
          doctors={doctors}
          currentUser={currentUser}
          medicationBank={medicationBank}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedBed(null); }}
          onSave={handleSaveBed}
          workShifts={workShifts}
        />
      )}

      {/* TRIAGE MODAL */}
      {isTriageModalOpen && (
        <TriageModal
          isOpen={isTriageModalOpen}
          onClose={() => setIsTriageModalOpen(false)}
          beds={beds}
          doctors={doctors}
          workShifts={workShifts}
          onSubmit={handleTriageRegistration}
        />
      )}
    </div>
  );
};

export default App;
