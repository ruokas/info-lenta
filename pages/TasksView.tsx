
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bed, Staff, UserProfile, MedicationStatus, PatientStatus, Action } from '../types';
import { TRIAGE_COLORS, STATUS_COLORS } from '../constants';
import { ClipboardList, Filter, Search, Pill, Microscope, FileImage, Activity, Clock, CheckCircle, ArrowRight, User, Stethoscope, Syringe, Waves, HeartPulse, Sparkles } from 'lucide-react';

interface TasksViewProps {
  beds: Bed[];
  doctors: Staff[];
  currentUser: UserProfile;
  onUpdateBed: (bed: Bed) => void;
}

type TaskType = 'MEDICATION' | 'ACTION' | 'CLEANING';

interface TaskItem {
  id: string;
  uniqueKey: string; // for React key
  type: TaskType;
  subType?: string; // e.g. 'IV', 'XRAY'
  bed: Bed;
  patientName: string;
  triageCategory: number;
  description: string;
  details: string;
  timestamp: string; // ISO
  isOverdue: boolean;
  isUrgent: boolean;
  doctorName?: string;
}

const TasksView: React.FC<TasksViewProps> = ({ beds, doctors, currentUser, onUpdateBed }) => {
  // Default filter to current nurse's section if available
  const defaultSection = currentUser.role === 'Nurse' && currentUser.assignedSection ? currentUser.assignedSection : 'ALL';
  
  // Initialize state from localStorage or defaults
  const [localBeds, setLocalBeds] = useState(beds);
  const [filterSection, setFilterSection] = useState(() => localStorage.getItem('er_tasks_filter_section') || defaultSection);
  const [filterDoctor, setFilterDoctor] = useState(() => localStorage.getItem('er_tasks_filter_doctor') || 'ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'MEDS' | 'ACTIONS'>(() => (localStorage.getItem('er_tasks_filter_type') as any) || 'ALL');
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('er_tasks_search_query') || '');
  
  const [completingIds, setCompletingIds] = useState<string[]>([]); // For animation

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    setLocalBeds(beds);
  }, [beds]);

  useEffect(() => {
    const channel = supabase.channel('public:patients:tasks');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        setLocalBeds(prevBeds => {
            const newBed = payload.new as Bed;
            const index = prevBeds.findIndex(b => b.id === newBed.id);
            if (index > -1) {
                const newBeds = [...prevBeds];
                newBeds[index] = newBed;
                return newBeds;
            }
            return [...prevBeds, newBed];
        });
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('er_tasks_filter_section', filterSection);
    localStorage.setItem('er_tasks_filter_doctor', filterDoctor);
    localStorage.setItem('er_tasks_filter_type', filterType);
    localStorage.setItem('er_tasks_search_query', searchQuery);
  }, [filterSection, filterDoctor, filterType, searchQuery]);

  // Derive all pending tasks from beds
  const tasks = useMemo(() => {
    const allTasks: TaskItem[] = [];
    const now = new Date().getTime();

    localBeds.forEach(bed => {
      // 1. Bed Cleaning Tasks
      if (bed.status === PatientStatus.CLEANING) {
         allTasks.push({
             id: `clean-${bed.id}`,
             uniqueKey: `clean-${bed.id}`,
             type: 'CLEANING',
             subType: 'HOUSEKEEPING',
             bed: bed,
             patientName: 'Išrašytas / Perkeltas',
             triageCategory: 0, // Neutral
             description: 'Lovos Valymas',
             details: 'Paruošti naujam pacientui',
             timestamp: new Date().toISOString(), // Use current time as placeholder
             isOverdue: true, // Always show as high priority/attention
             isUrgent: false,
             doctorName: '-'
         });
      }

      // Skip empty beds for patient tasks
      if (!bed.patient) return;

      const docName = doctors.find(d => d.id === bed.assignedDoctorId)?.name;

      // 2. Medications
      if (bed.patient.medications) {
        bed.patient.medications.forEach(med => {
          if (med.status === MedicationStatus.PENDING) {
            const orderTime = new Date(med.orderedAt).getTime();
            const diffMins = (now - orderTime) / 60000;
            
            allTasks.push({
              id: med.id,
              uniqueKey: `med-${med.id}`,
              type: 'MEDICATION',
              subType: med.route,
              bed: bed,
              patientName: bed.patient!.name,
              triageCategory: bed.patient!.triageCategory,
              description: med.name,
              details: `${med.dose} ${med.route}`,
              timestamp: med.orderedAt,
              isOverdue: diffMins > 60, // Overdue if > 1 hour
              isUrgent: bed.patient!.triageCategory <= 2,
              doctorName: docName
            });
          }
        });
      }

      // 3. Clinical Actions
      if (bed.patient.actions) {
        bed.patient.actions.forEach(action => {
          if (!action.isCompleted) {
            const reqTime = new Date(action.requestedAt).getTime();
            const diffMins = (now - reqTime) / 60000;

            allTasks.push({
              id: action.id,
              uniqueKey: `act-${action.id}`,
              type: 'ACTION',
              subType: action.type,
              bed: bed,
              patientName: bed.patient!.name,
              triageCategory: bed.patient!.triageCategory,
              description: action.name,
              details: action.type,
              timestamp: action.requestedAt,
              isOverdue: diffMins > 90, // Overdue if > 1.5 hours
              isUrgent: bed.patient!.triageCategory <= 2,
              doctorName: docName
            });
          }
        });
      }
    });

    // Sort: Overdue first, then Urgent (Cat 1-2), then Oldest time
    return allTasks.sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [beds, doctors]);

  // Apply Filters
  const filteredTasks = tasks.filter(task => {
    // Section Filter
    if (filterSection !== 'ALL' && task.bed.section !== filterSection) return false;
    
    // Doctor Filter
    if (filterDoctor !== 'ALL' && task.bed.assignedDoctorId !== filterDoctor) return false;

    // Type Filter
    if (filterType === 'MEDS' && task.type !== 'MEDICATION') return false;
    if (filterType === 'ACTIONS' && task.type !== 'ACTION' && task.type !== 'CLEANING') return false; // Cleaning is considered an action type task

    // Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
            task.patientName.toLowerCase().includes(q) ||
            task.description.toLowerCase().includes(q) ||
            task.bed.label.toLowerCase().includes(q)
        );
    }

    return true;
  });

  const getActionIcon = (type: string) => {
      switch (type) {
          case 'LABS': return <Microscope size={16} className="text-blue-400"/>;
          case 'XRAY': case 'CT': return <FileImage size={16} className="text-yellow-400"/>;
          case 'EKG': return <HeartPulse size={16} className="text-red-400"/>;
          case 'ULTRASOUND': return <Waves size={16} className="text-cyan-400"/>;
          case 'CLEANING': case 'HOUSEKEEPING': return <Sparkles size={16} className="text-slate-200"/>;
          default: return <ClipboardList size={16} className="text-purple-400"/>;
      }
  };

  const handleCompleteTask = async (task: TaskItem) => {
      setCompletingIds(prev => [...prev, task.id]);

      const updatedBed = { ...task.bed };
      let updatedPatientData = {};

      if (task.type === 'CLEANING') {
          updatedPatientData = { status: PatientStatus.EMPTY, patient: null, assignedDoctorId: null, comment: '' };
      } else if (updatedBed.patient) {
          if (task.type === 'MEDICATION') {
              const medications = updatedBed.patient.medications?.map(m =>
                  m.id === task.id ? { ...m, status: MedicationStatus.GIVEN, administeredBy: currentUser.id, administeredAt: new Date().toISOString() } : m
              );
              updatedPatientData = { patient: { ...updatedBed.patient, medications } };
          } else if (task.type === 'ACTION') {
              const actions = updatedBed.patient.actions?.map(a =>
                  a.id === task.id ? { ...a, isCompleted: true, completedAt: new Date().toISOString() } : a
              );
              updatedPatientData = { patient: { ...updatedBed.patient, actions } };
          }
      }

      const { error } = await supabase.from('patients').update(updatedPatientData).eq('id', task.bed.id);

      if (error) {
          console.error("Error completing task:", error);
          setCompletingIds(prev => prev.filter(id => id !== task.id)); // Revert on error
      }
      // No need to call onUpdateBed; real-time listener will handle it.
  };

  const handleAddTask = async (bedId: string, action: Action) => {
    const { data: bed, error: fetchError } = await supabase.from('patients').select('patient').eq('id', bedId).single();
    if (fetchError || !bed || !bed.patient) {
        console.error("Error fetching patient for task addition:", fetchError);
        return;
    }

    const updatedActions = [...(bed.patient.actions || []), action];
    const { error } = await supabase.from('patients').update({ patient: { ...bed.patient, actions: updatedActions } }).eq('id', bedId);

    if (error) {
        console.error("Error adding task:", error);
    }
  };

  // Unique sections for filter
  const sections = Array.from(new Set(beds.map(b => b.section))).sort();

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
               <div className="bg-slate-800 p-2 rounded-lg"><ClipboardList size={24} className="text-emerald-500" /></div>
               Klinikinės Užduotys
            </h2>
            <p className="text-slate-400 text-sm mt-1">Laukiantys vaistai, tyrimai ir lovų paruošimas</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex flex-col items-center flex-1 md:flex-none">
                <span className="text-xs text-slate-500 uppercase font-bold">Viso</span>
                <span className="text-xl font-bold text-slate-200">{filteredTasks.length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex flex-col items-center flex-1 md:flex-none">
                <span className="text-xs text-slate-500 uppercase font-bold">Vėluoja</span>
                <span className="text-xl font-bold text-red-500">{filteredTasks.filter(t => t.isOverdue).length}</span>
            </div>
        </div>
      </div>

      {/* Filters Bar - Stacked on Mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 shadow-sm shrink-0">
         <div className="flex flex-col lg:flex-row gap-3 items-center">
            
            {/* Search */}
            <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Ieškoti..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 md:py-2 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg text-base md:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="h-px w-full lg:h-8 lg:w-px bg-slate-800 hidden lg:block"></div>

            {/* Type Toggles */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setFilterType('ALL')}
                  className={`flex-1 lg:flex-none px-4 py-2 md:py-1.5 text-xs font-bold rounded transition whitespace-nowrap ${filterType === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    VISKAS
                </button>
                <button 
                  onClick={() => setFilterType('MEDS')}
                  className={`flex-1 lg:flex-none px-4 py-2 md:py-1.5 text-xs font-bold rounded transition flex items-center justify-center gap-2 whitespace-nowrap ${filterType === 'MEDS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Pill size={12} /> VAISTAI
                </button>
                <button 
                  onClick={() => setFilterType('ACTIONS')}
                  className={`flex-1 lg:flex-none px-4 py-2 md:py-1.5 text-xs font-bold rounded transition flex items-center justify-center gap-2 whitespace-nowrap ${filterType === 'ACTIONS' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Activity size={12} /> VEIKSMAI
                </button>
            </div>

            <div className="h-px w-full lg:h-8 lg:w-px bg-slate-800 hidden lg:block"></div>

            {/* Dropdowns - Stacked on Mobile */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <select 
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full lg:w-48 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="ALL">Visi postai</option>
                    {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>

                <select 
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="w-full lg:w-48 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="ALL">Visi gydytojai</option>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
            </div>

         </div>
      </div>

      {/* Task List Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2 pb-20 md:pb-10">
         {filteredTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                 <ClipboardList size={48} className="mb-4 opacity-20" />
                 <p className="text-lg">Nėra užduočių</p>
                 <p className="text-sm opacity-60">Viskas atlikta arba pakeiskite filtrus</p>
             </div>
         ) : (
             <div className="space-y-3">
                 {filteredTasks.map((task) => {
                     const isCompleting = completingIds.includes(task.id);
                     const isMed = task.type === 'MEDICATION';
                     const isCleaning = task.type === 'CLEANING';
                     
                     return (
                         <div 
                            key={task.uniqueKey}
                            className={`
                                relative bg-slate-900 border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-500
                                ${isCompleting ? 'opacity-0 transform translate-x-full' : 'opacity-100'}
                                ${isCleaning ? 'border-dashed border-slate-600 bg-slate-900/80' : task.isOverdue ? 'border-red-900/50 bg-red-900/5' : 'border-slate-800 hover:border-slate-700'}
                            `}
                         >
                             {/* Time & Status - Top Row on Mobile */}
                             <div className="flex flex-row md:flex-col items-center justify-between md:justify-center w-full md:w-24 shrink-0 gap-2 border-b border-slate-800 md:border-0 pb-2 md:pb-0 mb-2 md:mb-0">
                                 <div className={`text-sm font-mono font-bold ${isCleaning ? 'text-slate-500' : task.isOverdue ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                     {isCleaning ? '--:--' : new Date(task.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 </div>
                                 {task.isOverdue && !isCleaning && (
                                     <div className="flex items-center gap-1 text-[10px] bg-red-900/20 text-red-400 px-1.5 py-0.5 rounded border border-red-900/30 uppercase font-bold">
                                         <Clock size={10} /> Vėluoja
                                     </div>
                                 )}
                                 {isCleaning && (
                                     <div className="flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 uppercase font-bold">
                                         <Sparkles size={10} /> Valyti
                                     </div>
                                 )}
                             </div>

                             {/* Location & Patient */}
                             <div className="flex items-center gap-4 md:w-64 shrink-0">
                                 <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border shrink-0 ${isCleaning ? 'bg-slate-800 border-slate-600' : 'bg-slate-800 border-slate-700'}`}>
                                     <span className="text-xs text-slate-500 uppercase">Lova</span>
                                     <span className="text-lg font-bold text-slate-200">{task.bed.label}</span>
                                 </div>
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <span className={`font-bold ${isCleaning ? 'text-slate-500 italic' : 'text-slate-200'}`}>{task.patientName}</span>
                                         {!isCleaning && (
                                            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${TRIAGE_COLORS[task.triageCategory]}`}>
                                                {task.triageCategory}
                                            </span>
                                         )}
                                     </div>
                                     <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                         <Stethoscope size={10} /> {task.doctorName || '-'}
                                     </div>
                                 </div>
                             </div>

                             {/* Task Details */}
                             <div className="flex-1 flex items-center gap-3 w-full">
                                 <div className={`p-2.5 rounded-full shrink-0 ${isMed ? 'bg-blue-900/20 text-blue-400' : isCleaning ? 'bg-slate-800 text-slate-400' : 'bg-yellow-900/20 text-yellow-400'}`}>
                                     {isMed ? <Syringe size={20} /> : isCleaning ? <Sparkles size={20} /> : getActionIcon(task.details)}
                                 </div>
                                 <div className="flex-1">
                                     <div className="text-lg font-medium text-slate-200 leading-tight">{task.description}</div>
                                     <div className="text-sm text-slate-500 uppercase tracking-wide font-medium mt-0.5">{task.details}</div>
                                 </div>
                             </div>

                             {/* Action Button - Full width on mobile */}
                             <div className="w-full md:w-32 shrink-0 flex justify-end mt-2 md:mt-0">
                                 <button
                                    onClick={() => handleCompleteTask(task)}
                                    disabled={isCompleting}
                                    className={`
                                        flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all w-full
                                        ${isMed 
                                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20' 
                                            : isCleaning
                                                ? 'bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-600 hover:border-emerald-500'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'}
                                    `}
                                 >
                                     {isCompleting ? (
                                         <CheckCircle size={18} className="animate-ping" />
                                     ) : (
                                         <>
                                            {isMed ? 'SULEISTI' : isCleaning ? 'IŠVALYTA' : 'ATLIKTA'}
                                            {!isCleaning && <ArrowRight size={16} />}
                                            {isCleaning && <CheckCircle size={16} />}
                                         </>
                                     )}
                                 </button>
                             </div>

                         </div>
                     );
                 })}
             </div>
         )}
      </div>
    </div>
  );
};

export default TasksView;
