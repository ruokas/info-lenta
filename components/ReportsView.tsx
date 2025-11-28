
import React, { useState, useMemo } from 'react';
import { RegistrationLog, Staff } from '../types';
import { FileBarChart, Calendar, Download, Printer, Filter, Moon, Sun, Clock } from 'lucide-react';
import { TRIAGE_COLORS } from '../constants';

interface ReportsViewProps {
  registrationLogs: RegistrationLog[];
  nurses: Staff[];
}

interface NurseStats {
  nurseId: string;
  nurseName: string;
  total: number;
  dayCount: number; // 08:00 - 20:00
  nightCount: number; // 20:00 - 08:00
  categories: Record<number, number>;
}

const ReportsView: React.FC<ReportsViewProps> = ({ registrationLogs, nurses }) => {
  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedNurseId, setSelectedNurseId] = useState('ALL');

  const getNurseName = (id: string) => {
    const nurse = nurses.find(n => n.id === id);
    return nurse ? nurse.name : 'Nežinomas / Ištrintas';
  };

  const isNightShift = (date: Date) => {
    const hour = date.getHours();
    return hour >= 20 || hour < 8;
  };

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyQuickFilter = (type: 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'TODAY') {
        // Start and end are today
    } else if (type === 'THIS_MONTH') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (type === 'LAST_MONTH') {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (type === 'THIS_YEAR') {
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const statistics = useMemo(() => {
    const statsMap: Record<string, NurseStats> = {};
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    registrationLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      
      // Filter by date
      if (logDate < start || logDate > end) return;

      // Filter by Nurse
      if (selectedNurseId !== 'ALL' && log.nurseId !== selectedNurseId) return;

      if (!statsMap[log.nurseId]) {
        statsMap[log.nurseId] = {
          nurseId: log.nurseId,
          nurseName: getNurseName(log.nurseId),
          total: 0,
          dayCount: 0,
          nightCount: 0,
          categories: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const entry = statsMap[log.nurseId];
      entry.total += 1;
      
      if (isNightShift(logDate)) {
        entry.nightCount += 1;
      } else {
        entry.dayCount += 1;
      }

      if (log.triageCategory >= 1 && log.triageCategory <= 5) {
        entry.categories[log.triageCategory] += 1;
      }
    });

    return Object.values(statsMap).sort((a, b) => b.total - a.total);
  }, [registrationLogs, startDate, endDate, selectedNurseId, nurses]);

  const totalPeriodRegs = statistics.reduce((acc, curr) => acc + curr.total, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-lg"><FileBarChart size={24} className="text-emerald-500" /></div>
            Triažo Ataskaitos
            </h2>
            <p className="text-slate-400 text-sm mt-1">Registruotų pacientų suvestinė pagal slaugytojus ir laikotarpį</p>
        </div>
        
        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 print:hidden"
        >
            <Printer size={18} /> Spausdinti
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm print:hidden shrink-0">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                <Filter size={14} /> Filtravimo nustatymai
            </div>
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => applyQuickFilter('TODAY')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition">Šiandien</button>
                <button onClick={() => applyQuickFilter('THIS_MONTH')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition">Šis mėnuo</button>
                <button onClick={() => applyQuickFilter('LAST_MONTH')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition">Praėjęs mėnuo</button>
                <button onClick={() => applyQuickFilter('THIS_YEAR')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition">Šie metai</button>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nuo</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Iki</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Slaugytojas</label>
                <select 
                    value={selectedNurseId}
                    onChange={(e) => setSelectedNurseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                    <option value="ALL">Visi slaugytojai</option>
                    {nurses.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                </select>
            </div>
         </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm print:border-0 print:shadow-none print:bg-white">
         <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center print:bg-white print:text-black print:border-black">
            <h3 className="font-bold text-slate-200 print:text-black">Rezultatai</h3>
            <div className="text-sm text-slate-400 print:text-black">
                Viso registracijų per laikotarpį: <span className="text-emerald-400 font-bold print:text-black">{totalPeriodRegs}</span>
            </div>
         </div>
         
         <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-sm text-left print:text-black">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold sticky top-0 z-10 print:bg-gray-100 print:text-black">
                    <tr>
                        <th className="px-4 py-3 border-b border-slate-800 print:border-gray-300">Slaugytojas</th>
                        <th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300">Viso Pacientų</th>
                        <th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300 bg-blue-900/10 text-blue-300 print:bg-transparent print:text-black"><Sun size={14} className="inline mr-1"/> Diena (08-20)</th>
                        <th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300 bg-indigo-900/10 text-indigo-300 print:bg-transparent print:text-black"><Moon size={14} className="inline mr-1"/> Naktis (20-08)</th>
                        <th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300 w-64">Kategorijų pasiskirstymas</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                    {statistics.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">Duomenų nerasta pasirinktu laikotarpiu.</td>
                        </tr>
                    ) : (
                        statistics.map(stat => (
                            <tr key={stat.nurseId} className="hover:bg-slate-800/50 print:hover:bg-transparent">
                                <td className="px-4 py-3 font-medium text-slate-200 print:text-black border-r border-slate-800/50 print:border-gray-200">
                                    {stat.nurseName}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-emerald-400 print:text-black border-r border-slate-800/50 print:border-gray-200 text-lg">
                                    {stat.total}
                                </td>
                                <td className="px-4 py-3 text-center border-r border-slate-800/50 print:border-gray-200 text-blue-300 print:text-black">
                                    {stat.dayCount} <span className="text-[10px] opacity-60">({Math.round((stat.dayCount/stat.total)*100)}%)</span>
                                </td>
                                <td className="px-4 py-3 text-center border-r border-slate-800/50 print:border-gray-200 text-indigo-300 print:text-black">
                                    {stat.nightCount} <span className="text-[10px] opacity-60">({Math.round((stat.nightCount/stat.total)*100)}%)</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex h-4 w-full rounded overflow-hidden">
                                        {[1, 2, 3, 4, 5].map(cat => {
                                            const count = stat.categories[cat];
                                            if (count === 0) return null;
                                            const width = (count / stat.total) * 100;
                                            return (
                                                <div 
                                                    key={cat} 
                                                    className={`${TRIAGE_COLORS[cat]} h-full`} 
                                                    style={{ width: `${width}%` }}
                                                    title={`Kat ${cat}: ${count} (${Math.round(width)}%)`}
                                                ></div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-slate-500 print:text-black">
                                        <span>Sunkūs (1-2): {stat.categories[1] + stat.categories[2]}</span>
                                        <span>Lengvi (3-5): {stat.categories[3] + stat.categories[4] + stat.categories[5]}</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ReportsView;
