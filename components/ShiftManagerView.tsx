
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Staff, Bed, PatientLogEntry, AssignmentLog, WorkShift, PatientStatus, RegistrationLog, StaffSpecialization, StaffSkill } from '../types';
import { Briefcase, Plus, X, CalendarClock, Trash2, UserPlus, MapPin, ClipboardList, AlertTriangle, Search, ChevronDown } from 'lucide-react';

interface ShiftManagerViewProps {
  doctors: Staff[];
  setDoctors: (staff: Staff[]) => void;
  nurses: Staff[];
  setNurses: (staff: Staff[]) => void;
  beds: Bed[];
  patientLogs: PatientLogEntry[];
  assignmentLogs: AssignmentLog[];
  workShifts: WorkShift[];
  setWorkShifts: (shifts: WorkShift[]) => void;
  registrationLogs?: RegistrationLog[];
  sections: string[];
  specializations: StaffSpecialization[];
  skills: StaffSkill[];
}

const SHIFT_BUTTONS = [
  { label: '08-20', start: 8, end: 20, color: 'bg-blue-900/30 text-blue-300 border-blue-900/50' },
  { label: '20-08', start: 20, end: 8, color: 'bg-indigo-900/30 text-indigo-300 border-indigo-900/50' },
  { label: '08-08', start: 8, end: 8, color: 'bg-purple-900/30 text-purple-300 border-purple-900/50' },
  { label: '09-21', start: 9, end: 21, color: 'bg-cyan-900/30 text-cyan-300 border-cyan-900/50' },
  { label: '09-09', start: 9, end: 9, color: 'bg-teal-900/30 text-teal-300 border-teal-900/50' },
  { label: '10-22', start: 10, end: 22, color: 'bg-emerald-900/30 text-emerald-300 border-emerald-900/50' },
];

