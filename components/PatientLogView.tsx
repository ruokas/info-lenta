
import React, { useState } from 'react';
import { PatientLogEntry, Staff, MedicationStatus } from '../types';
import { TRIAGE_COLORS } from '../constants';
import { Search, FileText, Filter, X, Microscope, FileImage, ClipboardList, ChevronDown, ChevronUp, Pill, AlertCircle, CheckCircle, Waves, HeartPulse } from 'lucide-react';

interface PatientLogViewProps {
  logs: PatientLogEntry[];
  doctors: Staff[];
}

const PatientLogView: React.FC<PatientLogViewProps> = ({ logs, doctors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const filteredLogs = logs.filter(log => {
    // 1. Text Search
    const matchesSearch = 
      log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.treatedByDoctorName && log.treatedByDoctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.symptoms.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Doctor Filter
    let matchesDoctor = true;
    if (selectedDoctorId !== 'ALL') {
      const doctorName = doctors.find(d => d.id === selectedDoctorId)?.name;
      // Match exactly by name since log stores name string
      matchesDoctor = log.treatedByDoctorName === doctorName;
    }

    // 3. Category Filter
    let matchesCategory = true;
    if (selectedCategory !== 'ALL') {
      matchesCategory = log.triageCategory === parseInt(selectedCategory);
    }

    // 4. Date Range Filter
    let matchesDate = true;
    const logDate = new Date(log.dischargeTime);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) matchesDate = false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) matchesDate = false;
    }

    return matchesSearch && matchesDoctor && matchesCategory && matchesDate;
  }).sort((a, b) => new Date(b.dischargeTime).getTime() - new Date(a.dischargeTime).getTime());

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedDoctorId('ALL');
    setSelectedCategory('ALL');
  };

  const toggleExpand = (id: string) => {
    if (expandedRowId === id) setExpandedRowId(null);
    else setExpandedRowId(id);
  };

  const hasActiveFilters = searchTerm || startDate || endDate || selectedDoctorId !== 'ALL' || selectedCategory !== 'ALL';

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg"><FileText size={24} className="text-blue-400" /></div>
          Pacientų istorija (Log)
        </h2>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm font-semibold uppercase tracking-wider">
          <Filter size={14} /> Filtrai
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Text Search */}
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <input 
               type="text" 
               placeholder="Ieškoti vardo, simptomų..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
             />
          </div>

          {/* Date Range */}
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nuo"
          />
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Iki"
          />

          {/* Doctor Select */}
          <select 
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Visi gydytojai</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>

          {/* Category Select */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Visos kategorijos</option>
            <option value="1">1 - Reanimacinė</option>
            <option value="2">2 - Skubi (Raudona)</option>
            <option value="3">3 - Skubi (Geltona)</option>
            <option value="4">4 - Standartinė</option>
            <option value="5">5 - Neskubi</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
            >
              <X size={14} /> Išvalyti filtrus
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-slate-800 w-10"></th>
                <th className="px-4 py-3 border-b border-slate-800">Išrašymo laikas</th>
                <th className="px-4 py-3 border-b border-slate-800">Pacientas</th>
                <th className="px-4 py-3 border-b border-slate-800 text-center">Kat.</th>
                <th className="px-4 py-3 border-b border-slate-800 text-center">Veiksmai</th>
                <th className="px-4 py-3 border-b border-slate-800">Simptomai</th>
                <th className="px-4 py-3 border-b border-slate-800">Gydytojas</th>
                <th className="px-4 py-3 border-b border-slate-800">Trukmė</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 italic">
                    Įrašų nerasta pagal pasirinktus kriterijus.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedRowId === log.id;
                  
                  // Helper to safely access actionsSummary (or newer 'actions' field) for the icon column
                  const actionTypes = log.actions 
                    ? log.actions.map(a => a.type) 
                    : [];

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`hover:bg-slate-800/50 transition cursor-pointer ${isExpanded ? 'bg-slate-800/50' : ''}`}
                        onClick={() => toggleExpand(log.id)}
                      >
                        <td className="px-4 py-3 text-slate-500">
                           {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-xs">
                          {new Date(log.dischargeTime).toLocaleString('lt-LT')}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {log.patientName}
                        </td>
                        <td className="px-4 py-3 text-center">
                           <span className={`inline-block w-6 h-6 leading-6 rounded font-bold text-xs ${TRIAGE_COLORS[log.triageCategory]}`}>
                             {log.triageCategory}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                           {actionTypes.length > 0 && (
                              <div className="flex justify-center gap-1">
                                 {actionTypes.includes('LABS') && (
                                   <span title="Tyrimai">
                                     <Microscope size={14} className="text-blue-400" />
                                   </span>
                                 )}
                                 {(actionTypes.includes('XRAY') || actionTypes.includes('CT')) && (
                                   <span title="Radiologija">
                                     <FileImage size={14} className="text-yellow-400" />
                                   </span>
                                 )}
                                 {actionTypes.includes('ULTRASOUND') && (
                                   <span title="Ultragarsas">
                                     <Waves size={14} className="text-cyan-400" />
                                   </span>
                                 )}
                                 {actionTypes.includes('EKG') && (
                                   <span title="EKG">
                                     <HeartPulse size={14} className="text-red-400" />
                                   </span>
                                 )}
                                 {actionTypes.includes('CONSULT') && (
                                   <span title="Konsultacija">
                                     <ClipboardList size={14} className="text-purple-400" />
                                   </span>
                                 )}
                              </div>
                           )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                          {log.symptoms}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {log.treatedByDoctorName || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          {log.totalDuration}
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-900/80 border-b border-slate-800">
                           <td colSpan={8} className="px-8 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1">
                                 
                                 {/* Medications */}
                                 <div className="space-y-2">
                                    <h4 className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                                       <Pill size={14} /> Paskirti vaistai
                                    </h4>
                                    {log.medications && log.medications.length > 0 ? (
                                       <ul className="space-y-1">
                                          {log.medications.map((med, idx) => {
                                            const isGiven = med.status === MedicationStatus.GIVEN;
                                            return (
                                             <li key={idx} className="text-sm bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50 flex justify-between items-center">
                                                <div>
                                                  <span className="text-slate-200 font-medium">{med.name}</span>
                                                  <span className="text-slate-500 text-xs ml-2">{med.dose} {med.route}</span>
                                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                                     Paskirta: {formatTime(med.orderedAt)}
                                                  </div>
                                                </div>
                                                {isGiven && (
                                                  <div className="text-right">
                                                     <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                                        <CheckCircle size={10} /> SULEISTA
                                                     </div>
                                                     <div className="text-[10px] text-slate-500">
                                                        {formatTime(med.administeredAt)}
                                                     </div>
                                                  </div>
                                                )}
                                                {med.status === MedicationStatus.CANCELLED && (
                                                   <span className="text-xs text-slate-500 line-through">Atšaukta</span>
                                                )}
                                             </li>
                                            );
                                          })}
                                       </ul>
                                    ) : (
                                       <p className="text-xs text-slate-600 italic">Vaistų nepaskirta.</p>
                                    )}
                                    
                                    {/* Allergies */}
                                    {log.allergies && (
                                       <div className="mt-4 flex items-start gap-2 text-red-300 bg-red-900/10 p-2 rounded border border-red-900/30">
                                          <AlertCircle size={14} className="mt-0.5" />
                                          <div className="text-xs">
                                             <span className="font-bold uppercase">Alergijos:</span> {log.allergies}
                                          </div>
                                       </div>
                                    )}
                                 </div>

                                 {/* Clinical Actions */}
                                 <div className="space-y-2">
                                    <h4 className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                                       <ClipboardList size={14} /> Atlikti veiksmai
                                    </h4>
                                    {log.actions && log.actions.length > 0 ? (
                                       <ul className="space-y-1">
                                          {log.actions.map((act, idx) => (
                                             <li key={idx} className="text-sm bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50 flex justify-between items-center">
                                                <div>
                                                   <span className={`text-slate-200 ${act.isCompleted ? '' : 'text-slate-400'}`}>{act.name}</span>
                                                   <div className="text-[10px] uppercase text-slate-500 tracking-wider">{act.type}</div>
                                                </div>
                                                <div className="text-right">
                                                   {act.isCompleted ? (
                                                      <>
                                                         <span className="text-green-500 text-[10px] font-bold">ATLIKTA</span>
                                                         <div className="text-[10px] text-slate-500">{formatTime(act.completedAt)}</div>
                                                      </>
                                                   ) : (
                                                      <span className="text-yellow-600 text-[10px]">Vykdoma...</span>
                                                   )}
                                                </div>
                                             </li>
                                          ))}
                                       </ul>
                                    ) : (
                                       <p className="text-xs text-slate-600 italic">Veiksmų neregistruota.</p>
                                    )}
                                 </div>
                              </div>
                           </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientLogView;