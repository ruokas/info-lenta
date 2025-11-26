import { Bed, PatientStatus, TriageCategory, Staff } from './types';

// Staff Data
export const DOCTORS: Staff[] = [
  { id: 'd1', name: 'Gyd. Nida', role: 'Doctor' },
  { id: 'd2', name: 'Gyd. Karolina', role: 'Doctor' },
  { id: 'd3', name: 'Gyd. Milda', role: 'Doctor' },
  { id: 'd4', name: 'Gyd. Rokas', role: 'Doctor' },
];

export const NURSES: Staff[] = [
  { id: 'n1', name: 'Aušra', role: 'Nurse' },
  { id: 'n2', name: 'Deimantė', role: 'Nurse' },
  { id: 'n3', name: 'Kristina M.', role: 'Nurse' },
  { id: 'n4', name: 'Armanda', role: 'Nurse' },
  { id: 'n5', name: 'Kristina A.', role: 'Nurse' },
  { id: 'n6', name: 'Amb. Slaug. 1', role: 'Nurse' },
  { id: 'n7', name: 'Amb. Slaug. 2', role: 'Nurse' },
];

export const COMMON_ER_DRUGS = [
  { name: 'Ketorolakas', dose: '30mg (1ml)', route: 'IV' }, // Ex Ketanov
  { name: 'Metamizolas', dose: '1g (2ml)', route: 'IV' },   // Ex Analgin
  { name: 'NaCl 0.9%', dose: '500ml', route: 'IV' },
  { name: 'Metoprololis', dose: '5mg', route: 'IV' },
  { name: 'Diazepamas', dose: '10mg', route: 'PO' },
  { name: 'Morfinas', dose: '5mg', route: 'SC' },
  { name: 'Paracetamolis', dose: '1g', route: 'IV' },
  { name: 'Epinefrinas', dose: '1mg', route: 'IV' },        // Ex Adrenalinas
  { name: 'Metoklopramidas', dose: '10mg (2ml)', route: 'IV' }, // Ex Cerucal
  { name: 'Drotaverinas', dose: '40mg (2ml)', route: 'IV' },    // Ex No-Spa
];

export const MEDICATION_PROTOCOLS = [
  { 
    name: 'Skausmo', 
    meds: [
      { name: 'Ketorolakas', dose: '30mg', route: 'IV' },
      { name: 'Paracetamolis', dose: '1g', route: 'IV' }
    ]
  },
  { 
    name: 'ŪKS (ACS)', 
    meds: [
      { name: 'Acetilsalicilo r.', dose: '300mg', route: 'PO' },
      { name: 'Tikagreloras', dose: '180mg', route: 'PO' },
      { name: 'Heparinas', dose: '5000UI', route: 'IV' }
    ]
  },
  { 
    name: 'Sepsis', 
    meds: [
      { name: 'NaCl 0.9%', dose: '1000ml', route: 'IV' },
      { name: 'Amoksicilinas/Klavulano r.', dose: '1.2g', route: 'IV' },
      { name: 'Paracetamolis', dose: '1g', route: 'IV' }
    ]
  },
  { 
    name: 'Pykinimo', 
    meds: [
      { name: 'Metoklopramidas', dose: '10mg', route: 'IV' },
      { name: 'NaCl 0.9%', dose: '500ml', route: 'IV' }
    ]
  }
];

