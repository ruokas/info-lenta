
import React, { useState, useMemo } from 'react';
import { ActivityLog } from '../types';
import { Search, Filter, Clock, User, Activity, ShieldCheck } from 'lucide-react';

interface AuditLogViewProps {
  logs: ActivityLog[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const uniqueActions = useMemo(() => {
      const actions = new Set(logs.map(l => l.action));
      return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
      return logs.filter(log => {
          const matchesSearch = 
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesAction = filterAction === 'ALL' || log.action === filterAction;
          
          return matchesSearch && matchesAction;
      });
  }, [logs, searchTerm, filterAction]);

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><ShieldCheck size={24} className="text-emerald-500" /></div>
                Sistemos Auditas (Audit Trail)
            </h2>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 shadow-sm flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Ieškoti pagal vartotoją arba veiksmo detales..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
             <div className="w-full md:w-64">
                 <div className="relative">
                     <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                     <select 
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                     >
                         <option value="ALL">Visi veiksmai</option>
                         {uniqueActions.map(action => (
                             <option key={action} value={action}>{action}</option>
                         ))}
                     </select>
                 </div>
             </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 border-b border-slate-800 w-40">Laikas</th>
                            <th className="px-4 py-3 border-b border-slate-800 w-48">Vartotojas</th>
                            <th className="px-4 py-3 border-b border-slate-800 w-40">Veiksmas</th>
                            <th className="px-4 py-3 border-b border-slate-800">Detalės</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">Įrašų nerasta.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-800/50 transition">
                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12}/>
                                            {new Date(log.timestamp).toLocaleString('lt-LT')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 bg-slate-800 rounded-full"><User size={12} className="text-slate-400"/></span>
                                            <span className="font-medium text-slate-200">{log.userName}</span>
                                            <span className="text-[10px] text-slate-500 border border-slate-700 px-1 rounded">{log.userRole}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                            log.action === 'LOGIN' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                                            log.action === 'LOGOUT' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                            log.action === 'DISCHARGE' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
                                            log.action === 'TRIAGE' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' :
                                            log.action.includes('MED') ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
                                            'bg-slate-800 text-slate-300 border-slate-700'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {log.details}
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

export default AuditLogView;
