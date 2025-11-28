
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
    { id: 'MONITOR', label: 'Monitor (1-17)' },
    { id: 'IT', label: 'IT (Reanim)' },
    { id: 'ISO', label: 'Izoliacinės' },
    { id: 'EXTRA', label: 'Papildomos (P)' },
    { id: 'SEATED', label: 'Sėdimos (S)' },
    { id: 'RESERVE', label: 'Rezervinės (R)' },
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
      1: "Reikia neatidėliotinos intervencijos gyvybei gelbėti",
      2: "Didelė rizika, sąmonės sutrikimas arba stiprus skausmas",
      3: "Reikia daug resursų (2 ar daugiau tyrimų/procedūrų)",
      4: "Reikia vieno resurso (1 tyrimas/procedūra)",
      5: "Nereikia resursų (tik apžiūra/receptas)"
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
           <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-blue-600 p-2 rounded-lg"><UserPlus size={24}/></span>
                Naujas Pacientas
              </h2>
              <p className="text-slate-400 text-sm mt-1">Greita registracija (Triažas)</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
             <X size={28} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
           <form id="triage-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* LEFT COLUMN: Patient Info */}
              <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vardas Pavardė</label>
                    <input 
                      type="text" 
                      autoFocus
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                      placeholder="Įveskite vardą..."
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Simptomai</label>
                    <textarea 
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
                      placeholder="Pagrindiniai nusiskundimai..."
                    />
                 </div>

                 {/* Doctor Selection with ARPA */}
                 <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Gydytojas (Pasirinktinai)</label>
                        <button 
                            type="button" 
                            onClick={calculateArpaSuggestions}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-white bg-blue-900/20 hover:bg-blue-600 px-2 py-1 rounded border border-blue-800 hover:border-blue-500 transition"
                        >
                            <Sparkles size={12} />
                            Siūlyti (ARPA)
                        </button>
                     </div>
                     <div className="relative">
                        <Stethoscope className="absolute left-3 top-3 text-slate-500" size={18} />
                        <select
                            value={assignedDoctorId}
                            onChange={(e) => setAssignedDoctorId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">-- Nepriskirta --</option>
                            {activeDoctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                     </div>
                     {suggestedDoctor && (
                        <div className="mt-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-900/50 p-2 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Sparkles size={12} />
                            <span>Siūloma: <strong>{suggestedDoctor.name}</strong> (Balas: {suggestedDoctor.score.toFixed(1)})</span>
                        </div>
                     )}
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Skubos Kategorija (ESI)</label>
                    <div className="grid grid-cols-1 gap-3">
                       {[1, 2, 3, 4, 5].map((cat) => (
                         <button
                           key={cat}
                           type="button"
                           onClick={() => setCategory(cat as TriageCategory)}
                           className={`
                             relative p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                             ${category === cat 
                                ? 'border-white bg-slate-800 scale-[1.02] shadow-xl' 
                                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-slate-700'}
                           `}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold shadow-lg shrink-0 ${TRIAGE_COLORS[cat]}`}>
                                  {cat}
                               </div>
                               <div>
                                  <div className={`font-bold text-sm ${category === cat ? 'text-white' : 'text-slate-300'}`}>
                                     {ESI_DESC[cat as keyof typeof ESI_DESC]}
                                  </div>
                               </div>
                            </div>
                            {category === cat && <CheckCircle className="text-green-500" size={24} />}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              {/* RIGHT COLUMN: Bed Selection */}
              <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-6 flex flex-col h-full overflow-hidden">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                    <label className="text-sm font-bold text-slate-400 uppercase">Pasirinkite Lovą</label>
                    <div className="text-xs text-slate-500 font-mono">Laisva: {emptyBeds.length}</div>
                 </div>

                 {/* Filters */}
                 <div className="flex flex-col gap-3 mb-4 shrink-0">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                        type="text" 
                        placeholder="Ieškoti lovos..." 
                        value={bedSearch}
                        onChange={(e) => setBedSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-2 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                     </div>
                     
                     <div className="flex flex-wrap gap-2">
                        {BED_FILTERS.map(filter => (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => setSelectedBedCategory(filter.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedBedCategory === filter.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                          >
                            {filter.label}
                          </button>
                        ))}
                     </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
                    {filteredBeds.map(bed => {
                       const isAmb = bed.label.startsWith('A') && !bed.label.startsWith('Arm');
                       const isR = bed.label.startsWith('R');
                       return (
                       <button
                         key={bed.id}
                         type="button"
                         onClick={() => setSelectedBedId(bed.id)}
                         className={`
                           p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1
                           ${selectedBedId === bed.id 
                             ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40 scale-105' 
                             : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'}
                           ${isAmb && selectedBedId !== bed.id ? 'border-amber-900/30' : ''}
                           ${isR && selectedBedId !== bed.id ? 'border-purple-900/30 bg-purple-900/10' : ''}
                         `}
                       >
                          <span className="text-xl font-bold">{bed.label}</span>
                          <span className={`text-[10px] uppercase opacity-70 truncate max-w-full px-1 ${isAmb ? 'text-amber-500' : isR ? 'text-purple-400' : ''}`}>{bed.section}</span>
                       </button>
                    )})}
                    {filteredBeds.length === 0 && (
                       <div className="col-span-full text-center py-10 text-slate-500 italic">
                          Nerasta laisvų lovų pagal filtrus.
                       </div>
                    )}
                 </div>
              </div>

           </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-5 border-t border-slate-800 flex justify-end gap-4 shrink-0">
           <button 
             type="button" 
             onClick={onClose}
             className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
           >
             Atšaukti
           </button>
           <button 
             type="submit"
             form="triage-form"
             disabled={!name || !category || !selectedBedId}
             className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xl shadow-blue-900/30 transition transform hover:scale-[1.02] flex items-center gap-2"
           >
             <UserPlus size={20} />
             Registruoti Pacientą
           </button>
        </div>

      </div>
    </div>
  );
};

export default TriageModal;
