import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Bed, Staff, PatientLogEntry, MedicationItem,
    WorkShift, AssignmentLog, RegistrationLog,
    MedicationProtocol, AppSettings, ActivityLog,
    StaffSpecialization, StaffSkill
} from '../../types';
import {
    PHYSICAL_SECTIONS, INITIAL_PROTOCOLS, DEFAULT_SETTINGS,
    INITIAL_SPECIALIZATIONS, INITIAL_SKILLS
} from '../../constants';
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
    const [beds, setBeds] = useState<Bed[]>([]);
    const [doctors, setDoctors] = useState<Staff[]>([]);
    const [nurses, setNurses] = useState<Staff[]>([]);
    const [medicationBank, setMedications] = useState<MedicationItem[]>([]);
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
        if (currentUser) {
            const fetchInitialData = async () => {
                const { data: bedsData, error: bedsError } = await supabase.from('patients').select('*');
                if (bedsError) console.error('Error fetching beds:', bedsError);
                else setBeds(bedsData as Bed[]);

                const { data: personnelData, error: personnelError } = await supabase.from('personnel').select('*, roles(name)');
                if (personnelError) console.error('Error fetching personnel:', personnelError);
                else {
                    const allPersonnel = personnelData as any[];
                    const doctors = allPersonnel.filter(p => p.roles.name === 'Doctor' || p.roles.name === 'Admin');
                    const nurses = allPersonnel.filter(p => p.roles.name === 'Nurse' || p.roles.name === 'Charge Nurse');
                    setDoctors(doctors);
                    setNurses(nurses);
                }

                const { data: drugsData, error: drugsError } = await supabase.from('drugs').select('*');
                if (drugsError) console.error('Error fetching drugs:', drugsError);
                else setMedications(drugsData as MedicationItem[]);

                const { data: shiftsData, error: shiftsError } = await supabase.from('shifts').select('*');
                if (shiftsError) console.error('Error fetching shifts:', shiftsError);
                else setWorkShifts(shiftsData as WorkShift[]);
            };

            fetchInitialData();
        }
    }, [currentUser]);

    // Subscription for Beds (Supabase Real-time)
    useEffect(() => {
        const channel = supabase.channel('public:patients');
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
            setBeds(prevBeds => {
                const newBed = payload.new as Bed;
                const index = prevBeds.findIndex(b => b.id === newBed.id);
                if (index > -1) {
                    const newBeds = [...prevBeds];
                    newBeds[index] = newBed;
                    return newBeds;
                }
                return [...prevBeds, newBed];
            });
          })
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Auto Refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(async () => {
            const { data: fetchedBeds, error } = await supabase.from('patients').select('*');
            if (!error) setBeds(fetchedBeds as Bed[]);
        }, 60000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Refresh Audit Logs helper
    const refreshAuditLogs = async () => {
        // This should be implemented to fetch logs from a Supabase table if needed
    };

    const resetData = () => {
        // This function is now less relevant as data is not stored locally.
        // It could be used to clear local state before a re-fetch, but a reload is simpler.
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
