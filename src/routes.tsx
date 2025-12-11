import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BedTableView from '../pages/BedTableView';
import BedMapView from '../pages/BedMapView';
import ShiftManagerView from '../pages/ShiftManagerView';
import ReportsView from '../pages/ReportsView';
import AdminDashboardView from '../pages/AdminDashboardView';
import TasksView from '../pages/TasksView';
import SettingsView from '../pages/SettingsView';
import AuditLogView from '../pages/AuditLogView';
import UserProfileView from '../pages/UserProfileView';
import {
    Bed, Staff, PatientLogEntry, UserProfile,
    AssignmentLog, RegistrationLog, PatientStatus,
    WorkShift, StaffSpecialization, StaffSkill,
    ActivityLog, MedicationItem, MedicationProtocol
} from '../types';


interface AppRoutesProps {
    currentUser: UserProfile;
    beds: Bed[];
    doctors: Staff[];
    nurses: Staff[];
    patientLog: PatientLogEntry[];
    registrationLogs: RegistrationLog[];
    assignmentLogs: AssignmentLog[];
    workShifts: WorkShift[];
    auditLogs: ActivityLog[];
    sections: string[];
    specializations: StaffSpecialization[];
    skills: StaffSkill[];
    bulletinMessage: string;
    settingsTab: string;
    filteredBeds: Bed[];
    medicationBank: MedicationItem[];
    setMedications: React.Dispatch<React.SetStateAction<MedicationItem[]>>;
    // Handlers
    onNavigate: (view: string, tab?: string) => void;
    onUpdateBulletin: (msg: string) => void;
    onUpdateUser: (user: UserProfile) => void;
    onBedClick: (bed: Bed | null) => void;
    onMovePatient: (from: string, to: string) => void;
    onCleanBed: (bed: Bed) => void;
    onDischarge: (bed: Bed) => void;
    onStatusChange: (bed: Bed, status: PatientStatus) => void;
    onUpdateBed: (bed: Bed) => void;
    updateDoctors: (docs: Staff[]) => void;
    updateNurses: (nurses: Staff[]) => void;
    setWorkShifts: (shifts: WorkShift[]) => void;
    // Medication Combinations
    medicationCombinations: MedicationProtocol[];
    onSaveCombination: (combo: MedicationProtocol) => void;
    onUpdateCombination: (combo: MedicationProtocol) => void;
    onDeleteCombination: (comboId: string) => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
    currentUser,
    beds,
    doctors,
    nurses,
    patientLog,
    registrationLogs,
    assignmentLogs,
    workShifts,
    auditLogs,
    sections,
    specializations,
    skills,
    bulletinMessage,
    settingsTab,
    filteredBeds,
    onNavigate,
    onUpdateBulletin,
    onUpdateUser,
    onBedClick,
    onMovePatient,
    onCleanBed,
    onDischarge,
    onStatusChange,
    onUpdateBed,
    updateDoctors,
    updateNurses,
    setWorkShifts,
    medicationBank,
    setMedications,
    medicationCombinations,
    onSaveCombination,
    onUpdateCombination,
    onDeleteCombination
}) => {
    return (
        <Routes>

            <Route path="/dashboard" element={
                currentUser.role === 'Admin' ? (
                    <AdminDashboardView
                        beds={beds}
                        doctors={doctors}
                        nurses={nurses}
                        patientLogs={patientLog}
                        registrationLogs={registrationLogs}
                        onNavigate={onNavigate}
                        bulletinMessage={bulletinMessage}
                        onUpdateBulletin={onUpdateBulletin}
                    />
                ) : <Navigate to="/map" />
            } />
            <Route path="/audit" element={
                currentUser.role === 'Admin' ? (
                    <AuditLogView logs={auditLogs} />
                ) : <Navigate to="/map" />
            } />
            <Route path="/profile" element={
                <UserProfileView
                    user={currentUser}
                    onUpdateUser={onUpdateUser}
                    patientLogs={patientLog}
                    specializations={specializations}
                    medicationBank={medicationBank}
                    medicationCombinations={medicationCombinations}
                    onSaveCombination={onSaveCombination}
                    onUpdateCombination={onUpdateCombination}
                    onDeleteCombination={onDeleteCombination}
                />
            } />
            <Route path="/map" element={
                <BedMapView
                    beds={filteredBeds}
                    doctors={doctors}
                    nurses={nurses}
                    onBedClick={onBedClick}
                    onMovePatient={onMovePatient}
                    onCleanBed={onCleanBed}
                />
            } />
            <Route path="/table" element={
                <BedTableView
                    beds={filteredBeds}
                    doctors={doctors}
                    nurses={nurses}
                    onRowClick={onBedClick}
                    onDischarge={onDischarge}
                    onStatusChange={onStatusChange}
                    onCleanBed={onCleanBed}
                />
            } />
            <Route path="/tasks" element={
                <TasksView
                    beds={beds}
                    doctors={doctors}
                    currentUser={currentUser}
                    onUpdateBed={onUpdateBed}
                />
            } />
            <Route path="/shift" element={
                <ShiftManagerView
                    doctors={doctors}
                    setDoctors={updateDoctors}
                    nurses={nurses}
                    setNurses={updateNurses}
                    beds={beds}
                    patientLogs={patientLog}
                    assignmentLogs={assignmentLogs}
                    workShifts={workShifts}
                    setWorkShifts={setWorkShifts}
                    registrationLogs={registrationLogs}
                    sections={sections}
                    specializations={specializations}
                    skills={skills}
                />
            } />
            <Route path="/reports" element={
                <ReportsView
                    registrationLogs={registrationLogs}
                    nurses={nurses}
                    patientLogs={patientLog}
                    doctors={doctors}
                    beds={beds}
                />
            } />
            <Route path="/settings" element={
                <div className="absolute inset-0 overflow-auto custom-scrollbar">
                    <SettingsView initialTab={settingsTab} />
                </div>
            } />
            <Route path="*" element={<Navigate to="/map" />} />
        </Routes>
    );
};

