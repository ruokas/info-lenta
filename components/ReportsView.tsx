
import React, { useState, useMemo } from 'react';
import { RegistrationLog, Staff, PatientLogEntry } from '../types';
import { FileBarChart, Calendar, Download, Printer, Filter, Moon, Sun, Clock, FileText, Activity, Users, ArrowRight } from 'lucide-react';
import { TRIAGE_COLORS } from '../constants';
import PatientLogView from './PatientLogView';

interface ReportsViewProps {
  registrationLogs: RegistrationLog[];
  nurses: Staff[];
  patientLogs: PatientLogEntry[]; // NEW
  doctors: Staff[]; // NEW
}

interface NurseStats {
  nurseId: string;
  nurseName: string;
  total: number;
  dayCount: number; // 08:00 - 20:00
  nightCount: number; // 20:00 - 08:00
  categories: Record<number, number>;
}

const ReportsView: React.FC<ReportsViewProps> = ({ registrationLogs, nurses, patientLogs, doctors }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'triage' | 'workload' | 'flow'>('triage');

  // Shared Date State
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedNurseId, setSelectedNurseId] = useState('ALL');

  // --- TRIAGE STATS LOGIC ---
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

  const triageStats = useMemo(() => {
    const statsMap: Record<string, NurseStats> = {};
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    registrationLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      
      if (logDate < start || logDate > end) return;
      if (selectedNurseId !== 'ALL' && log.nurseId !== selectedNurseId) return;

      if (!statsMap[log.nurseId]) {
        statsMap[log.nurseId] = {
          nurseId: log.nurseId,
          nurseName: getNurseName(log.nurseId),
          total: 0, dayCount: 0, nightCount: 0,
          categories: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const entry = statsMap[log.nurseId];
      entry.total += 1;
      
      if (isNightShift(logDate)) entry.nightCount += 1;
      else entry.dayCount += 1;

      if (log.triageCategory >= 1 && log.triageCategory <= 5) {
        entry.categories[log.triageCategory] += 1;
      }
    });

    return Object.values(statsMap).sort((a, b) => b.total - a.total);
  }, [registrationLogs, startDate, endDate, selectedNurseId, nurses]);

  const totalPeriodRegs = triageStats.reduce((acc, curr) => acc + curr.total, 0);

  // --- DOCTOR WORKLOAD LOGIC ---
  const doctorStats = useMemo(() => {
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);

      const stats: Record<string, { name: string, count: number, critical: number, totalMins: number }> = {};

      patientLogs.forEach(log => {
          const discharge = new Date(log.dischargeTime);
          if (discharge < start || discharge > end) return;
          
          const docName = log.treatedByDoctorName || 'Nežinomas';
          if (!stats[docName]) stats[docName] = { name: docName, count: 0, critical: 0, totalMins: 0 };
          
          stats[docName].count++;
          if (log.triageCategory <= 2) stats[docName].critical++;
          
          // Parse duration "Xh Ym"
          if (log.totalDuration) {
              const parts = log.totalDuration.split(' ');
              let mins = 0;
              parts.forEach(p => {
                  if (p.includes('h')) mins += parseInt(p) * 60;
                  if (p.includes('m')) mins += parseInt(p);
              });
              stats[docName].totalMins += mins;
          }
      });

      return Object.values(stats).map(s => ({
          ...s,
          avgDuration: s.count > 0 ? Math.round(s.totalMins / s.count) : 0
      })).sort((a,b) => b.count - a.count);
  }, [patientLogs, startDate, endDate]);

  // --- FLOW LOGIC (LOS & Severity) ---
  const detailedFlowStats = useMemo(() => {
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);
      
      const filtered = patientLogs.filter(l => {
          const d = new Date(l.dischargeTime);
          return d >= start && d <= end;
      });

      const total = filtered.length || 1; // Prevent division by zero
      
      // Basic Stats
      const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const avgPerDay = Math.round(filtered.length / daysDiff);
      const criticalCountBasic = filtered.filter(l => l.triageCategory <= 2).length;
      const criticalRate = Math.round((criticalCountBasic / total) * 100);

      // Detailed LOS Analysis
      const los = { less1: 0, _1_4: 0, _4_8: 0, more8: 0 };
      const severity = { critical: 0, standard: 0, light: 0 }; // Critical: 1-2, Standard: 3, Light: 4-5

      filtered.forEach(log => {
          // Duration Parsing
          let mins = 0;
          if (log.totalDuration) {
              const parts = log.totalDuration.split(' ');
              parts.forEach(p => {
                  if (p.includes('h')) mins += parseInt(p) * 60;
                  if (p.includes('m')) mins += parseInt(p);
              });
          }
          
          if (mins < 60) los.less1++;
          else if (mins < 240) los._1_4++;
          else if (mins < 480) los._4_8++;
          else los.more8++;

          // Severity Bucketing
          const cat = log.triageCategory;
          if (cat <= 2) severity.critical++;
          else if (cat === 3) severity.standard++;
          else severity.light++;
      });

      return { 
          total: filtered.length, 
          avgPerDay, 
          criticalRate,
          los: {
              less1: { count: los.less1, percent: Math.round((los.less1/total)*100) },
              _1_4: { count: los._1_4, percent: Math.round((los._1_4/total)*100) },
              _4_8: { count: los._4_8, percent: Math.round((los._4_8/total)*100) },
              more8: { count: los.more8, percent: Math.round((los.more8/total)*100) }
          },
          severity: {
              critical: { count: severity.critical, percent: Math.round((severity.critical/total)*100) },
              standard: { count: severity.standard, percent: Math.round((severity.standard/total)*100) },
              light: { count: severity.light, percent: Math.round((severity.light/total)*100) }
          }
      };
  }, [patientLogs, startDate, endDate]);

  const handlePrint = () => { window.print(); };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20px;
            background-color: white !important;
            color: black !important;
            overflow: visible !important;
            z-index: 9999;
          }
          /* Reset dark mode styles for print */
          #printable-area .bg-slate-900, 
          #printable-area .bg-slate-950,
          #printable-area .bg-slate-800 {
            background-color: white !important;
            color: black !important;
            border-color: #ddd !important;
          }
          #printable-area .text-slate-400,
          #printable-area .text-slate-200,
          #printable-area .text-slate-300,
          #printable-area .text-slate-500 {
            color: black !important;
          }
          /* Hide scrollbars */
          ::-webkit-scrollbar { display: none; }
          /* Hide buttons */
          button { display: none !important; }
        }
      `}</style>

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 shrink-0 print:hidden">
        <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><FileBarChart size={24} className="text-emerald-500" /></div>
                Ataskaitų Centras
            </h2>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><FileText size={16}/> Istorija</button>
            <button onClick={() => setActiveTab('triage')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'triage' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Activity size={16}/> Triažas</button>
            <button onClick={() => setActiveTab('workload')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'workload' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Users size={16}/> Krūvis</button>
            <button onClick={() => setActiveTab('flow')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'flow' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><ArrowRight size={16}/> Srautas</button>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700"><Printer size={18} /> Spausdinti</button>
      </div>

      {/* --- SHARED FILTERS FOR STATS TABS (NOT HISTORY) --- */}
      {activeTab !== 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm print:hidden shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold uppercase tracking-wider"><Filter size={14} /> Laikotarpis</div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => applyQuickFilter('TODAY')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700">Šiandien</button>
                    <button onClick={() => applyQuickFilter('THIS_MONTH')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700">Šis mėnuo</button>
                    <button onClick={() => applyQuickFilter('LAST_MONTH')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700">Praėjęs mėnuo</button>
                    <button onClick={() => applyQuickFilter('THIS_YEAR')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700">Šie metai</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Nuo</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"/></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Iki</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"/></div>
                {activeTab === 'triage' && (
                    <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Slaugytojas</label><select value={selectedNurseId} onChange={(e) => setSelectedNurseId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"><option value="ALL">Visi slaugytojai</option>{nurses.map(n => (<option key={n.id} value={n.id}>{n.name}</option>))}</select></div>
                )}
            </div>
        </div>
      )}

      {/* --- CONTENT AREA (WRAPPED FOR PRINT) --- */}
      <div id="printable-area" className="flex-1 overflow-auto custom-scrollbar flex flex-col">
        <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold text-black">
                {activeTab === 'history' ? 'Pacientų istorija' : 
                 activeTab === 'triage' ? 'Slaugytojų darbo ataskaita' : 
                 activeTab === 'workload' ? 'Gydytojų krūvio ataskaita' : 'Srauto ataskaita'}
            </h1>
            <p className="text-sm text-gray-600">Periodas: {startDate} - {endDate} | Sugeneruota: {new Date().toLocaleString()}</p>
            <hr className="my-2 border-gray-300"/>
        </div>

        {/* --- TAB 1: HISTORY (PatientLogView) --- */}
        {activeTab === 'history' && (
            <div className="flex-1 overflow-hidden -mx-6 -mb-6 print:mx-0 print:mb-0 print:overflow-visible">
                <PatientLogView logs={patientLogs} doctors={doctors} />
            </div>
        )}

        {/* --- TAB 2: TRIAGE STATS --- */}
        {activeTab === 'triage' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm print:bg-white print:border-none print:shadow-none print:overflow-visible h-full">
                <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center print:bg-white print:text-black print:border-black shrink-0">
                    <h3 className="font-bold text-slate-200 print:text-black">Slaugytojų darbo suvestinė</h3>
                    <div className="text-sm text-slate-400 print:text-black">Viso registracijų: <span className="text-emerald-400 font-bold print:text-black">{totalPeriodRegs}</span></div>
                </div>
                <div className="overflow-auto custom-scrollbar flex-1 print:overflow-visible">
                    <table className="w-full text-sm text-left print:text-black">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold sticky top-0 z-10 print:bg-gray-100 print:text-black print:static">
                            <tr><th className="px-4 py-3 border-b border-slate-800 print:border-gray-300">Slaugytojas</th><th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300">Viso</th><th className="px-4 py-3 border-b border-slate-800 text-center bg-blue-900/10 text-blue-300 print:text-black print:bg-transparent print:border-gray-300"><Sun size={14} className="inline mr-1"/> Diena</th><th className="px-4 py-3 border-b border-slate-800 text-center bg-indigo-900/10 text-indigo-300 print:text-black print:bg-transparent print:border-gray-300"><Moon size={14} className="inline mr-1"/> Naktis</th><th className="px-4 py-3 border-b border-slate-800 w-64 text-center print:border-gray-300">Kategorijos</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                            {triageStats.map(stat => (
                                <tr key={stat.nurseId} className="hover:bg-slate-800/50 print:hover:bg-transparent">
                                    <td className="px-4 py-3 font-medium text-slate-200 border-r border-slate-800/50 print:text-black print:border-gray-300">{stat.nurseName}</td>
                                    <td className="px-4 py-3 text-center font-bold text-emerald-400 border-r border-slate-800/50 text-lg print:text-black print:border-gray-300">{stat.total}</td>
                                    <td className="px-4 py-3 text-center border-r border-slate-800/50 text-blue-300 print:text-black print:border-gray-300">{stat.dayCount}</td>
                                    <td className="px-4 py-3 text-center border-r border-slate-800/50 text-indigo-300 print:text-black print:border-gray-300">{stat.nightCount}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex h-4 w-full rounded overflow-hidden print:border print:border-gray-300">{[1, 2, 3, 4, 5].map(cat => (stat.categories[cat] > 0 && <div key={cat} className={`${TRIAGE_COLORS[cat]} h-full print:bg-gray-500`} style={{ width: `${(stat.categories[cat]/stat.total)*100}%` }} title={`Kat ${cat}: ${stat.categories[cat]}`}></div>))}</div>
                                        <div className="hidden print:block text-xs mt-1 text-gray-500">
                                            {Object.entries(stat.categories).map(([cat, count]) => (count as number) > 0 && `K${cat}: ${count}`).join(', ')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB 3: DOCTOR WORKLOAD --- */}
        {activeTab === 'workload' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm print:bg-white print:border-none print:shadow-none print:overflow-visible h-full">
                <div className="p-4 bg-slate-950/50 border-b border-slate-800 print:bg-white print:border-black shrink-0"><h3 className="font-bold text-slate-200 print:text-black">Gydytojų Krūvio Analizė</h3></div>
                <div className="overflow-auto custom-scrollbar flex-1 print:overflow-visible">
                    <table className="w-full text-sm text-left print:text-black">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold sticky top-0 z-10 print:bg-gray-100 print:text-black print:static">
                            <tr><th className="px-4 py-3 border-b border-slate-800 print:border-gray-300">Gydytojas</th><th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300">Pacientų sk.</th><th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300">Sunkūs (1-2)</th><th className="px-4 py-3 border-b border-slate-800 text-center print:border-gray-300">Vid. Trukmė</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                            {doctorStats.map(stat => (
                                <tr key={stat.name} className="hover:bg-slate-800/50 print:hover:bg-transparent">
                                    <td className="px-4 py-3 font-medium text-slate-200 print:text-black">{stat.name}</td>
                                    <td className="px-4 py-3 text-center font-bold text-blue-400 text-lg print:text-black">{stat.count}</td>
                                    <td className="px-4 py-3 text-center"><span className="bg-red-900/20 text-red-400 px-2 py-1 rounded font-bold print:bg-transparent print:text-black print:border print:border-gray-300">{stat.critical} ({Math.round(stat.count ? (stat.critical/stat.count)*100 : 0)}%)</span></td>
                                    <td className="px-4 py-3 text-center text-slate-300 print:text-black">{Math.floor(stat.avgDuration / 60)}h {stat.avgDuration % 60}m</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- TAB 4: FLOW STATS (UPDATED) --- */}
        {activeTab === 'flow' && (
            <div className="space-y-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:block print:space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center print:bg-white print:border-gray-300 print:mb-4">
                        <div className="text-slate-500 text-sm uppercase font-bold mb-2 print:text-black">Viso pacientų</div>
                        <div className="text-5xl font-bold text-blue-500 print:text-black">{detailedFlowStats.total}</div>
                        <div className="text-slate-400 text-xs mt-2 print:text-gray-600">Per pasirinktą laikotarpį</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center print:bg-white print:border-gray-300 print:mb-4">
                        <div className="text-slate-500 text-sm uppercase font-bold mb-2 print:text-black">Vidutiniškai per dieną</div>
                        <div className="text-5xl font-bold text-emerald-500 print:text-black">{detailedFlowStats.avgPerDay}</div>
                        <div className="text-slate-400 text-xs mt-2 print:text-gray-600">Pacientų / 24h</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center print:bg-white print:border-gray-300">
                        <div className="text-slate-500 text-sm uppercase font-bold mb-2 print:text-black">Sunkių ligonių dalis</div>
                        <div className="text-5xl font-bold text-red-500 print:text-black">{detailedFlowStats.criticalRate}%</div>
                        <div className="text-slate-400 text-xs mt-2 print:text-gray-600">Kategorijos 1 ir 2</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
                    {/* LOS Chart */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm print:bg-white print:border-gray-300 print:break-inside-avoid">
                        <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2 print:text-black">
                            <Clock size={20} className="text-blue-500" /> Buvimo trukmės (LOS) analizė
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1 print:text-black">
                                    <span className="text-slate-400">Greiti (&lt; 1 val.)</span>
                                    <span className="font-bold text-slate-200">{detailedFlowStats.los.less1.count} ({detailedFlowStats.los.less1.percent}%)</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden print:bg-gray-200 border border-slate-700 print:border-gray-300">
                                    <div className="bg-emerald-500 h-full rounded-full print:bg-gray-600" style={{width: `${detailedFlowStats.los.less1.percent}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1 print:text-black">
                                    <span className="text-slate-400">Standartiniai (1 - 4 val.)</span>
                                    <span className="font-bold text-slate-200">{detailedFlowStats.los._1_4.count} ({detailedFlowStats.los._1_4.percent}%)</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden print:bg-gray-200 border border-slate-700 print:border-gray-300">
                                    <div className="bg-blue-500 h-full rounded-full print:bg-gray-500" style={{width: `${detailedFlowStats.los._1_4.percent}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1 print:text-black">
                                    <span className="text-slate-400">Užsitęsę (4 - 8 val.)</span>
                                    <span className="font-bold text-slate-200">{detailedFlowStats.los._4_8.count} ({detailedFlowStats.los._4_8.percent}%)</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden print:bg-gray-200 border border-slate-700 print:border-gray-300">
                                    <div className="bg-yellow-500 h-full rounded-full print:bg-gray-400" style={{width: `${detailedFlowStats.los._4_8.percent}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1 print:text-black">
                                    <span className="text-slate-400">Probleminiai (&gt; 8 val.)</span>
                                    <span className="font-bold text-slate-200">{detailedFlowStats.los.more8.count} ({detailedFlowStats.los.more8.percent}%)</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden print:bg-gray-200 border border-slate-700 print:border-gray-300">
                                    <div className="bg-red-600 h-full rounded-full print:bg-black" style={{width: `${detailedFlowStats.los.more8.percent}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Severity Structure */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm print:bg-white print:border-gray-300 print:break-inside-avoid">
                        <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2 print:text-black">
                            <Activity size={20} className="text-red-500" /> Pacientų sunkumo struktūra
                        </h3>
                        <div className="flex h-8 w-full rounded-lg overflow-hidden mb-6 flex bg-slate-800 border border-slate-700 print:border-gray-300">
                            {detailedFlowStats.severity.critical.percent > 0 && <div className="bg-red-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500 print:bg-black" style={{width: `${detailedFlowStats.severity.critical.percent}%`}} title="Reanimaciniai">{detailedFlowStats.severity.critical.percent}%</div>}
                            {detailedFlowStats.severity.standard.percent > 0 && <div className="bg-yellow-500 h-full flex items-center justify-center text-[10px] font-bold text-slate-900 transition-all duration-500 print:bg-gray-400" style={{width: `${detailedFlowStats.severity.standard.percent}%`}} title="Skubūs">{detailedFlowStats.severity.standard.percent}%</div>}
                            {detailedFlowStats.severity.light.percent > 0 && <div className="bg-green-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500 print:bg-gray-200 print:text-black" style={{width: `${detailedFlowStats.severity.light.percent}%`}} title="Lengvi">{detailedFlowStats.severity.light.percent}%</div>}
                        </div>
                        
                        <div className="space-y-4">
                             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 print:bg-white print:border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-600 print:bg-black"></div>
                                    <span className="text-sm text-slate-300 print:text-black">Reanimaciniai (1-2 Kat)</span>
                                </div>
                                <span className="font-bold text-slate-100 print:text-black">{detailedFlowStats.severity.critical.count}</span>
                             </div>
                             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 print:bg-white print:border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 print:bg-gray-400"></div>
                                    <span className="text-sm text-slate-300 print:text-black">Standartiniai (3 Kat)</span>
                                </div>
                                <span className="font-bold text-slate-100 print:text-black">{detailedFlowStats.severity.standard.count}</span>
                             </div>
                             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 print:bg-white print:border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-600 print:bg-gray-200 print:border print:border-black"></div>
                                    <span className="text-sm text-slate-300 print:text-black">Lengvi (4-5 Kat)</span>
                                </div>
                                <span className="font-bold text-slate-100 print:text-black">{detailedFlowStats.severity.light.count}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default ReportsView;