const ShiftManagerView: React.FC<ShiftManagerViewProps> = ({ 
  doctors, setDoctors, 
  nurses, setNurses,
  beds, patientLogs, assignmentLogs,
  workShifts, setWorkShifts,
  registrationLogs = [],
  sections,
  specializations,
  skills
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Staff Management State
  const [nurseSearchQuery, setNurseSearchQuery] = useState('');
  const [showNurseDropdown, setShowNurseDropdown] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Fallback selection states for mobile/direct access if needed
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedNurseId, setSelectedNurseId] = useState('');

  // Refs for click outside handling
  const nurseDropdownRef = useRef<HTMLDivElement>(null);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    const handleClickOutside = (event: MouseEvent) => {
        if (nurseDropdownRef.current && !nurseDropdownRef.current.contains(event.target as Node)) {
            setShowNurseDropdown(false);
        }
        if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
            setShowDoctorDropdown(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        clearInterval(timer);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const availableDoctors = useMemo(() => 
      doctors.filter(d => !d.isActive && !d.isDisabled && d.name.toLowerCase().includes(doctorSearchQuery.toLowerCase())), 
  [doctors, doctorSearchQuery]);

  const availableNurses = useMemo(() => 
      nurses.filter(n => !n.isActive && !n.isDisabled && n.name.toLowerCase().includes(nurseSearchQuery.toLowerCase())), 
  [nurses, nurseSearchQuery]);

  const getTimelineRange = () => {
    const start = new Date();
    start.setHours(8, 0, 0, 0);
    if (currentTime.getHours() < 8) {
      start.setDate(start.getDate() - 1);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();

  const addShift = (doctorId: string, startHour: number, endHour: number) => {
    const start = new Date(timelineStart);
    start.setHours(startHour, 0, 0, 0);
    
    const end = new Date(start);
    if (endHour < startHour) { 
        end.setDate(end.getDate() + 1); 
        end.setHours(endHour, 0, 0, 0); 
    } else if (endHour === startHour) { 
        end.setDate(end.getDate() + 1); 
        end.setHours(endHour, 0, 0, 0); 
    } else { 
        end.setHours(endHour, 0, 0, 0); 
    }
    
    const type = (startHour >= 20 || startHour < 6) ? 'NIGHT' : 'DAY';
    const newShift: WorkShift = { 
        id: `shift-${Date.now()}-${Math.random()}`, 
        doctorId, 
        start: start.toISOString(), 
        end: end.toISOString(), 
        type 
    };
    
    const filtered = workShifts.filter(s => s.doctorId !== doctorId);
    setWorkShifts([...filtered, newShift]);
  };

  const removeShift = (shiftId: string) => { 
      setWorkShifts(workShifts.filter(s => s.id !== shiftId)); 
  };

  const updateShiftTime = (shiftId: string, field: 'start' | 'end', value: string) => {
     const [h, m] = value.split(':').map(Number);
     setWorkShifts(workShifts.map(s => {
         if (s.id === shiftId) { 
             const d = new Date(field === 'start' ? s.start : s.end); 
             d.setHours(h, m, 0, 0); 
             return { ...s, [field]: d.toISOString() }; 
         }
         return s;
     }));
  };

  const getPosition = (isoTime: string) => {
      const t = new Date(isoTime).getTime(); 
      const start = timelineStart.getTime(); 
      const end = timelineEnd.getTime();
      return Math.max(0, Math.min(100, ((t - start) / (end - start)) * 100));
  };
  
  const currentTimePos = getPosition(currentTime.toISOString());

  const getDoctorStats = (docId: string) => {
    const activeCount = beds.filter(b => b.assignedDoctorId === docId && b.status !== PatientStatus.EMPTY).length;
    const heavyCount = beds.filter(b => b.assignedDoctorId === docId && b.patient && b.patient.triageCategory <= 2).length;
    const dischargedCount = patientLogs.filter(l => 
        l.treatedByDoctorName === doctors.find(d => d.id === docId)?.name && 
        new Date(l.dischargeTime) >= timelineStart
    ).length;
    return { activeCount, heavyCount, dischargedCount };
  };

  const getNurseStats = (nurseId: string) => {
      return registrationLogs.filter(l => 
          l.nurseId === nurseId && 
          new Date(l.timestamp) >= timelineStart && 
          new Date(l.timestamp) <= timelineEnd
      ).length;
  };

  const getTotalTriageCount = () => {
      return registrationLogs.filter(l => 
          new Date(l.timestamp) >= timelineStart && 
          new Date(l.timestamp) <= timelineEnd
      ).length;
  };

  const handleNurseSectionChange = (nurseId: string, section: string) => { 
      setNurses(nurses.map(n => n.id === nurseId ? { ...n, assignedSection: section } : n)); 
  };

  const handleSelectDoctor = (docId: string) => {
      setDoctors(doctors.map(d => d.id === docId ? { ...d, isActive: true } : d));
      setDoctorSearchQuery('');
      setShowDoctorDropdown(false);
  };

  const handleSelectNurse = (nurseId: string) => {
      setNurses(nurses.map(n => n.id === nurseId ? { ...n, isActive: true } : n));
      setNurseSearchQuery('');
      setShowNurseDropdown(false);
  };

  // Mobile handlers utilizing the native select
  const handleAddDoctorToShiftMobile = () => { 
      if (!selectedDoctorId) return; 
      setDoctors(doctors.map(d => d.id === selectedDoctorId ? { ...d, isActive: true } : d)); 
      setSelectedDoctorId(''); 
  };

  const handleAddNurseToShift = () => {
      if (!selectedNurseId) return;
      setNurses(nurses.map(n => n.id === selectedNurseId ? { ...n, isActive: true } : n));
      setSelectedNurseId('');
  };

  const removeStaffFromShift = (id: string, type: 'Doctor' | 'Nurse') => {
    if (type === 'Doctor') {
        setDoctors(doctors.map(d => d.id === id ? { ...d, isActive: false } : d));
    } else {
        setNurses(nurses.map(n => n.id === id ? { ...n, isActive: false } : n));
    }
  };

  const checkEndingSoon = (shift: WorkShift): boolean => {
      const now = currentTime.getTime();
      const end = new Date(shift.end).getTime();
      const diff = end - now;
      return diff > 0 && diff < 3600000;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto custom-scrollbar">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-3">
               <CalendarClock className="text-blue-500" /> Personalo ir Pamainos valdymas
           </h2>
           <p className="text-slate-400 mt-1 flex items-center gap-2">
               <span className="text-xs md:text-sm">Laiko juosta: {timelineStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {timelineEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
           </p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <div className="text-xl md:text-2xl font-light text-slate-100 tabular-nums">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Dabartinis laikas</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-20">
        
        {/* LEFT COLUMN: Nurses */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">Slaugytojos & Postai</h3>
                  <div className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-900/50 font-bold flex items-center gap-1" title="Viso triažo registracijų šią pamainą">
                      <ClipboardList size={10} /> Reg: {getTotalTriageCount()}
                  </div>
              </div>
              <div className="p-3 border-b border-slate-800/50 bg-slate-900/50">
                  {/* Searchable Nurse Input */}
                  <div className="relative" ref={nurseDropdownRef}>
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 focus-within:border-emerald-500 transition-colors">
                          <Search size={16} className="text-slate-500 mr-2 shrink-0"/>
                          <input 
                              type="text"
                              value={nurseSearchQuery}
                              onChange={(e) => { setNurseSearchQuery(e.target.value); setShowNurseDropdown(true); }}
                              onFocus={() => setShowNurseDropdown(true)}
                              placeholder="Ieškoti slaugytojos..."
                              className="bg-transparent text-slate-200 text-sm md:text-xs outline-none w-full placeholder:text-slate-500"
                          />
                          {nurseSearchQuery && <button onClick={() => { setNurseSearchQuery(''); setShowNurseDropdown(false); }}><X size={14} className="text-slate-500 hover:text-slate-300"/></button>}
                      </div>
                      
                      {showNurseDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                              {availableNurses.length > 0 ? (
                                  availableNurses.map(n => (
                                      <button 
                                          key={n.id}
                                          onClick={() => handleSelectNurse(n.id)}
                                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700/50 last:border-0 flex items-center justify-between"
                                      >
                                          <span>{n.name}</span>
                                          <Plus size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500"/>
                                      </button>
                                  ))
                              ) : (
                                  <div className="px-3 py-2 text-xs text-slate-500 italic text-center">Nerasta slaugytojų</div>
                              )}
                          </div>
                      )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 italic hidden sm:block">Nerandate sąraše? Pridėkite per Nustatymai → Personalo Bankas.</p>
              </div>
              <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                 {nurses.map(nurse => {
                    const regCount = getNurseStats(nurse.id); 
                    const isTriage = nurse.assignedSection === 'Triažas';
                    return (
                    <div key={nurse.id} className={`p-2 rounded-lg border transition-all ${nurse.isActive ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700 opacity-60 hidden'}`}>
                        {nurse.isActive && (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                        <span className={`w-2 h-2 rounded-full ${nurse.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                                        <div className="flex flex-col">
                                            <span className={`text-base md:text-sm font-medium ${nurse.isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                                                {nurse.name}
                                                {(isTriage || regCount > 0) && (<span className={`ml-2 text-[10px] px-1 rounded border font-mono ${isTriage ? 'bg-blue-900/30 text-blue-300 border-blue-900/50' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>Reg: {regCount}</span>)}
                                            </span>
                                            {/* Skill Badges */}
                                            {nurse.skillIds && nurse.skillIds.length > 0 && (
                                                <div className="flex gap-1 mt-0.5">
                                                    {nurse.skillIds.map(skId => {
                                                        const sk = skills.find(s => s.id === skId);
                                                        return sk ? <span key={skId} className={`text-[8px] px-1 rounded text-white ${sk.color}`}>{sk.label}</span> : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                    <div className="flex gap-1">
                                        <button onClick={() => removeStaffFromShift(nurse.id, 'Nurse')} className="text-slate-500 hover:text-red-400 p-2 md:p-1 hover:bg-slate-700/50 rounded" title="Pašalinti iš pamainos"><X size={18} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <MapPin size={12} className="text-slate-500" />
                                    <select value={nurse.assignedSection || ''} onChange={(e) => handleNurseSectionChange(nurse.id, e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-sm md:text-xs rounded px-2 py-2 md:py-1 outline-none">
                                        <option value="" disabled>-- Priskirti postą --</option>
                                        {sections.map(sec => (<option key={sec} value={sec}>{sec}</option>))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                 )})}
                 {nurses.filter(n => n.isActive).length === 0 && <p className="text-center text-xs text-slate-500 italic py-4">Šioje pamainoje nėra priskirtų slaugytojų.</p>}
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Doctors Timeline */}
        <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
               <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-slate-200 flex items-center gap-2"><Briefcase size={18} className="text-purple-500"/> Gydytojų Grafikas</h3>
                 <div className="hidden lg:flex items-center gap-4 text-xs">
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded"></div> Dieninė</div>
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-600 rounded"></div> Naktinė</div>
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded"></div> Baigiasi pamaina</div>
                 </div>
              </div>
              
              {/* DESKTOP VIEW: Timeline */}
              <div className="hidden lg:block p-4 overflow-x-auto">
                 <div className="flex items-center gap-2 mb-4 bg-slate-800/30 p-2 rounded border border-slate-800 max-w-md relative" ref={doctorDropdownRef}>
                     <span className="text-xs font-bold text-slate-500 uppercase px-2"><UserPlus size={16}/></span>
                     
                     <div className="flex-1 relative">
                         <input 
                             type="text"
                             value={doctorSearchQuery}
                             onChange={(e) => { setDoctorSearchQuery(e.target.value); setShowDoctorDropdown(true); }}
                             onFocus={() => setShowDoctorDropdown(true)}
                             placeholder="Pasirinkti gydytoją..."
                             className="w-full bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500"
                         />
                         {showDoctorDropdown && (
                             <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                                 {availableDoctors.length > 0 ? (
                                     availableDoctors.map(d => (
                                         <button 
                                             key={d.id}
                                             onClick={() => handleSelectDoctor(d.id)}
                                             className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white border-b border-slate-800 last:border-0"
                                         >
                                             {d.name}
                                         </button>
                                     ))
                                 ) : (
                                     <div className="px-3 py-2 text-xs text-slate-500 italic text-center">Nerasta gydytojų</div>
                                 )}
                             </div>
                         )}
                     </div>
                     <ChevronDown size={14} className="text-slate-500 mr-2"/>
                 </div>
                 
                 <div className="relative h-6 mb-2 min-w-[600px] border-b border-slate-700">
                     {[0, 4, 8, 12, 16, 20, 24].map(h => (
                         <div key={h} className="absolute text-[10px] text-slate-500 transform -translate-x-1/2" style={{ left: `${(h / 24) * 100}%` }}>
                             {new Date(timelineStart.getTime() + h * 60 * 60 * 1000).getHours()}:00
                         </div>
                     ))}
                     <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${currentTimePos}%` }}></div>
                 </div>
                 
                 <div className="space-y-4 min-w-[600px]">
                    {doctors.filter(d => d.role === 'Doctor' && d.isActive).map(doc => {
                        const shift = workShifts.find(s => s.doctorId === doc.id); 
                        const stats = getDoctorStats(doc.id); 
                        const specName = specializations.find(s => s.id === doc.specializationId)?.name;
                        
                        let shiftStartPos = 0;
                        let shiftWidth = 0;
                        let isEndingSoon = false;

                        if (shift) {
                            const shiftStart = getPosition(shift.start);
                            const shiftEnd = getPosition(shift.end);
                            shiftStartPos = shiftStart;
                            shiftWidth = Math.max(shiftEnd - shiftStart, 1);
                            isEndingSoon = checkEndingSoon(shift);
                        }
                        
                        return (
                            <div key={doc.id} className="group relative bg-slate-800/30 rounded-lg p-3 border border-slate-800 hover:bg-slate-800 transition">
                                <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-blue-600 text-white shadow-lg shadow-blue-900/50`}>{doc.name.substring(0, 2).toUpperCase()}</div>
                                        <div>
                                            <div className="font-medium text-slate-200 flex items-center gap-2 group-hover:gap-1">
                                                {doc.name}
                                                {specName && <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">{specName}</span>}
                                                <button onClick={() => removeStaffFromShift(doc.id, 'Doctor')} className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition" title="Pašalinti iš pamainos"><X size={12}/></button>
                                            </div>
                                            <div className="flex gap-2 text-[10px] text-slate-500">
                                                <span>Aktyvūs: <strong className="text-blue-400">{stats.activeCount}</strong></span>
                                                <span>Sunkūs: <strong className="text-red-400">{stats.heavyCount}</strong></span>
                                                <span>Išrašė: <strong className="text-green-400">{stats.dischargedCount}</strong></span>
                                            </div>
                                            {/* Skills */}
                                            {doc.skillIds && doc.skillIds.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {doc.skillIds.map(skId => {
                                                        const sk = skills.find(s => s.id === skId);
                                                        return sk ? <span key={skId} className={`text-[8px] px-1 rounded text-white ${sk.color}`}>{sk.label}</span> : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 xl:grid-cols-6 gap-1 opacity-20 group-hover:opacity-100 transition justify-end w-full max-w-xl">
                                        {!shift ? (SHIFT_BUTTONS.map((btn) => (<button key={btn.label} onClick={() => addShift(doc.id, btn.start, btn.end)} className={`px-2 py-1 text-[10px] rounded hover:opacity-80 border ${btn.color} whitespace-nowrap`}>+ {btn.label}</button>))) : (<button onClick={() => removeShift(shift.id)} className="p-1 text-red-400 hover:bg-red-900/30 rounded border border-transparent hover:border-red-900/50 flex items-center gap-1 col-span-3 xl:col-span-6 justify-center" title="Ištrinti pamainą"><Trash2 size={14}/><span className="text-xs">Atšaukti</span></button>)}
                                    </div>
                                </div>
                                <div className="relative h-8 bg-slate-900 rounded border border-slate-700 mt-2 overflow-hidden">
                                    <div className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20" style={{ left: `${currentTimePos}%` }}></div>
                                    {[0, 20, 40, 60, 80].map(p => <div key={p} className="absolute top-0 bottom-0 w-px bg-slate-800" style={{ left: `${p}%` }}></div>)}
                                    
                                    {shift ? (
                                        <div 
                                            className={`absolute top-1 bottom-1 rounded flex items-center justify-between px-2 text-[10px] font-bold text-white shadow-sm z-10 transition-all ${isEndingSoon ? 'bg-yellow-500/80 ring-2 ring-yellow-400' : shift.type === 'DAY' ? 'bg-blue-600' : 'bg-indigo-600'}`} 
                                            style={{ left: `${shiftStartPos}%`, width: `${shiftWidth}%` }}
                                        >
                                            <input 
                                                type="time" 
                                                className="bg-transparent text-white w-12 outline-none cursor-pointer hover:bg-black/20 rounded px-0.5 text-center" 
                                                value={new Date(shift.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                                onChange={(e) => updateShiftTime(shift.id, 'start', e.target.value)} 
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {isEndingSoon ? <AlertTriangle size={12} className="animate-pulse text-white mx-auto"/> : null}
                                            <input 
                                                type="time" 
                                                className="bg-transparent text-white w-12 outline-none cursor-pointer hover:bg-black/20 rounded px-0.5 text-center" 
                                                value={new Date(shift.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                                onChange={(e) => updateShiftTime(shift.id, 'end', e.target.value)} 
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-600 italic">Nėra pamainos</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {doctors.filter(d => d.isActive).length === 0 && <p className="text-center text-xs text-slate-500 italic py-4">Šioje pamainoje nėra priskirtų gydytojų.</p>}
                 </div>
              </div>

              {/* MOBILE VIEW: List */}
              <div className="block lg:hidden p-4">
                 <div className="flex flex-col gap-2 mb-4 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><UserPlus size={16}/> Pridėti gydytoją</span>
                    <div className="flex gap-2">
                        <select value={selectedDoctorId} onChange={(e) => handleAddDoctorToShiftMobile()} className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-2 text-sm outline-none">
                            <option value="">Pasirinkti iš banko...</option>{availableDoctors.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {doctors.filter(d => d.role === 'Doctor' && d.isActive).map(doc => {
                        const stats = getDoctorStats(doc.id);
                        const specName = specializations.find(s => s.id === doc.specializationId)?.name;
                        return (
                            <div key={doc.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-blue-600 text-white text-sm">{doc.name.substring(0, 2).toUpperCase()}</div>
                                    <div>
                                        <div className="font-bold text-slate-100 flex flex-col">
                                            {doc.name}
                                            {specName && <span className="text-[10px] text-blue-300 font-normal">{specName}</span>}
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                            <span>Akt: <strong className="text-blue-400">{stats.activeCount}</strong></span>
                                            <span>Sunk: <strong className="text-red-400">{stats.heavyCount}</strong></span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeStaffFromShift(doc.id, 'Doctor')} className="p-2 bg-slate-700 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg">
                                    <X size={20}/>
                                </button>
                            </div>
                        );
                    })}
                    {doctors.filter(d => d.isActive).length === 0 && (
                        <p className="text-center text-slate-500 italic py-8 border-2 border-dashed border-slate-800 rounded-xl">Nėra aktyvių gydytojų</p>
                    )}
                 </div>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagerView;
