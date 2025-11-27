
import React, { useState } from 'react';
import { Bed, PatientStatus, Staff, MedicationStatus } from '../types';
import { TRIAGE_COLORS, STATUS_COLORS } from '../constants';
import { User, Stethoscope, AlertTriangle, Pill, Microscope, FileImage, ClipboardList, Activity, Waves, HeartPulse } from 'lucide-react';

interface BedMapViewProps {
  beds: Bed[];
  doctors: Staff[];
  onBedClick: (bed: Bed) => void;
  onMovePatient?: (fromBedId: string, toBedId: string) => void;
}

const BedMapView: React.FC<BedMapViewProps> = ({ beds, doctors, onBedClick, onMovePatient }) => {
  const [dragOverBedId, setDragOverBedId] = useState<string | null>(null);
  const [animatingBeds, setAnimatingBeds] = useState<string[]>([]);

  const getDoctorInitials = (id?: string) => {
      const name = doctors.find(d => d.id === id)?.name;
      return name ? name.substring(0, 3).toUpperCase() : null;
  };

  const isOverdue = (arrivalTime?: string) => {
    if (!arrivalTime) return false;
    const now = new Date();
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const arrivalDate = new Date();
    arrivalDate.setHours(hours, minutes, 0, 0);

    let diff = now.getTime() - arrivalDate.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    
    // Check if > 240 mins (4 hours)
    return Math.floor(diff / 60000) > 240;
  };

  const getMedicationStatusColor = (bed: Bed) => {
    if (!bed.patient?.medications || bed.patient.medications.length === 0) return null;
    const hasPending = bed.patient.medications.some(m => m.status === MedicationStatus.PENDING);
    return hasPending ? 'text-yellow-500' : 'text-green-500';
  };

  const getPendingActions = (bed: Bed) => {
     if (!bed.patient?.actions) return [];
     return bed.patient.actions.filter(a => !a.isCompleted);
  };

  const handleDragStart = (e: React.DragEvent, bed: Bed) => {
    // Only allow dragging if there is a patient or the bed is not empty
    if (bed.status === PatientStatus.EMPTY && !bed.patient) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', bed.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, bedId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBedId !== bedId) {
      setDragOverBedId(bedId);
    }
  };

  const handleDragLeave = () => {
    setDragOverBedId(null);
  };

  const handleDrop = (e: React.DragEvent, targetBedId: string) => {
    e.preventDefault();
    setDragOverBedId(null);
    const sourceBedId = e.dataTransfer.getData('text/plain');
    
    if (sourceBedId && sourceBedId !== targetBedId && onMovePatient) {
      // Trigger success animation
      setAnimatingBeds(prev => [...prev, sourceBedId, targetBedId]);
      setTimeout(() => {
        setAnimatingBeds(prev => prev.filter(id => id !== sourceBedId && id !== targetBedId));
      }, 500); // 500ms animation for snappier feel
      
      onMovePatient(sourceBedId, targetBedId);
    }
  };

  return (
    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 h-full overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {beds.map((bed) => {
          const isEmpty = bed.status === PatientStatus.EMPTY;
          const isDragTarget = dragOverBedId === bed.id;
          const isAnimating = animatingBeds.includes(bed.id);
          const canDrag = !isEmpty;
          const overdue = !isEmpty && bed.patient && isOverdue(bed.patient.arrivalTime);
          const isAmb = bed.label.startsWith('A') && !bed.label.startsWith('Arm');
          const medColor = getMedicationStatusColor(bed);
          const pendingActions = getPendingActions(bed);
          const vitals = bed.patient?.vitals;
          
          return (
            <div 
              key={bed.id}
              onClick={() => onBedClick(bed)}
              draggable={canDrag}
              onDragStart={(e) => handleDragStart(e, bed)}
              onDragOver={(e) => handleDragOver(e, bed.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, bed.id)}
              className={`
                relative flex flex-col justify-between
                min-h-[140px] rounded-xl border transition-all duration-300 ease-out cursor-pointer shadow-sm
                ${isAnimating ? 'ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-[1.05] z-10 duration-500 ease-out' : ''}
                ${isDragTarget ? 'border-blue-500 ring-2 ring-blue-500/20 bg-slate-800/80 scale-[1.02]' : ''}
                ${!isDragTarget && !isAnimating && isEmpty ? 'bg-slate-900 border-dashed border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-600' : ''}
                ${!isDragTarget && !isAnimating && !isEmpty ? 'bg-slate-800 border-slate-700 hover:shadow-md hover:-translate-y-1' : ''}
                ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                ${overdue ? 'ring-1 ring-red-500/50' : ''}
                ${isAmb && !isEmpty && !isDragTarget && !isAnimating ? 'border-amber-900/30' : ''}
              `}
            >
              {overdue && (
                <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-red-500/50 shadow-sm z-10" title="Pacientas skyriuje > 4 val.">
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
              )}
              
              {/* Meds Indicator */}
              {medColor && (
                <div className={`absolute -top-2 ${overdue ? '-left-2' : '-right-2'} bg-slate-900 rounded-full p-1 border border-slate-700 shadow-sm z-10`}>
                   <Pill size={14} className={medColor} />
                </div>
              )}

              {/* Header: Label & Section */}
              <div className={`flex justify-between items-center p-2 rounded-t-lg ${isEmpty ? 'bg-slate-800/50' : isAmb ? 'bg-amber-900/30 text-amber-200' : 'bg-slate-700 text-slate-100'}`}>
                <span className="font-bold text-lg">{bed.label}</span>
                <span className="text-[10px] uppercase opacity-70 tracking-wider text-slate-400 truncate max-w-[80px]">{bed.section}</span>
              </div>

              {/* Body: Patient Info */}
              <div className="flex-1 p-3 flex flex-col gap-1">
                {bed.patient ? (
                  <>
                    <div className="flex items-start justify-between">
                       <span className="font-bold text-slate-200 line-clamp-2 leading-tight">{bed.patient.name}</span>
                       <span className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${TRIAGE_COLORS[bed.patient.triageCategory]}`}>
                         {bed.patient.triageCategory}
                       </span>
                    </div>
                    {bed.patient.symptoms && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{bed.patient.symptoms}</p>
                    )}
                    
                    {/* Action Icons */}
                    {pendingActions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {pendingActions.some(a => a.type === 'LABS') && <Microscope size={12} className="text-blue-400" />}
                        {pendingActions.some(a => a.type === 'XRAY' || a.type === 'CT') && <FileImage size={12} className="text-yellow-400" />}
                        {pendingActions.some(a => a.type === 'ULTRASOUND') && <Waves size={12} className="text-cyan-400" />}
                        {pendingActions.some(a => a.type === 'EKG') && <HeartPulse size={12} className="text-red-400" />}
                        {pendingActions.some(a => a.type === 'CONSULT') && <ClipboardList size={12} className="text-purple-400" />}
                      </div>
                    )}
                    
                    {/* Critical Vitals Indicator */}
                    {vitals && vitals.spO2 && vitals.spO2 < 92 && (
                       <div className="mt-1 flex items-center gap-1 text-[10px] text-red-400 font-bold animate-pulse">
                         <Activity size={10} /> SpO2 {vitals.spO2}%
                       </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-700">
                    <User size={32} />
                  </div>
                )}
              </div>

              {/* Footer: Status & Doctor */}
              {!isEmpty && (
                <div className="mt-auto">
                    {/* Status Bar */}
                   <div className={`px-2 py-1 text-xs font-semibold truncate ${STATUS_COLORS[bed.status]} border-l-0 border-r-0 border-b-0`}>
                     {bed.status}
                   </div>
                   {/* Doctor & Info Bar */}
                   <div className="px-2 py-1.5 bg-slate-900/50 text-xs flex justify-between items-center text-slate-500 rounded-b-lg border-t border-slate-700">
                      <div className="flex items-center gap-1">
                          <Stethoscope size={12} />
                          <span>{getDoctorInitials(bed.assignedDoctorId) || '-'}</span>
                      </div>
                      <span className={`text-[10px] ${overdue ? 'text-red-400 font-bold' : ''}`}>{bed.patient?.arrivalTime}</span>
                   </div>
                </div>
              )}
              
              {/* Empty State Footer */}
              {isEmpty && (
                 <div className="p-2 text-center text-xs text-slate-600 font-medium">
                    {isAmb ? 'Laisva' : 'Laisva'}
                 </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BedMapView;
