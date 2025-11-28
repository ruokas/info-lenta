
import React, { useState, useEffect } from 'react';
import { Staff, Bed, PatientLogEntry, AssignmentLog, WorkShift, PatientStatus } from '../types';
import { Users, BarChart2, CheckCircle, Clock, AlertTriangle, Moon, Sun, Briefcase, Plus, X, CalendarClock, Trash2, Edit2, Check, UserPlus, MoreHorizontal } from 'lucide-react';

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
}

const ShiftManagerView: React.FC<ShiftManagerViewProps> = ({ 
  doctors, setDoctors, 
  nurses, setNurses,
  beds, patientLogs, assignmentLogs,
  workShifts, setWorkShifts
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Staff Management State
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newNurseName, setNewNurseName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Define the timeline window: 08:00 today to 08:00 tomorrow
  const getTimelineRange = () => {
    const start = new Date();
    start.setHours(8, 0, 0, 0);
    // If it's before 8AM, show the timeline starting yesterday 8AM (to cover the night shift)
    if (currentTime.getHours() < 8) {
      start.setDate(start.getDate() - 1);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();

  // Helper to add shifts with custom hours
  const addShift = (doctorId: string, startHour: number, endHour: number) => {
    const start = new Date(timelineStart);
    // Adjust start date if the requested start hour is earlier than the timeline start (8 AM)
    // Actually, we usually want to set it relative to the timeline base date.
    // If timeline starts at 08:00, and we request 09:00, it's same day.
    // If we request 08:00, it's same day.
    start.setHours(startHour, 0, 0, 0);

    const end = new Date(start);
    
    if (endHour < startHour) {
        // Crosses midnight (e.g. 20:00 to 08:00)
        end.setDate(end.getDate() + 1);
        end.setHours(endHour, 0, 0, 0);
    } else if (endHour === startHour) {
        // 24 hours (e.g. 08:00 to 08:00)
        end.setDate(end.getDate() + 1);
        end.setHours(endHour, 0, 0, 0);
    } else {
        // Same day (e.g. 08:00 to 20:00)
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

    // Remove existing shifts for this doctor in this period to prevent overlap
    const filtered = workShifts.filter(s => s.doctorId !== doctorId);
    setWorkShifts([...filtered, newShift]);
  };

  const removeShift = (shiftId: string) => {
      setWorkShifts(workShifts.filter(s => s.id !== shiftId));
  };

  const updateShiftTime = (shiftId: string, field: 'start' | 'end', value: string) => {
     // Value is HH:MM
     const [h, m] = value.split(':').map(Number);
     setWorkShifts(prev => prev.map(s => {
         if (s.id === shiftId) {
             const d = new Date(field === 'start' ? s.start : s.end);
             d.setHours(h, m, 0, 0);
             return { ...s, [field]: d.toISOString() };
         }
         return s;
     }));
  };

  // Calculate position on timeline (0-100%)
  const getPosition = (isoTime: string) => {
      const t = new Date(isoTime).getTime();
      const start = timelineStart.getTime();
      const end = timelineEnd.getTime();
      const total = end - start;
      const pos = ((t - start) / total) * 100;
      return Math.max(0, Math.min(100, pos));
  };

  const currentTimePos = getPosition(currentTime.toISOString());

  // Stats Logic
  const getDoctorStats = (docId: string) => {
    const activeCount = beds.filter(b => b.assignedDoctorId === docId && b.status !== PatientStatus.EMPTY).length;
    const heavyCount = beds.filter(b => b.assignedDoctorId === docId && b.patient && b.patient.triageCategory <= 2).length;
    const dischargedCount = patientLogs.filter(l => l.treatedByDoctorName === doctors.find(d => d.id === docId)?.name && new Date(l.dischargeTime) >= timelineStart).length;
    return { activeCount, heavyCount, dischargedCount };
  };

  const toggleNurseActive = (nurseId: string) => {
      setNurses(nurses.map(n => n.id === nurseId ? { ...n, isActive: !n.isActive } : n));
  };

  // --- CRUD Logic (Moved from Settings) ---

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

  const startEditing = (item: Staff) => {
    setDeletingId(null);
    setEditingId(item.id);
    setEditName(item.name);
  };

  const saveEdit = (id: string, type: 'Doctor' | 'Nurse') => {
    if (!editName.trim()) return;
    if (type === 'Doctor') {
        setDoctors(doctors.map(d => d.id === id ? { ...d, name: editName.trim() } : d));
    } else {
        setNurses(nurses.map(n => n.id === id ? { ...n, name: editName.trim() } : n));
    }
    setEditingId(null);
  };

  const initDelete = (id: string) => {
    setEditingId(null);
    setDeletingId(id);
  };

  const executeDelete = (id: string, type: 'Doctor' | 'Nurse') => {
    if (type === 'Doctor') {
        setDoctors(doctors.filter(d => d.id !== id));
    } else {
        setNurses(nurses.filter(n => n.id !== id));
    }
    setDeletingId(null);
  };

  // Shift Buttons Configuration
  const SHIFT_BUTTONS = [
    { label: '08-20', start: 8, end: 20, color: 'bg-blue-900/30 text-blue-300 border-blue-900/50' },
    { label: '20-08', start: 20, end: 8, color: 'bg-indigo-900/30 text-indigo-300 border-indigo-900/50' },
    { label: '08-08 (24h)', start: 8, end: 8, color: 'bg-purple-900/30 text-purple-300 border-purple-900/50' },
    { label: '09-21', start: 9, end: 21, color: 'bg-cyan-900/30 text-cyan-300 border-cyan-900/50' },
    { label: '09-09 (24h)', start: 9, end: 9, color: 'bg-teal-900/30 text-teal-300 border-teal-900/50' },
    { label: '10-22', start: 10, end: 22, color: 'bg-emerald-900/30 text-emerald-300 border-emerald-900/50' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
        <div>
           <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
             <CalendarClock className="text-blue-500" />
             Personalo ir Pamainos valdymas
           </h2>
           <p className="text-slate-400 mt-1 flex items-center gap-2">
             <span className="text-sm">Laiko juosta: {timelineStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {timelineEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
           </p>
        </div>
        
        <div className="flex gap-4">
           <div className="text-right">
              <div className="text-2xl font-light text-slate-100 tabular-nums">
                 {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dabartinis laikas</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Nurses */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-4 bg-slate-950/50 border-b border-slate-800">
                 <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">Slaugytojos</h3>
              </div>
              
              {/* Add Nurse Form */}
              <div className="p-3 border-b border-slate-800/50 bg-slate-900/50">
                  <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newNurseName}
                        onChange={(e) => setNewNurseName(e.target.value)}
                        placeholder="Vardas"
                        className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={handleAddNurse}
                        disabled={!newNurseName.trim()}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                  </div>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                 {nurses.map(nurse => (
                    <div key={nurse.id} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${nurse.isActive ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        {editingId === nurse.id ? (
                            <div className="flex-1 flex gap-2">
                                <input 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-xs outline-none"
                                    autoFocus
                                />
                                <button onClick={() => saveEdit(nurse.id, 'Nurse')} className="text-emerald-500 p-1 hover:bg-slate-700 rounded"><Check size={14}/></button>
                                <button onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={14}/></button>
                            </div>
                        ) : deletingId === nurse.id ? (
                             <div className="flex-1 flex items-center justify-between">
                                <span className="text-red-400 text-xs font-bold">Ištrinti?</span>
                                <div className="flex gap-2">
                                    <button onClick={() => executeDelete(nurse.id, 'Nurse')} className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded">TAIP</button>
                                    <button onClick={() => setDeletingId(null)} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded">NE</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                    <input type="checkbox" className="sr-only" checked={!!nurse.isActive} onChange={() => toggleNurseActive(nurse.id)} />
                                    <span className={`w-2 h-2 rounded-full ${nurse.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                                    <span className={`text-sm ${nurse.isActive ? 'text-slate-200' : 'text-slate-500'}`}>{nurse.name}</span>
                                </label>
                                <div className="flex gap-1 ml-2">
                                    <button onClick={() => startEditing(nurse)} className="text-slate-500 hover:text-blue-400 p-1 hover:bg-slate-700/50 rounded"><Edit2 size={12}/></button>
                                    <button onClick={() => initDelete(nurse.id)} className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-700/50 rounded"><Trash2 size={12}/></button>
                                </div>
                            </>
                        )}
                    </div>
                 ))}
                 {nurses.length === 0 && <p className="text-center text-xs text-slate-500 italic py-4">Nėra slaugytojų.</p>}
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Doctors Timeline */}
        <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
               <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-500"/> Gydytojų Grafikas
                 </h3>
                 <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded"></div> Dieninė</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-600 rounded"></div> Naktinė</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded"></div> Baigiasi pamaina</div>
                 </div>
              </div>
              
              <div className="p-4 overflow-x-auto">
                 {/* Add Doctor Bar */}
                 <div className="flex items-center gap-2 mb-4 bg-slate-800/30 p-2 rounded border border-slate-800 max-w-md">
                      <span className="text-xs font-bold text-slate-500 uppercase px-2"><UserPlus size={16}/></span>
                      <input 
                        type="text"
                        value={newDoctorName}
                        onChange={(e) => setNewDoctorName(e.target.value)}
                        placeholder="Naujas gydytojas..."
                        className="flex-1 bg-transparent border-none text-slate-200 text-sm outline-none placeholder:text-slate-600"
                      />
                      <button 
                        onClick={handleAddDoctor}
                        disabled={!newDoctorName.trim()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold disabled:opacity-50"
                      >
                        PRIDĖTI
                      </button>
                 </div>

                 {/* Timeline Header */}
                 <div className="relative h-6 mb-2 min-w-[600px] border-b border-slate-700">
                    {[0, 4, 8, 12, 16, 20, 24].map(h => (
                        <div key={h} className="absolute text-[10px] text-slate-500 transform -translate-x-1/2" style={{ left: `${(h / 24) * 100}%` }}>
                            {new Date(timelineStart.getTime() + h * 60 * 60 * 1000).getHours()}:00
                        </div>
                    ))}
                    {/* Current Time Marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${currentTimePos}%` }}></div>
                 </div>

                 <div className="space-y-4 min-w-[600px]">
                    {doctors.filter(d => d.role === 'Doctor').map(doc => {
                        const shift = workShifts.find(s => s.doctorId === doc.id);
                        const stats = getDoctorStats(doc.id);
                        const shiftStartPos = shift ? getPosition(shift.start) : 0;
                        const shiftEndPos = shift ? getPosition(shift.end) : 0;
                        const shiftWidth = Math.max(shiftEndPos - shiftStartPos, 1); // Min 1% width
                        
                        // Check if shift ending soon (within 1 hour)
                        const isEndingSoon = shift && (new Date(shift.end).getTime() - currentTime.getTime() > 0) && (new Date(shift.end).getTime() - currentTime.getTime() < 3600000);

                        return (
                            <div key={doc.id} className="group relative bg-slate-800/30 rounded-lg p-3 border border-slate-800 hover:bg-slate-800 transition">
                                <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        {editingId === doc.id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-40 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => saveEdit(doc.id, 'Doctor')} className="text-green-500 p-1 hover:bg-slate-700 rounded"><Check size={14}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-red-500 p-1 hover:bg-slate-700 rounded"><X size={14}/></button>
                                            </div>
                                        ) : deletingId === doc.id ? (
                                             <div className="flex items-center gap-2">
                                                <span className="text-red-400 text-xs font-bold">Ištrinti?</span>
                                                <button onClick={() => executeDelete(doc.id, 'Doctor')} className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded">TAIP</button>
                                                <button onClick={() => setDeletingId(null)} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded">NE</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${doc.isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 text-slate-400'}`}>
                                                    {doc.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-200 flex items-center gap-2 group-hover:gap-1">
                                                        {doc.name}
                                                        <div className="opacity-0 group-hover:opacity-100 flex transition-opacity ml-2">
                                                            <button onClick={() => startEditing(doc)} className="text-slate-500 hover:text-blue-400 p-1"><Edit2 size={10}/></button>
                                                            <button onClick={() => initDelete(doc.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={10}/></button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 text-[10px] text-slate-500">
                                                        <span>Aktyvūs: <strong className="text-blue-400">{stats.activeCount}</strong></span>
                                                        <span>Sunkūs: <strong className="text-red-400">{stats.heavyCount}</strong></span>
                                                        <span>Išrašė: <strong className="text-green-400">{stats.dischargedCount}</strong></span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Shift Controls */}
                                    <div className="flex flex-wrap gap-1 opacity-20 group-hover:opacity-100 transition justify-end max-w-sm">
                                        {!shift ? (
                                            SHIFT_BUTTONS.map((btn) => (
                                              <button
                                                key={btn.label}
                                                onClick={() => addShift(doc.id, btn.start, btn.end)}
                                                className={`px-2 py-1 text-[10px] rounded hover:opacity-80 border ${btn.color} whitespace-nowrap`}
                                              >
                                                + {btn.label}
                                              </button>
                                            ))
                                        ) : (
                                            <button onClick={() => removeShift(shift.id)} className="p-1 text-red-400 hover:bg-red-900/30 rounded border border-transparent hover:border-red-900/50 flex items-center gap-1" title="Ištrinti pamainą">
                                                <Trash2 size={14}/>
                                                <span className="text-xs">Atšaukti</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline Track */}
                                <div className="relative h-8 bg-slate-900 rounded border border-slate-700 mt-2 overflow-hidden">
                                     <div className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20" style={{ left: `${currentTimePos}%` }}></div>
                                     {[0, 20, 40, 60, 80].map(p => <div key={p} className="absolute top-0 bottom-0 w-px bg-slate-800" style={{ left: `${p}%` }}></div>)}

                                     {shift ? (
                                         <div 
                                            className={`absolute top-1 bottom-1 rounded flex items-center justify-between px-2 text-[10px] font-bold text-white shadow-sm z-10 transition-all
                                                ${isEndingSoon ? 'bg-yellow-500/80 ring-2 ring-yellow-400' : shift.type === 'DAY' ? 'bg-blue-600' : 'bg-indigo-600'}
                                            `}
                                            style={{ left: `${shiftStartPos}%`, width: `${shiftWidth}%` }}
                                         >
                                             {/* Start Time Input Overlay */}
                                             <input 
                                                type="time" 
                                                className="bg-transparent text-white w-12 outline-none cursor-pointer hover:bg-black/20 rounded px-0.5 text-center"
                                                value={new Date(shift.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                onChange={(e) => updateShiftTime(shift.id, 'start', e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                             />
                                             
                                             {isEndingSoon && <AlertTriangle size={12} className="animate-pulse text-white mx-auto"/>}

                                             {/* End Time Input Overlay */}
                                              <input 
                                                type="time" 
                                                className="bg-transparent text-white w-12 outline-none cursor-pointer hover:bg-black/20 rounded px-0.5 text-center"
                                                value={new Date(shift.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                onChange={(e) => updateShiftTime(shift.id, 'end', e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                             />
                                         </div>
                                     ) : (
                                         <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-600 italic">
                                             Nėra pamainos
                                         </div>
                                     )}
                                </div>
                            </div>
                        );
                    })}
                 </div>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ShiftManagerView;
