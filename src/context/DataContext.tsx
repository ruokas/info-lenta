import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    Bed, Staff, PatientLogEntry, MedicationItem,
    WorkShift, AssignmentLog, RegistrationLog,
    MedicationProtocol, AppSettings, ActivityLog,
    StaffSpecialization, StaffSkill
} from '../../types';
import {
    INITIAL_BEDS, DOCTORS, NURSES, INITIAL_MEDICATIONS,
    PHYSICAL_SECTIONS, INITIAL_PROTOCOLS, DEFAULT_SETTINGS,
    INITIAL_SPECIALIZATIONS, INITIAL_SKILLS
} from '../../constants';
import { DataService } from '../../services/DataService';
import { AuditService } from '../../services/AuditService';
import { useAuth } from './AuthContext';

interface DataContextType {
    beds: Bed[];
    setBeds: React.Dispatch<React.SetStateAction<Bed[]>>;
    doctors: Staff[];
    setDoctors: React.Dispatch<React.SetStateAction<Staff[]>>;
    nurses: Staff[];
    setNurses: React.Dispatch<React.SetStateAction<Staff[]>>;
    medicationBank: MedicationItem[];
    setMedications: React.Dispatch<React.SetStateAction<MedicationItem[]>>;
    protocols: MedicationProtocol[];
    setProtocols: React.Dispatch<React.SetStateAction<MedicationProtocol[]>>;
    patientLog: PatientLogEntry[];
    setPatientLog: React.Dispatch<React.SetStateAction<PatientLogEntry[]>>;
    registrationLogs: RegistrationLog[];
    setRegistrationLogs: React.Dispatch<React.SetStateAction<RegistrationLog[]>>;
    assignmentLogs: AssignmentLog[];
    setAssignmentLogs: React.Dispatch<React.SetStateAction<AssignmentLog[]>>;
    workShifts: WorkShift[];
    setWorkShifts: React.Dispatch<React.SetStateAction<WorkShift[]>>;
    auditLogs: ActivityLog[];
    refreshAuditLogs: () => Promise<void>;
    sections: string[];
    setSections: React.Dispatch<React.SetStateAction<string[]>>;
    specializations: StaffSpecialization[];
    setSpecializations: React.Dispatch<React.SetStateAction<StaffSpecialization[]>>;
    skills: StaffSkill[];
    setSkills: React.Dispatch<React.SetStateAction<StaffSkill[]>>;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    bulletinMessage: string;
    setBulletinMessage: React.Dispatch<React.SetStateAction<string>>;
    autoRefresh: boolean;
    setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();