// Initial Bed State with new Lithuanian Mock Data
export const INITIAL_BEDS: Bed[] = [
  // Section 1: Aušra
  { id: 'bed-it1', label: 'IT1', section: 'Aušra', status: PatientStatus.EMPTY },
  { 
    id: 'bed-it2', label: 'IT2', section: 'Aušra', assignedDoctorId: 'd1', status: PatientStatus.OBSERVATION,
    patient: { id: 'p1', name: 'Jonas Petrauskas', symptoms: 'Sunkus kvėpavimo nepakankamumas', triageCategory: TriageCategory.IMMEDIATE, arrivalTime: '08:15' },
    comment: 'Stebėti saturaciją'
  },
  { 
    id: 'bed-1', label: '1', section: 'Aušra', assignedDoctorId: 'd1', status: PatientStatus.ADMITTING,
    patient: { id: 'p2', name: 'Ona Kazlauskienė', symptoms: 'Krūtinės angina', triageCategory: TriageCategory.EMERGENCY, arrivalTime: '09:30' },
    comment: 'EKG pakitimai'
  },
  { id: 'bed-p1', label: 'P1', section: 'Aušra', status: PatientStatus.EMPTY },
  { 
    id: 'bed-2', label: '2', section: 'Aušra', assignedDoctorId: 'd2', status: PatientStatus.WAITING_EXAM,
    patient: { id: 'p3', name: 'Tomas Banys', symptoms: 'Pilvo skausmai', triageCategory: TriageCategory.URGENT, arrivalTime: '10:00' },
    comment: 'Ūmus pankreatitas?'
  },
  { 
    id: 'bed-p2', label: 'P2', section: 'Aušra', status: PatientStatus.EMPTY
  },
  { id: 'bed-3', label: '3', section: 'Aušra', status: PatientStatus.EMPTY },
  { 
    id: 'bed-p3', label: 'P3', section: 'Aušra', assignedDoctorId: 'd2', status: PatientStatus.IV_DRIP,
    patient: { id: 'p4', name: 'Laima Stankevičienė', symptoms: 'Dehidratacija', triageCategory: TriageCategory.URGENT, arrivalTime: '10:15' },
    comment: 'Laša Ringeris'
  },

  // Section 2: Deimantė
  { 
    id: 'bed-4', label: '4', section: 'Deimantė', assignedDoctorId: 'd2', status: PatientStatus.WAITING_EXAM,
    patient: { id: 'p5', name: 'Petras Jankauskas', symptoms: 'Galvos svaigimas', triageCategory: TriageCategory.SEMI_URGENT, arrivalTime: '10:45' }
  },
  { 
    id: 'bed-p4', label: 'P4', section: 'Deimantė', status: PatientStatus.EMPTY
  },
  { 
    id: 'bed-5', label: '5', section: 'Deimantė', assignedDoctorId: 'd3', status: PatientStatus.DISCHARGE,
    patient: { id: 'p7', name: 'Darius Vaitkus', symptoms: 'Hipertenzinė krizė', triageCategory: TriageCategory.URGENT, arrivalTime: '08:00' },
    comment: 'Spaudimas nukrito, išleidžiamas'
  },
  { id: 'bed-p5', label: 'P5', section: 'Deimantė', status: PatientStatus.EMPTY },
  { 
    id: 'bed-s5', label: 'S5', section: 'Deimantė', assignedDoctorId: 'd3', status: PatientStatus.WAITING_TESTS,
    patient: { id: 'p8', name: 'Rasa Urbonienė', symptoms: 'Inksto kolika', triageCategory: TriageCategory.URGENT, arrivalTime: '11:10' },
    comment: 'Laukia echoskopijos'
  },
  { id: 'bed-6', label: '6', section: 'Deimantė', status: PatientStatus.EMPTY },
  { id: 'bed-p6', label: 'P6', section: 'Deimantė', status: PatientStatus.EMPTY },
  { 
    id: 'bed-s6', label: 'S6', section: 'Deimantė', assignedDoctorId: 'd2', status: PatientStatus.IV_DRIP,
    patient: { id: 'p9', name: 'Saulius Lukšys', symptoms: 'Apsinuodijimas', triageCategory: TriageCategory.URGENT, arrivalTime: '11:20' },
    comment: 'Pykina'
  },

  // Section 3: Kristina M.
  { id: 'bed-7', label: '7', section: 'Kristina M.', status: PatientStatus.EMPTY },
  { id: 'bed-p7', label: 'P7', section: 'Kristina M.', status: PatientStatus.EMPTY },
  { 
    id: 'bed-s7', label: 'S7', section: 'Kristina M.', assignedDoctorId: 'd4', status: PatientStatus.IV_DRIP,
    patient: { id: 'p10', name: 'Elena Žukauskienė', symptoms: 'Bendras silpnumas', triageCategory: TriageCategory.SEMI_URGENT, arrivalTime: '11:35' },
    comment: 'Vyresnio amžiaus'
  },
  { 
    id: 'bed-8', label: '8', section: 'Kristina M.', assignedDoctorId: 'd1', status: PatientStatus.WAITING_EXAM,
    patient: { id: 'p11', name: 'Andrius Vasiliauskas', symptoms: 'Nugaros skausmas', triageCategory: TriageCategory.NON_URGENT, arrivalTime: '12:00' },
    comment: 'Lėtinis radikulitas'
  },
  { id: 'bed-p8', label: 'P8', section: 'Kristina M.', status: PatientStatus.EMPTY },
  { id: 'bed-s8', label: 'S8', section: 'Kristina M.', status: PatientStatus.EMPTY },
  { id: 'bed-9', label: '9', section: 'Kristina M.', status: PatientStatus.EMPTY },
  { id: 'bed-p9', label: 'P9', section: 'Kristina M.', status: PatientStatus.EMPTY },
  { id: 'bed-s9', label: 'S9', section: 'Kristina M.', status: PatientStatus.EMPTY },

  // Section 4: Armanda
  { id: 'bed-10', label: '10', section: 'Armanda', status: PatientStatus.EMPTY },
  { 
    id: 'bed-p10', label: 'P10', section: 'Armanda', assignedDoctorId: 'd3', status: PatientStatus.WAITING_EXAM, 
    patient: {id: 'p13', name: 'Viktoras Butkus', symptoms: 'Pritraukė koją', triageCategory: TriageCategory.URGENT, arrivalTime: '12:15'}, 
    comment: 'Traumatologas pakviestas' 
  },
  { id: 'bed-s10', label: 'S10', section: 'Armanda', status: PatientStatus.EMPTY },
  { 
    id: 'bed-11', label: '11', section: 'Armanda', assignedDoctorId: 'd1', status: PatientStatus.IV_DRIP, 
    patient: {id: 'p14', name: 'Inga Kavaliauskaitė', symptoms: 'Alerginė reakcija', triageCategory: TriageCategory.EMERGENCY, arrivalTime: '12:30'}, 
    comment: 'Bėrimas, tinimas' 
  },
  { id: 'bed-p11', label: 'P11', section: 'Armanda', status: PatientStatus.EMPTY },
  { id: 'bed-s11', label: 'S11', section: 'Armanda', status: PatientStatus.EMPTY },
  { id: 'bed-12', label: '12', section: 'Armanda', status: PatientStatus.EMPTY },
  { id: 'bed-p12', label: 'P12', section: 'Armanda', status: PatientStatus.EMPTY },
  { id: 'bed-s12', label: 'S12', section: 'Armanda', status: PatientStatus.EMPTY },

  // Section 5: Kristina A.
  { id: 'bed-13', label: '13', section: 'Kristina A.', status: PatientStatus.EMPTY },
  { id: 'bed-14', label: '14', section: 'Kristina A.', status: PatientStatus.EMPTY },
  { id: 'bed-15', label: '15', section: 'Kristina A.', status: PatientStatus.EMPTY },
  { 
    id: 'bed-16', label: '16', section: 'Kristina A.', assignedDoctorId: 'd1', status: PatientStatus.WAITING_TESTS, 
    patient: {id: 'p15', name: 'Mantas Navickas', symptoms: 'Dusulys', triageCategory: TriageCategory.URGENT, arrivalTime: '12:50'}, 
    comment: 'Astmos paūmėjimas' 
  },
  { id: 'bed-17', label: '17', section: 'Kristina A.', status: PatientStatus.EMPTY },
  { id: 'bed-121a', label: '121A', section: 'Kristina A.', status: PatientStatus.EMPTY },
  { id: 'bed-121b', label: '121B', section: 'Kristina A.', status: PatientStatus.EMPTY },
  { id: 'bed-izo', label: 'IZO', section: 'Kristina A.', status: PatientStatus.EMPTY },

  // Section 6: Ambulatorinis (Shared 2 Nurses)
  { id: 'bed-a1', label: 'A1', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a2', label: 'A2', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a3', label: 'A3', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a4', label: 'A4', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a5', label: 'A5', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a6', label: 'A6', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a7', label: 'A7', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a8', label: 'A8', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a9', label: 'A9', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
  { id: 'bed-a10', label: 'A10', section: 'Ambulatorinis (2 slaug.)', status: PatientStatus.EMPTY },
];

export const STATUS_COLORS: Record<PatientStatus, string> = {
  [PatientStatus.EMPTY]: 'bg-slate-800 text-slate-500',
  [PatientStatus.WAITING_EXAM]: 'bg-red-900/40 text-red-200 border-red-800/50',
  [PatientStatus.ADMITTING]: 'bg-red-700 text-white border-red-600',
  [PatientStatus.DISCHARGE]: 'bg-green-700 text-white border-green-600',
  [PatientStatus.IV_DRIP]: 'bg-blue-900/40 text-blue-200 border-blue-800/50',
  [PatientStatus.WAITING_TESTS]: 'bg-yellow-900/40 text-yellow-200 border-yellow-800/50',
  [PatientStatus.OBSERVATION]: 'bg-purple-900/40 text-purple-200 border-purple-800/50',
};

export const TRIAGE_COLORS: Record<number, string> = {
  1: 'bg-blue-600 text-white',      // 1 - Mėlyna
  2: 'bg-red-600 text-white',       // 2 - Raudona
  3: 'bg-yellow-500 text-slate-900',// 3 - Geltona
  4: 'bg-green-600 text-white',     // 4 - Žalia
  5: 'bg-white text-slate-900',     // 5 - Balta
};