import React, { useState } from 'react';
import { Bed, PatientStatus, Staff, MedicationStatus } from '../types';
import { STATUS_COLORS, TRIAGE_COLORS } from '../constants';
import { Home, Syringe, Clock, AlertTriangle, Pill, Microscope, FileImage, ClipboardList, Waves, HeartPulse, LogOut, Check, X, ChevronDown } from 'lucide-react';

interface BedTableViewProps {
  beds: Bed[];
  doctors: Staff[];
  onRowClick: (bed: Bed) => void;
  onDischarge: (bed: Bed) => void;
  onStatusChange: (bed: Bed, newStatus: PatientStatus) => void;
}

const BedTableView: React.FC<BedTableViewProps> = ({ beds, doctors, onRowClick, onDischarge, onStatusChange }) => {
  const [confirmDischargeId, setConfirmDischargeId] = useState<string | null>(null);

  // Group beds by section (Nurse Name)
  const groupedBeds = React.useMemo(() => {
    const groups: Record<string, Bed[]> = {};
    beds.forEach(bed => {
      if (!bed) return; // Skip null beds
      if (!groups[bed.section]) {
        groups[bed.section] = [];
      }
      groups[bed.section].push(bed);
    });
    return groups;
  }, [beds]);

  const getDoctorName = (id?: string) => doctors.find(d => d.id === id)?.name || '';

  const getStatusIcon = (status: PatientStatus) => {
    switch (status) {
      case PatientStatus.DISCHARGE: return <Home size={14} className="ml-1" />;
      case PatientStatus.IV_DRIP: return <Syringe size={14} className="ml-1" />;
      case PatientStatus.WAITING_EXAM: return <Clock size={14} className="ml-1" />;
      case PatientStatus.ADMITTING: return <div className="ml-1">➡️ 🛏️</div>;
      default: return null;
    }
  };

  const getMedsStatus = (bed: Bed) => {
    if (!bed.patient?.medications || bed.patient.medications.length === 0) return null;
    const pendingCount = bed.patient.medications.filter(m => m.status === MedicationStatus.PENDING).length;
    if (pendingCount > 0) return { count: pendingCount, color: 'text-yellow-500' };
    return { count: 0, color: 'text-green-500' }; // All given
  };
  
  const getActionStatus = (bed: Bed) => {
    if (!bed.patient?.actions || bed.patient.actions.length === 0) return null;
    const pending = bed.patient.actions.filter(a => !a.isCompleted);
    return pending;
  };

  const getDurationInfo = (arrivalTime?: string) => {
    if (!arrivalTime) return { text: '-', isOverdue: false };
    
    const now = new Date();
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const arrivalDate = new Date();
    arrivalDate.setHours(hours, minutes, 0, 0);

    let diff = now.getTime() - arrivalDate.getTime();
    
    // If negative, assume arrival was yesterday (crossing midnight)
    if (diff < 0) {
       diff += 24 * 60 * 60 * 1000;
    }

    const diffMinutes = Math.floor(diff / 60000);
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    
    // Overdue if > 4 hours (240 minutes)
    const isOverdue = diffMinutes > 240;

    return { text: `${h}h ${m}m`, isOverdue };
  };

  const handleDischargeClick = (e: React.MouseEvent, bedId: string) => {
    e.stopPropagation();
    setConfirmDischargeId(bedId);
  };

  const confirmDischarge = (e: React.MouseEvent, bed: Bed) => {
    e.stopPropagation();
    onDischarge(bed);
    setConfirmDischargeId(null);
  };

  const cancelDischarge = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDischargeId(null);
  };

  return (
    <div className="overflow-x-auto border-0 bg-slate-900 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-3 py-3 text-left border-r border-slate-800 w-32">Slaugytoja</th>
            <th className="px-2 py-3 text-center border-r border-slate-800 w-16">Lova</th>
            <th className="px-3 py-3 text-left border-r border-slate-800 w-32">Gydytojas</th>
            <th className="px-2 py-3 text-center border-r border-slate-800 w-12">Kat.</th>
            <th className="px-4 py-3 text-left border-r border-slate-800 w-48">Pacientas</th>
            <th className="px-3 py-3 text-left border-r border-slate-800 w-40">Būklė</th>
            <th className="px-2 py-3 text-center border-r border-slate-800 w-20">Veiksmai</th>
            <th className="px-2 py-3 text-center border-r border-slate-800 w-12" title="Vaistai"><Pill size={14} className="mx-auto" /></th>
            <th className="px-3 py-3 text-center border-r border-slate-800 w-20">Atvyko</th>
            <th className="px-3 py-3 text-center border-r border-slate-800 w-24">Trukmė</th>
            <th className="px-4 py-3 text-left border-r border-slate-800">Komentaras</th>
            <th className="px-3 py-3 text-center w-28">Išvykimas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {(Object.entries(groupedBeds) as [string, Bed[]][]).map(([nurseName, sectionBeds], groupIndex) => (
            <React.Fragment key={nurseName}>
              {sectionBeds.map((bed, index) => {
                const isFirst = index === 0;
                const rowSpan = sectionBeds.length;
                const isIT = bed.label.startsWith('IT');
                const isAmb = bed.label.startsWith('A') && !bed.label.startsWith('Arm');
                const isSpecial = bed.label.startsWith('S') || bed.label.startsWith('P');

                let bedLabelClass = 'bg-slate-800 text-slate-400';
                if (isIT) bedLabelClass = 'bg-blue-900/40 text-blue-200';
                else if (isAmb) bedLabelClass = 'bg-amber-900/30 text-amber-300';
                else if (isSpecial) bedLabelClass = 'bg-red-900/20 text-red-200/80';

                const { text: durationText, isOverdue } = getDurationInfo(bed.patient?.arrivalTime);
                const medsStatus = getMedsStatus(bed);
                const pendingActions = getActionStatus(bed);

                return (
                  <tr 
                    key={bed.id} 
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Nurse Column */}
                    {isFirst && (
                      <td 
                        rowSpan={rowSpan} 
                        className="px-3 py-4 text-left font-bold text-slate-300 border-r border-slate-800 bg-slate-900 align-middle"
                      >
                         <div className="sticky top-12">{nurseName}</div>
                      </td>
                    )}
                    
                    {/* Interactive Cells */}
                    <td onClick={() => onRowClick(bed)} className={`px-2 py-2 text-center font-bold border-r border-slate-800 cursor-pointer ${bedLabelClass}`}>
                      {bed.label}
                    </td>

                    <td onClick={() => onRowClick(bed)} className="px-3 py-2 border-r border-slate-800 text-slate-400 cursor-pointer">
                      {getDoctorName(bed.assignedDoctorId)}
                    </td>

                    <td onClick={() => onRowClick(bed)} className="px-1 py-1 border-r border-slate-800 text-center cursor-pointer">
                       {bed.patient && (
                         <span className={`inline-block w-6 h-6 leading-6 rounded font-bold text-xs ${TRIAGE_COLORS[bed.patient.triageCategory] || 'bg-slate-700'}`}>
                           {bed.patient.triageCategory}
                         </span>
                       )}
                    </td>

                    <td onClick={() => onRowClick(bed)} className={`px-4 py-2 border-r border-slate-800 font-medium cursor-pointer ${!bed.patient ? 'text-slate-600 italic' : 'text-slate-200'}`}>
                      {bed.patient ? bed.patient.name : 'Laisva'}
                    </td>

                    {/* Status Cell - Modified to be a dropdown if occupied */}
                    <td onClick={(e) => bed.status !== PatientStatus.EMPTY && e.stopPropagation()} className={`px-2 py-1 border-r border-slate-800 ${bed.status === PatientStatus.EMPTY ? 'cursor-pointer' : ''}`} onClickCapture={bed.status === PatientStatus.EMPTY ? () => onRowClick(bed) : undefined}>
                       {bed.status !== PatientStatus.EMPTY ? (
                         <div className={`relative px-2 py-1 rounded text-xs font-semibold border shadow-sm ${STATUS_COLORS[bed.status]} group/status hover:opacity-90`}>
                            <select
                                value={bed.status}
                                onChange={(e) => onStatusChange(bed, e.target.value as PatientStatus)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                            >
                                {Object.values(PatientStatus).map(status => (
                                    <option key={status} value={status} className="bg-slate-800 text-slate-200">{status}</option>
                                ))}
                            </select>
                            <div className="flex items-center justify-between pointer-events-none">
                                <span className="truncate mr-1">{bed.status}</span>
                                {getStatusIcon(bed.status)}
                                <ChevronDown size={10} className="ml-1 opacity-50" />
                            </div>
                         </div>
                       ) : (
                         <div onClick={() => onRowClick(bed)}></div>
                       )}
                    </td>

                    <td onClick={() => onRowClick(bed)} className="px-2 py-1 border-r border-slate-800 text-center cursor-pointer">
                       {pendingActions && pendingActions.length > 0 && (
                          <div className="flex justify-center gap-1">
                             {pendingActions.some(a => a.type === 'LABS') && <Microscope size={14} className="text-blue-400" />}
                             {pendingActions.some(a => a.type === 'XRAY' || a.type === 'CT') && <FileImage size={14} className="text-yellow-400" />}
                             {pendingActions.some(a => a.type === 'ULTRASOUND') && <Waves size={14} className="text-cyan-400" />}
                             {pendingActions.some(a => a.type === 'EKG') && <HeartPulse size={14} className="text-red-400" />}
                             {pendingActions.some(a => a.type === 'CONSULT') && <ClipboardList size={14} className="text-purple-400" />}
                          </div>
                       )}
                    </td>

                    <td onClick={() => onRowClick(bed)} className="px-2 py-1 border-r border-slate-800 text-center cursor-pointer">
                       {medsStatus && (
                         <div className={`inline-flex items-center gap-1 ${medsStatus.color}`}>
                           <Pill size={14} />
                           {medsStatus.count > 0 && <span className="text-[10px] font-bold">{medsStatus.count}</span>}
                         </div>
                       )}
                    </td>

                    <td onClick={() => onRowClick(bed)} className="px-3 py-2 border-r border-slate-800 text-center font-mono text-xs text-slate-400 cursor-pointer">
                        {bed.patient?.arrivalTime || '-'}
                    </td>

                    <td onClick={() => onRowClick(bed)} className={`px-3 py-2 border-r border-slate-800 text-center font-mono text-xs cursor-pointer ${isOverdue ? 'text-red-400 font-bold bg-red-900/10' : 'text-slate-400'}`}>
                        <div className="flex items-center justify-center gap-1">
                          {isOverdue && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                          {durationText}
                        </div>
                    </td>

                    <td onClick={() => onRowClick(bed)} className="px-4 py-2 text-slate-400 border-r border-slate-800 relative cursor-pointer">
                       <div className="truncate max-w-xs" title={bed.comment}>
                        {bed.comment}
                       </div>
                    </td>

                    {/* Discharge Action - Independent Cell */}
                    <td className="px-2 py-2 text-center">
                       {bed.patient && (
                          confirmDischargeId === bed.id ? (
                            <div className="flex items-center justify-center gap-1 animate-in zoom-in duration-200">
                                <button
                                    type="button"
                                    onClick={(e) => confirmDischarge(e, bed)}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded shadow-lg shadow-red-900/30"
                                    title="Patvirtinti"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelDischarge}
                                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                                    title="Atšaukti"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                          ) : (
                            <button 
                                type="button"
                                onClick={(e) => handleDischargeClick(e, bed.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition flex items-center justify-center mx-auto"
                                title="Išrašyti pacientą"
                            >
                                <LogOut size={16} />
                            </button>
                          )
                       )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-800 h-1">
                <td colSpan={12}></td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BedTableView;