    // Data
    const [beds, setBeds] = useState<Bed[]>(INITIAL_BEDS);
    const [doctors, setDoctors] = useState<Staff[]>(DOCTORS);
    const [nurses, setNurses] = useState<Staff[]>(NURSES);
    const [medicationBank, setMedications] = useState<MedicationItem[]>(INITIAL_MEDICATIONS);
    const [protocols, setProtocols] = useState<MedicationProtocol[]>(INITIAL_PROTOCOLS);
    const [patientLog, setPatientLog] = useState<PatientLogEntry[]>([]);
    const [registrationLogs, setRegistrationLogs] = useState<RegistrationLog[]>([]);
    const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLog[]>([]);
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);

    // Configs
    const [sections, setSections] = useState<string[]>(PHYSICAL_SECTIONS);
    const [specializations, setSpecializations] = useState<StaffSpecialization[]>(INITIAL_SPECIALIZATIONS);
    const [skills, setSkills] = useState<StaffSkill[]>(INITIAL_SKILLS);
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [bulletinMessage, setBulletinMessage] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const loadData = async () => {
            const [fetchedBeds, fetchedDoctors, fetchedNurses, fetchedMeds, fetchedLogs, fetchedAuditLogs] = await Promise.all([
                DataService.fetchBeds(),
                DataService.fetchStaff('doctors'),
                DataService.fetchStaff('nurses'),
                DataService.fetchMedications(),
                DataService.fetchLogs(),
                AuditService.fetchLogs()
            ]);

            setBeds(fetchedBeds.length ? fetchedBeds : INITIAL_BEDS);
            setDoctors(fetchedDoctors.length ? fetchedDoctors : DOCTORS);
            setNurses(fetchedNurses.length ? fetchedNurses : NURSES);
            setMedications(fetchedMeds.length ? fetchedMeds : INITIAL_MEDICATIONS);
            setPatientLog(fetchedLogs);
            setAuditLogs(fetchedAuditLogs);

            // Load other local storage data
            const savedShifts = localStorage.getItem('er_shifts');
            if (savedShifts) setWorkShifts(JSON.parse(savedShifts));

            const savedRegs = localStorage.getItem('er_registrations');
            if (savedRegs) setRegistrationLogs(JSON.parse(savedRegs));

            const savedAssigns = localStorage.getItem('er_assignments');
            if (savedAssigns) setAssignmentLogs(JSON.parse(savedAssigns));

            const savedBulletin = localStorage.getItem('er_bulletin');
            if (savedBulletin) setBulletinMessage(savedBulletin);

            const savedSections = localStorage.getItem('er_sections');
            if (savedSections) setSections(JSON.parse(savedSections));

            const savedSpecs = localStorage.getItem('er_specializations');
            if (savedSpecs) setSpecializations(JSON.parse(savedSpecs));

            const savedSkills = localStorage.getItem('er_skills');
            if (savedSkills) setSkills(JSON.parse(savedSkills));

            const savedProtocols = localStorage.getItem('er_protocols');
            if (savedProtocols) setProtocols(JSON.parse(savedProtocols));

            const savedSettings = localStorage.getItem('er_settings');
            if (savedSettings) setAppSettings(JSON.parse(savedSettings));
        };
        loadData();
    }, []);

    // Save Effects
    useEffect(() => { DataService.saveBeds(beds); }, [beds]);
    useEffect(() => { DataService.saveStaff('doctors', doctors); }, [doctors]);
    useEffect(() => { DataService.saveStaff('nurses', nurses); }, [nurses]);
    useEffect(() => { DataService.saveMedications(medicationBank); }, [medicationBank]);
    useEffect(() => { DataService.saveLogs(patientLog); }, [patientLog]);

    useEffect(() => { localStorage.setItem('er_shifts', JSON.stringify(workShifts)); }, [workShifts]);
    useEffect(() => { localStorage.setItem('er_registrations', JSON.stringify(registrationLogs)); }, [registrationLogs]);
    useEffect(() => { localStorage.setItem('er_assignments', JSON.stringify(assignmentLogs)); }, [assignmentLogs]);
    useEffect(() => { localStorage.setItem('er_bulletin', bulletinMessage); }, [bulletinMessage]);
    useEffect(() => { localStorage.setItem('er_sections', JSON.stringify(sections)); }, [sections]);
    useEffect(() => { localStorage.setItem('er_specializations', JSON.stringify(specializations)); }, [specializations]);
    useEffect(() => { localStorage.setItem('er_skills', JSON.stringify(skills)); }, [skills]);
    useEffect(() => { localStorage.setItem('er_protocols', JSON.stringify(protocols)); }, [protocols]);
    useEffect(() => { localStorage.setItem('er_settings', JSON.stringify(appSettings)); }, [appSettings]);

    // Subscription for Beds (Supabase Real-time)
    useEffect(() => {
        const { unsubscribe } = DataService.subscribeToBeds((updatedBeds) => {
            setBeds(updatedBeds);
        });
        return () => unsubscribe();
    }, []);

    // Auto Refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(async () => {
            const fetchedBeds = await DataService.fetchBeds();
            setBeds(fetchedBeds);
        }, 60000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Refresh Audit Logs helper
    const refreshAuditLogs = async () => {
        const logs = await AuditService.fetchLogs();
        setAuditLogs(logs);
    };

    const resetData = () => {
        if (currentUser) AuditService.log(currentUser, 'RESET_DATA', 'Atstatyti pradiniai duomenys');
        setBeds(INITIAL_BEDS);
        setDoctors(DOCTORS);
        setNurses(NURSES);
        setMedications(INITIAL_MEDICATIONS);
        setPatientLog([]);
        setRegistrationLogs([]);
        setAssignmentLogs([]);
        setWorkShifts([]);
        setBulletinMessage('');
        localStorage.clear();
        window.location.reload();
    };

    return (
        <DataContext.Provider value={{
            beds, setBeds,
            doctors, setDoctors,
            nurses, setNurses,
            medicationBank, setMedications,
            protocols, setProtocols,
            patientLog, setPatientLog,
            registrationLogs, setRegistrationLogs,
            assignmentLogs, setAssignmentLogs,
            workShifts, setWorkShifts,
            auditLogs, refreshAuditLogs,
            sections, setSections,
            specializations, setSpecializations,
            skills, setSkills,
            appSettings, setAppSettings,
            bulletinMessage, setBulletinMessage,
            autoRefresh, setAutoRefresh,
            resetData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
