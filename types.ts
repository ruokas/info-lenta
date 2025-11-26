
export enum TriageCategory {
  IMMEDIATE = 1,
  EMERGENCY = 2,
  URGENT = 3,
  SEMI_URGENT = 4,
  NON_URGENT = 5
}

export enum PatientStatus {
  EMPTY = 'Laisva',
  WAITING_EXAM = 'Laukia apžiūros',
  ADMITTING = 'Guldomas',
  DISCHARGE = 'Išrašomas',
  IV_DRIP = 'Lašinė',
  WAITING_TESTS = 'Laukia tyrimų',
  OBSERVATION = 'Stebėjimas'
}

export enum MedicationStatus {
  PENDING = 'Paskirta',
  GIVEN = 'Suleista',
  CANCELLED = 'Atšaukta'
}

export interface MedicationOrder {
  id: string;
  name: string;
  dose: string;
  route: string; // IV, IM, PO, SC
  orderedBy: string; // Doctor ID
  orderedAt: string; // ISO
  administeredBy?: string; // Nurse ID
  administeredAt?: string; // ISO
  status: MedicationStatus;
  reminderAt?: string; // NEW: ISO Timestamp for administration reminder
}

// NEW: Clinical Actions (Labs, X-Ray, etc.)
export type ActionType = 'LABS' | 'XRAY' | 'CT' | 'CONSULT' | 'ULTRASOUND' | 'EKG' | 'OTHER';

export interface ClinicalAction {
  id: string;
  type: ActionType;
  name: string; // e.g., "BKA, Kreatininas" or "Krūtinės ląsta"
  isCompleted: boolean;
  requestedAt: string;
  completedAt?: string; // NEW: Timestamp when action was marked done
}

// NEW: Vitals
export interface Vitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  lastUpdated: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse' | 'Assistant';
}

export interface UserProfile extends Staff {
  isAuthenticated: boolean;
  loginTime: string;
}

export interface Patient {
  id: string;
  name: string;
  symptoms: string;
  triageCategory: TriageCategory;
  arrivalTime: string;
  allergies?: string; // NEW: Allergies field
  medications?: MedicationOrder[];
  actions?: ClinicalAction[]; // NEW: Workflow actions
  vitals?: Vitals; // NEW: Vitals
}

export interface Bed {
  id: string;
  label: string; // e.g., "1", "P1", "IT1"
  section: string; // Grouping like in the excel (Nurse Assignment Group)
  assignedNurseId?: string;
  assignedAssistantId?: string;
  assignedDoctorId?: string;
  patient?: Patient;
  status: PatientStatus;
  comment?: string;
}

export interface SectionGroup {
  id: string;
  nurseName: string;
  assistantName?: string;
  beds: Bed[];
}

export interface PatientLogEntry {
  id: string;
  patientName: string;
  symptoms: string;
  triageCategory: TriageCategory;
  arrivalTime: string;
  dischargeTime: string; // ISO string for sorting
  totalDuration: string; // Formatted "Xh Ym"
  treatedByDoctorName?: string;
  finalStatus: PatientStatus; // The status they had before being removed (usually DISCHARGE)
  allergies?: string;
  medications?: MedicationOrder[]; // Full objects to show history
  actions?: ClinicalAction[]; // Full objects to show history
}

export interface AppNotification {
  id: string;
  type: 'ALERT' | 'INFO' | 'WARNING' | 'SUCCESS';
  message: string;
  timestamp: Date;
  isRead: boolean;
  bedId?: string; // Optional link to a bed
}