
import React, { useState, useMemo, useEffect } from 'react';
import { Bed, PatientStatus, TriageCategory, Staff, WorkShift } from '../types';
import { X, UserPlus, AlertTriangle, CheckCircle, Search, Sparkles, Filter, Stethoscope, LayoutGrid } from 'lucide-react';
import { TRIAGE_COLORS } from '../constants';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  beds: Bed[];
  doctors: Staff[];
  workShifts: WorkShift[];
  onSubmit: (data: { name: string; symptoms: string; triageCategory: TriageCategory; bedId: string; assignedDoctorId?: string }) => void;
}

const TriageModal: React.FC<TriageModalProps> = ({ isOpen, onClose, beds, doctors, workShifts, onSubmit }) => {
  const [name, setName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [category, setCategory] = useState<TriageCategory | 0>(0);
  
  // Bed Selection State
  const [selectedBedId, setSelectedBedId] = useState('');
  const [bedSearch, setBedSearch] = useState('');
  const [selectedBedCategory, setSelectedBedCategory] = useState('ALL');

  // Doctor Selection State
  const [assignedDoctorId, setAssignedDoctorId] = useState('');
  const [suggestedDoctor, setSuggestedDoctor] = useState<{id: string, name: string, score: number} | null>(null);

  // Bed Filters Definitions
  const BED_FILTERS = [
    { id: 'ALL', label: 'Visos' },
    { id: 'MONITOR', label: 'Mon' },
    { id: 'IT', label: 'IT' },
    { id: 'ISO', label: 'Iso' },
    { id: 'EXTRA', label: 'Pap' },
    { id: 'SEATED', label: 'Sėd' },
    { id: 'RESERVE', label: 'Rez' },
  ];

  // Filter Active Doctors
  const activeDoctors = useMemo(() => {
    return doctors.filter(d => d.role === 'Doctor' && d.isActive !== false);
  }, [doctors]);

  // Filter empty beds
  const emptyBeds = useMemo(() => {
    return beds.filter(b => b.status === PatientStatus.EMPTY);
  }, [beds]);

  const getBedCategory = (label: string) => {
    if (['121A', '121B', 'IZO'].includes(label)) return 'ISO';
    if (label.startsWith('IT')) return 'IT';
    if (label.startsWith('P')) return 'EXTRA';
    if (label.startsWith('S')) return 'SEATED';
    if (label.startsWith('R')) return 'RESERVE';
    if (label.startsWith('A') && !label.startsWith('Arm')) return 'AMB';
    // Check if numeric (1-17)
    if (!isNaN(parseInt(label))) return 'MONITOR';
    return 'OTHER';
  };

  const filteredBeds = useMemo(() => {
    return emptyBeds.filter(b => {
        const matchesSearch = b.label.toLowerCase().includes(bedSearch.toLowerCase());
        
        let matchesCategory = true;
        if (selectedBedCategory !== 'ALL') {
            const cat = getBedCategory(b.label);
            matchesCategory = cat === selectedBedCategory;
        }

        return matchesSearch && matchesCategory;
    });
  }, [emptyBeds, bedSearch, selectedBedCategory]);

  // --- ARPA 2.0 Logic (Simplified for Triage) ---
  const calculateArpaSuggestions = () => {
    const now = new Date().getTime();

    const scores = activeDoctors.map(doc => {
      const docBeds = beds.filter(b => b.assignedDoctorId === doc.id && b.status !== PatientStatus.EMPTY && b.patient);
      
      let load = 0;
      let dischargeCount = 0;
      let latestArrival = 0;

      docBeds.forEach(b => {
        const p = b.patient!;
        const wEsi = (6 - p.triageCategory); 
        const wStatus = b.status === PatientStatus.DISCHARGE ? 0.6 : 1.0;
        if (b.status === PatientStatus.DISCHARGE) dischargeCount++;

        const [h, m] = p.arrivalTime.split(':').map(Number);
        const arrivalDate = new Date();
        arrivalDate.setHours(h, m, 0, 0);
        let diff = new Date().getTime() - arrivalDate.getTime();
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        const minutesSince = diff / 60000;
        const ageBump = Math.min(minutesSince / 60, 2) * 0.15;

        load += wEsi * wStatus * (1 + ageBump);
        if (arrivalDate.getTime() > latestArrival) latestArrival = arrivalDate.getTime();
      });

      let recencyPenalty = 0;
      if (latestArrival > 0) {
        const minutesSinceLast = (new Date().getTime() - latestArrival) / 60000;
        if (minutesSinceLast < 20) recencyPenalty = 1.5; 
      }

      const maxSimul = 5;
      let capacityPenalty = docBeds.length >= maxSimul ? 3.0 : 0;

      let dischargeRelief = 0;
      if (docBeds.length >= 2 && dischargeCount > 0) {
          const p = dischargeCount / docBeds.length;
          dischargeRelief = -Math.min(0.5, p * 0.8);
      }

      if (workShifts) {
          const shift = workShifts.find(s => s.doctorId === doc.id);
          if (shift) {
              const shiftEnd = new Date(shift.end).getTime();
              const minsRemaining = (shiftEnd - now) / 60000;
              if (minsRemaining > 0 && minsRemaining < 60) {
                  capacityPenalty += 50; 
              }
          }
      }

      const totalScore = load + recencyPenalty + capacityPenalty + dischargeRelief;
      return { id: doc.id, name: doc.name, score: totalScore };
    });

    scores.sort((a, b) => a.score - b.score);
    
    if (scores.length > 0) {
        setSuggestedDoctor(scores[0]);
        setAssignedDoctorId(scores[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !selectedBedId) return;

    onSubmit({
      name,
      symptoms,
      triageCategory: category,
      bedId: selectedBedId,
      assignedDoctorId: assignedDoctorId || undefined
    });
  };

  const ESI_DESC = {
      1: "Neatidėliotina intervencija",
      2: "Didelė rizika / Sunkus skausmas",
      3: "Daug resursų (2+ tyrimai)",
      4: "Vienas resursas",
      5: "Nereikia resursų"
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="bg-slate-900 sm:border border-slate-700 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-6xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-center shrink-0 safe-area-pt">
           <div className="flex items-center gap-3">
              <span className="bg-blue-600 p-2 rounded-xl text-white"><UserPlus size={24}/></span>
              <div>
                <h2 className="text-xl font-bold text-white leading-none">Naujas Pacientas</h2>
                <p className="text-slate-400 text-xs mt-1">Greita registracija</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition bg-slate-900 border border-slate-800">
             <X size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-950">
           <form id="triage-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full">
              
              {/* LEFT COLUMN: Patient Info */}
              <div className="flex flex-col gap-4">
                 <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 shadow-sm">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vardas Pavardė</label>
                        <input 
                          type="text" 
                          autoFocus
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                          placeholder="Įveskite vardą..."
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Simptomai</label>
                        <input
                          type="text" 
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                          placeholder="Pagrindiniai nusiskundimai..."
                        />
                     </div>

                     {/* Doctor Selection with ARPA */}
                     <div>
                         <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Gydytojas</label>
                            <button 
                                type="button" 
                                onClick={calculateArpaSuggestions}
                                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-white bg-blue-900/20 hover:bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-800 hover:border-blue-500 transition font-bold"
                            >
                                <Sparkles size={14} />
                                Siūlyti (ARPA)
                            </button>
                         </div>
                         <div className="relative">
                            <Stethoscope className="absolute left-4 top-3.5 text-slate-500" size={18} />
                            <select
                                value={assignedDoctorId}
                                onChange={(e) => setAssignedDoctorId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">-- Nepriskirta --</option>
                                {activeDoctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                ))}
                            </select>
                         </div>
                         {suggestedDoctor && (
                            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 bg-emerald-900/10 p-2 rounded-lg border border-emerald-900/30">
                                <Sparkles size={12} />
                                <span>Siūloma: <strong>{suggestedDoctor.name}</strong> (Balas: {suggestedDoctor.score.toFixed(1)})</span>
                            </div>
                         )}
                     </div>
                 </div>

                 <div className="flex-1 bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col shadow-sm">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Skubos Kategorija (ESI)</label>
                    <div className="flex flex-col gap-2.5 h-full overflow-y-auto">
                       {[1, 2, 3, 4, 5].map((cat) => {
                         const catNum = cat as keyof typeof ESI_DESC;
                         const isSelected = category === cat;
                         
                         return (
                         <button
                           key={cat}
                           type="button"
                           onClick={() => setCategory(cat as TriageCategory)}
                           className={`
                             relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 group
                             ${isSelected
                                ? `${TRIAGE_COLORS[cat]} border-transparent shadow-lg scale-[1.01]` 
                                : `bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-slate-600`}
                           `}
                         >
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl border-2 shrink-0
                                ${isSelected
                                    ? 'border-white/30 bg-white/10' 
                                    : `${TRIAGE_COLORS[cat]} border-transparent shadow-sm`}
                            `}>
                                {cat}
                            </div>
                            
                            <div className="flex-1 text-left">
                                <div className={`text-base font-bold uppercase leading-tight ${
                                    isSelected
                                        ? (cat === 3 || cat === 5 ? 'text-slate-900' : 'text-white') 
                                        : 'text-slate-300'
                                }`}>
                                    {ESI_DESC[catNum]}
                                </div>
                            </div>

                            {isSelected && (
                                <CheckCircle className={`${cat === 3 || cat === 5 ? 'text-slate-900' : 'text-white'}`} size={28} />
                            )}
                         </button>
                       )})}
                    </div>
                 </div>
              </div>

              {/* RIGHT COLUMN: Bed Selection */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col h-full overflow-hidden shadow-sm">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                    <label className="text-sm font-bold text-slate-400 uppercase">Pasirinkite Lovą</label>
                    <div className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">Laisva: {emptyBeds.length}</div>
                 </div>

                 {/* Filters */}
                 <div className="flex flex-col gap-3 mb-4 shrink-0">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                        type="text" 
                        placeholder="Ieškoti lovos..." 
                        value={bedSearch}
                        onChange={(e) => setBedSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-base text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                     
                     <div className="flex flex-wrap gap-2">
                        {BED_FILTERS.map(filter => (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => setSelectedBedCategory(filter.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedBedCategory === filter.id ? 'bg-blue-600 border-blue-500 text-white shadow-sm' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                          >
                            {filter.label}
                          </button>
                        ))}
                     </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-3 content-start min-h-[200px]">
                    {filteredBeds.map(bed => {
                       const isAmb = bed.label.startsWith('A') && !bed.label.startsWith('Arm');
                       const isR = bed.label.startsWith('R');
                       return (
                       <button
                         key={bed.id}
                         type="button"
                         onClick={() => setSelectedBedId(bed.id)}
                         className={`
                           p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 h-20 md:h-24
                           ${selectedBedId === bed.id 
                             ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105 z-10' 
                             : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-600'}
                           ${isAmb && selectedBedId !== bed.id ? 'border-amber-900/30' : ''}
                           ${isR && selectedBedId !== bed.id ? 'border-purple-900/30 bg-purple-900/10' : ''}
                         `}
                       >
                          <span className="text-xl md:text-2xl font-bold">{bed.label}</span>
                          <span className={`text-[10px] uppercase font-bold opacity-70 truncate max-w-full px-1 ${isAmb ? 'text-amber-500' : isR ? 'text-purple-400' : 'text-slate-500'}`}>{bed.section}</span>
                       </button>
                    )})}
                    {filteredBeds.length === 0 && (
                       <div className="col-span-full text-center py-12 text-slate-500 italic text-sm border-2 border-dashed border-slate-800 rounded-xl">
                          Nerasta laisvų lovų.
                       </div>
                    )}
                 </div>
              </div>

           </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex justify-end gap-3 shrink-0 safe-area-pb">
           <button 
             type="button" 
             onClick={onClose}
             className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
           >
             Atšaukti
           </button>
           <button 
             type="submit"
             form="triage-form"
             disabled={!name || !category || !selectedBedId}
             className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xl shadow-blue-900/30 transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-base"
           >
             <UserPlus size={20} />
             Registruoti
           </button>
        </div>

      </div>
    </div>
  );
};

export default TriageModal;
