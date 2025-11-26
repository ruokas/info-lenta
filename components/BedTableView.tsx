import React from 'react';
import { Bed, PatientStatus, Staff, MedicationStatus } from '../types';
import { STATUS_COLORS, TRIAGE_COLORS } from '../constants';
import { Home, Syringe, Clock, AlertTriangle, Pill, Microscope, FileImage, ClipboardList, Waves, HeartPulse } from 'lucide-react';

interface BedTableViewProps {
  beds: Bed[];
  doctors: Staff[];
  onRowClick: (bed: Bed) => void;
}

const BedTableView: React.FC<BedTableViewProps> = ({ beds, doctors, onRowClick }) => {
  // Group beds by section (Nurse Name) to match the screenshot structure
  const groupedBeds = React.useMemo(() => {
    const groups: Record<string, Bed[]> = {};
    beds.forEach(bed => {
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
            <th className="px-4 py-3 text-left">Komentaras</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {(Object.entries(groupedBeds) as [string, Bed[]][]).map(([nurseName, sectionBeds], groupIndex) => (
            <React.Fragment key={nurseName}>
              {sectionBeds.map((bed, index) => {
                const isFirst = index === 0;
                const rowSpan = sectionBeds.length;
                const isIT = bed.label.startsWith('IT');
                const isAmb = bed.label.startsWith('A') && !bed.label.startsWith('Arm'); // Check A but not Armanda if label changes
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
                    onClick={() => onRowClick(bed)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* Nurse Column - Merged Cells */}
                    {isFirst && (
                      <td 
                        rowSpan={rowSpan} 
                        className="px-3 py-4 text-left font-bold text-slate-300 border-r border-slate-800 bg-slate-900 align-middle"
                      >
                         <div className="sticky top-12">{nurseName}</div>
                      </td>
                    )}
                    
                    {/* Bed Label */}
                    <td className={`px-2 py-2 text-center font-bold border-r border-slate-800 ${bedLabelClass}`}>
                      {bed.label}
                    </td>

                    {/* Doctor */}
                    <td className="px-3 py-2 border-r border-slate-800 text-slate-400">
                      {getDoctorName(bed.assignedDoctorId)}
                    </td>

                    {/* Category */}
                    <td className="px-1 py-1 border-r border-slate-800 text-center">
                       {bed.patient && (
                         <span className={`inline-block w-6 h-6 leading-6 rounded font-bold text-xs ${TRIAGE_COLORS[bed.patient.triageCategory] || 'bg-slate-700'}`}>
                           {bed.patient.triageCategory}
                         </span>
                       )}
                    </td>

                    {/* Patient Name */}
                    <td className={`px-4 py-2 border-r border-slate-800 font-medium ${!bed.patient ? 'text-slate-600 italic' : 'text-slate-200'}`}>
                      {bed.patient ? bed.patient.name : 'Laisva'}
                    </td>

                    {/* Status */}
                    <td className="px-2 py-1 border-r border-slate-800">
                       {bed.status !== PatientStatus.EMPTY && (
                         <div className={`px-2 py-1 rounded text-xs font-semibold border flex items-center justify-between shadow-sm ${STATUS_COLORS[bed.status]}`}>
                            <span className="truncate">{bed.status}</span>
                            {getStatusIcon(bed.status)}
                         </div>
                       )}
                    </td>

                    {/* Actions (Labs/Xray) */}
                    <td className="px-2 py-1 border-r border-slate-800 text-center">
                       {pendingActions && pendingActions.length > 0 && (
                          <div className="flex justify-center gap-1">
                             {pendingActions.some(a => a.type === 'LABS') && (
                               <span title="Kraujas">
                                 <Microscope size={14} className="text-blue-400" />
                               </span>
                             )}
                             {pendingActions.some(a => a.type === 'XRAY' || a.type === 'CT') && (
                               <span title="Radiologija">
                                 <FileImage size={14} className="text-yellow-400" />
                               </span>
                             )}
                             {pendingActions.some(a => a.type === 'ULTRASOUND') && (
                               <span title="Ultragarsas">
                                 <Waves size={14} className="text-cyan-400" />
                               </span>
                             )}
                             {pendingActions.some(a => a.type === 'EKG') && (
                               <span title="EKG">
                                 <HeartPulse size={14} className="text-red-400" />
                               </span>
                             )}
                             {pendingActions.some(a => a.type === 'CONSULT') && (
                               <span title="Konsultacija">
                                 <ClipboardList size={14} className="text-purple-400" />
                               </span>
                             )}
                          </div>
                       )}
                    </td>

                    {/* Meds */}
                    <td className="px-2 py-1 border-r border-slate-800 text-center">
                       {medsStatus && (
                         <div className={`inline-flex items-center gap-1 ${medsStatus.color}`}>
                           <Pill size={14} />
                           {medsStatus.count > 0 && <span className="text-[10px] font-bold">{medsStatus.count}</span>}
                         </div>
                       )}
                    </td>

                    {/* Arrival Time */}
                    <td className="px-3 py-2 border-r border-slate-800 text-center font-mono text-xs text-slate-400">
                        {bed.patient?.arrivalTime || '-'}
                    </td>

                    {/* Duration */}
                    <td className={`px-3 py-2 border-r border-slate-800 text-center font-mono text-xs ${isOverdue ? 'text-red-400 font-bold bg-red-900/10' : 'text-slate-400'}`}>
                        <div className="flex items-center justify-center gap-1">
                          {isOverdue && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                          {durationText}
                        </div>
                    </td>

                    {/* Comment */}
                    <td className="px-4 py-2 text-slate-400 relative">
                       <div className="truncate max-w-xs" title={bed.comment}>
                        {bed.comment}
                       </div>
                    </td>
                  </tr>
                );
              })}
              {/* Divider between groups */}
              <tr className="bg-slate-800 h-1">
                <td colSpan={11}></td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BedTableView;