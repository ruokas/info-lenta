
export enum TriageCategory {
  IMMEDIATE = 1,
  EMERGENCY = 2,
  URGENT = 3,
  SEMI_URGENT = 4,
  NON_URGENT = 5
}

export enum PatientStatus {
  EMPTY = 'Laisva',
  CLEANING = 'Valoma', // NEW: Housekeeping status
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

// NEW: Definition for a drug in the bank
export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  route: string; // IV, IM, PO, SC, INF
  category?: string; // NEW: Grouping (e.g. Antibiotics, Painkillers)
  isActive?: boolean; // NEW: Soft delete/Archived status
  quantity: number; // NEW: Current stock
  minQuantity?: number; // NEW: Low stock alert threshold
  expirationDate?: string; // NEW: Expiration date for the medication batch
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
  consultationStatus?: 'CALLED' | 'ARRIVED' | 'COMPLETED'; // NEW: Workflow for consults
  calledAt?: string;
  arrivedAt?: string;
}

// NEW: Vitals
export interface Vitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  respRate?: number; // NEW: Respiratory Rate for NEWS2
  onOxygen?: boolean; // NEW: Is patient on supplemental oxygen?
  consciousness?: 'Alert' | 'CVPU'; // NEW: AVPU scale (simplified for NEWS2: Alert vs Confusion/Voice/Pain/Unresponsive)
  lastUpdated: string;
}

// NEW: Work Shift Structure
export interface WorkShift {
  id: string;
  doctorId: string;
  start: string; // ISO timestamp
  end: string;   // ISO timestamp
  type: 'DAY' | 'NIGHT' | 'CUSTOM';
}

// NEW: HR / Qualifications
export interface StaffSpecialization {
  id: string;
  name: string; // e.g. "Skubios med. gydytojas", "Rezidentas"
  isDoctor: boolean; // Does it apply to doctors or nurses?
}

export interface StaffSkill {
  id: string;
  label: string; // e.g. "ECHO", "PEDS", "TRIAGE"
  color: string; // tailwind color class e.g. "bg-blue-500"
  description?: string;
}

// NEW: User Preferences
export interface UserPreferences {
  defaultView?: 'dashboard' | 'map' | 'table' | 'tasks';
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  theme?: 'dark' | 'light'; // Reserved for future
}

export type User = Staff;

export interface Staff {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse' | 'Assistant' | 'Admin';
  isActive?: boolean; // Controlled by the system based on WorkShift (Shift Manager)
  currentShiftId?: string; // Link to active shift
  assignedSection?: string; // NEW: Physical section assignment (e.g. '1 Postas')
  isDisabled?: boolean; // NEW: Temporarily disabled in Bank (e.g. Vacation/Long leave)
  specializationId?: string; // NEW: Link to StaffSpecialization
  skillIds?: string[]; // NEW: Array of StaffSkill IDs
  phone?: string; // NEW: Short number
  email?: string; // NEW: Email address
  preferences?: UserPreferences; // NEW: User preferences
}

export interface UserProfile extends Staff {
  isAuthenticated: boolean;
  loginTime: string;
  authProvider?: 'local' | 'supabase';  // Autentifikacijos šaltinis
  supabaseId?: string;  // Supabase UUID kai prijungta
  hasPin?: boolean;  // Ar vartotojas turi nustatytą PIN
}

// Autentifikacijos kredencialai
export interface AuthCredentials {
  email?: string;
  password?: string;
  pin?: string;
  staffId?: string;
}

export interface Patient {
  id: string;
  name: string;
  symptoms: string;
  triageCategory: TriageCategory;
  arrivalTime: string;
  registeredBy?: string; // NEW: Nurse ID who performed triage
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

// NEW: Assignment Log for tracking workload
export interface AssignmentLog {
  id: string;
  doctorId: string;
  patientName: string;
  triageCategory: TriageCategory;
  assignedAt: string; // ISO timestamp
}

// NEW: Registration Log for Triage stats
export interface RegistrationLog {
  id: string;
  nurseId: string;
  patientName: string;
  triageCategory: TriageCategory;
  timestamp: string;
}

// NEW: Activity/Audit Log
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string; // e.g., 'LOGIN', 'DISCHARGE', 'UPDATE_BED', 'MED_GIVEN'
  details: string; // Human readable description
  metadata?: any; // Optional JSON data
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: 'ALERT' | 'INFO' | 'WARNING' | 'SUCCESS';
  category: 'PATIENT' | 'MEDICATION' | 'TASK' | 'SYSTEM';
  message: string;
  timestamp: string;
  isRead: boolean;
  bedId?: string;
  patientName?: string;
  targetUserId?: string; // For filtering notifications per user
  actionUrl?: string; // e.g. '/table' or '/map'
}

// NEW: Protocol Types
export interface ProtocolMedication {
  name: string;
  dose: string;
  route: string;
}

export interface ProtocolAction {
  type: ActionType;
  name: string;
}

export interface MedicationProtocol {
  id: string;
  name: string;
  meds: ProtocolMedication[];
  actions: ProtocolAction[];
}

export interface EditPatientModalProps {
  bed: Bed;
  beds: Bed[];
  doctors: User[];
  nurses: User[];
  currentUser: User;
  medicationBank?: MedicationItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (bed: Bed) => void;
  workShifts: WorkShift[];
  protocols?: MedicationProtocol[];
  onMovePatient?: (fromBedId: string, toBedId: string) => void;
  medicationCombinations?: MedicationProtocol[];
  onSaveCombination?: (combo: MedicationProtocol) => void;
  onDeleteCombination?: (comboId: string) => void;
  personalizedTopMeds?: MedicationItem[];
}

// NEW: App Settings
export interface AppSettings {
  overdueMinutes: number; // Default 240 (4 hours)
  cleaningMinutes: number; // Default 15? (Not used for logic yet but for alerts)
}
