
import { Bed, PatientStatus, TriageCategory, Staff, MedicationItem, MedicationProtocol, AppSettings, StaffSpecialization, StaffSkill } from './types';

export const PHYSICAL_SECTIONS = [
  'Triažas',
  '1 Postas',
  '2 Postas',
  '3 Postas',
  '4 Postas',
  '5 Postas',
  'Ambulatorija',
  'Traumos'
];

// Initial HR Data
export const INITIAL_SPECIALIZATIONS: StaffSpecialization[] = [
  { id: 'spec-emd', name: 'Skubios med. gydytojas', isDoctor: true },
  { id: 'spec-res', name: 'Rezidentas', isDoctor: true },
  { id: 'spec-med', name: 'Medicinos gydytojas', isDoctor: true },
  { id: 'spec-trauma', name: 'Traumatologas', isDoctor: true },
  { id: 'spec-gp', name: 'Bendrosios praktikos', isDoctor: false },
  { id: 'spec-anes', name: 'AITS slaugytoja', isDoctor: false },
];

export const INITIAL_SKILLS: StaffSkill[] = [
  { id: 'skill-echo', label: 'ECHO', color: 'bg-blue-500', description: 'Gali atlikti echoskopiją' },
  { id: 'skill-peds', label: 'PEDS', color: 'bg-pink-500', description: 'Gali prižiūrėti vaikus' },
  { id: 'skill-als', label: 'ALS', color: 'bg-red-500', description: 'Reanimacijos sertifikatas' },
  { id: 'skill-triage', label: 'TRIAŽAS', color: 'bg-indigo-500', description: 'Gali dirbti triaže' },
];

// Staff Data
export const DOCTORS: Staff[] = [
  { id: 'd1', name: 'Gyd. Nida', role: 'Doctor', specializationId: 'spec-emd', skillIds: ['skill-echo'] },
  { id: 'd2', name: 'Gyd. Karolina', role: 'Doctor', specializationId: 'spec-res', skillIds: [] },
  { id: 'd3', name: 'Gyd. Milda', role: 'Doctor', specializationId: 'spec-emd', skillIds: ['skill-als'] },
  { id: 'd4', name: 'Gyd. Rokas', role: 'Doctor', specializationId: 'spec-trauma', skillIds: [] },
];

export const NURSES: Staff[] = [
  { id: 'n1', name: 'Aušra', role: 'Nurse', assignedSection: '1 Postas', specializationId: 'spec-gp' },
  { id: 'n2', name: 'Deimantė', role: 'Nurse', assignedSection: '2 Postas', specializationId: 'spec-gp' },
  { id: 'n3', name: 'Kristina M.', role: 'Nurse', assignedSection: '3 Postas', specializationId: 'spec-gp' },
  { id: 'n4', name: 'Armanda', role: 'Nurse', assignedSection: '4 Postas', specializationId: 'spec-gp' },
  { id: 'n5', name: 'Kristina A.', role: 'Nurse', assignedSection: '5 Postas', specializationId: 'spec-gp' },
  { id: 'n6', name: 'Amb. Slaug. 1', role: 'Nurse', assignedSection: 'Ambulatorija', specializationId: 'spec-gp' },
  { id: 'n7', name: 'Amb. Slaug. 2', role: 'Nurse', assignedSection: 'Ambulatorija', specializationId: 'spec-gp' },
  { id: 'n8', name: 'Traumų Slaug.', role: 'Nurse', assignedSection: 'Traumos', specializationId: 'spec-gp' },
  { id: 'n_triage_default', name: 'Triažo Slaug.', role: 'Nurse', assignedSection: 'Triažas', specializationId: 'spec-gp', skillIds: ['skill-triage'] },
];

// Initial Medication Bank (Used if no custom data saved)
export const INITIAL_MEDICATIONS: MedicationItem[] = [
  { id: 'm1', name: 'Acetylcysteinum', dose: '600mg', route: 'PO', category: 'Kiti' },
  { id: 'm2', name: 'Acidum acetylsalicylicum', dose: '100mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm3', name: 'Actilyse', dose: '50mg', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm4', name: 'Adenosinum', dose: '5mg/ml 2ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm5', name: 'Adrenalinum', dose: '1mg/ml 1ml', route: 'IV', category: 'Reanimaciniai' },
  { id: 'm6', name: 'Aktyvioji anglis', dose: '2,88g', route: 'PO', category: 'Toksikologiniai' },
  { id: 'm7', name: 'Aminofilinum', dose: '24mg/ml', route: 'IV', category: 'Kvėpavimo takams' },
  { id: 'm8', name: 'Amiodaronum', dose: '50mg/ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm9', name: 'Amlodipinum', dose: '10mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm10', name: 'Amoxicillinum/Acidum Clavulanicum', dose: '1000/200mg', route: 'IV', category: 'Antibiotikai' },
  { id: 'm11', name: 'Antitoks.serumas muo gyvačių nuodų', dose: '1 amp', route: 'IV', category: 'Toksikologiniai' },
  { id: 'm12', name: 'Apixabanum', dose: '2,5mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm13', name: 'Apixabanum', dose: '5mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm14', name: 'Atropini sulfas', dose: '1mg/ml 1ml', route: 'IV', category: 'Reanimaciniai' },
  { id: 'm15', name: 'Bisoprololum', dose: '5mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm16', name: 'Captoprilum', dose: '25mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm17', name: 'Captoprilum', dose: '50mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm18', name: 'Carbamazepinum', dose: '200mg', route: 'PO', category: 'Neurologiniai' },
  { id: 'm19', name: 'Cefazolinum', dose: '1g', route: 'IV', category: 'Antibiotikai' },
  { id: 'm20', name: 'Cefriaxonum', dose: '1g', route: 'IV', category: 'Antibiotikai' },
  { id: 'm21', name: 'Cefuroximum', dose: '1500mg', route: 'IV', category: 'Antibiotikai' },
  { id: 'm22', name: 'Ciprofloxacinum', dose: '500mg', route: 'PO', category: 'Antibiotikai' },
  { id: 'm23', name: 'Clarithromycinum', dose: '500mg', route: 'PO', category: 'Antibiotikai' },
  { id: 'm24', name: 'Clemastinum', dose: '1mg/ml', route: 'IV', category: 'Priešalerginiai' },
  { id: 'm25', name: 'Clopidogrelum', dose: '75mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm26', name: 'Dexamethasonum', dose: '4mg/ml', route: 'IV', category: 'Priešalerginiai' },
  { id: 'm27', name: 'Dicynone', dose: '250mg 2ml', route: 'IV', category: 'Kraujavimui' },
  { id: 'm28', name: 'Diclofenacum', dose: '75mg/3ml', route: 'IM', category: 'Nuskausminamieji' },
  { id: 'm29', name: 'Drotaverinum', dose: '40mg/2ml', route: 'IV', category: 'Spazmolitikai' },
  { id: 'm30', name: 'Duphalac', dose: '500ml', route: 'PO', category: 'Virškinimo traktui' },
  { id: 'm31', name: 'Enaloprilum', dose: '1,25mg/ml 1ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm32', name: 'Esomeprazolum', dose: '40mg', route: 'IV', category: 'Virškinimo traktui' },
  { id: 'm33', name: 'Etomidatum', dose: '2mg/ml', route: 'IV', category: 'Sedacija' },
  { id: 'm34', name: 'Furosemidum', dose: '10mg/ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm35', name: 'Glyceroli trinitras', dose: '0,5mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm36', name: 'Glyceroli trinitras', dose: '1mg/ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm37', name: 'Heparinum', dose: '25000 IU/5ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm38', name: 'Hydrogenii peroxidi 3%', dose: '100ml', route: 'Topical', category: 'Kiti' },
  { id: 'm39', name: 'Ibuprofenum', dose: '400mg', route: 'PO', category: 'Nuskausminamieji' },
  { id: 'm40', name: 'Imovax d.T adult', dose: '0.5ml', route: 'IM', category: 'Vakcinos' },
  { id: 'm41', name: 'Insulinum Humulin', dose: 'var', route: 'SC', category: 'Endokrinologiniai' },
  { id: 'm42', name: 'Isosorbidum dinitrum', dose: '10mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm43', name: 'Kalii chloridum', dose: '750mg', route: 'PO', category: 'Elektrolitai' },
  { id: 'm44', name: 'Ketoprofenum', dose: '100mg/2ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm45', name: 'Ketorolaci tromethaminum', dose: '30mg/ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm46', name: 'Loperamidum', dose: '2mg', route: 'PO', category: 'Virškinimo traktui' },
  { id: 'm47', name: 'Magnesium sulfatum', dose: '250mg/ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm48', name: 'Metamizolum sodium', dose: '500mg/ml 2ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm49', name: 'Metoclopramidum', dose: '5mg/ml 2ml', route: 'IV', category: 'Virškinimo traktui' },
  { id: 'm50', name: 'Metoprololum', dose: '1mg/ml 5ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm51', name: 'Metoprololum', dose: '25mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm52', name: 'Metoprololum', dose: '47,5mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm53', name: 'Microlax', dose: '5ml', route: 'PR', category: 'Virškinimo traktui' },
  { id: 'm54', name: 'Moxonidinum', dose: '0,4mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm55', name: 'Nadroparinum calcicum', dose: '2850 anti-Xa TV/0,3ml', route: 'SC', category: 'Kardiologiniai' },
  { id: 'm56', name: 'Nadroparinum calcicum', dose: '5700 anti-Xa TV/0,6ml', route: 'SC', category: 'Kardiologiniai' },
  { id: 'm57', name: 'Naloxonum', dose: '0,4mg/ml 1ml', route: 'IV', category: 'Reanimaciniai' },
  { id: 'm58', name: 'Norepinephrinum', dose: '1mg/ml 4ml', route: 'IV', category: 'Reanimaciniai' },
  { id: 'm59', name: 'NovoRapid FlexPen', dose: '100V/ml', route: 'SC', category: 'Endokrinologiniai' },
  { id: 'm60', name: 'Ondansetronum', dose: '2mg/ml 4ml', route: 'IV', category: 'Virškinimo traktui' },
  { id: 'm61', name: 'Pantoprazolum', dose: '40mg', route: 'IV', category: 'Virškinimo traktui' },
  { id: 'm62', name: 'Paracetamolum', dose: '10mg/ml 100ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm63', name: 'Paracetamolum', dose: '500mg', route: 'PO', category: 'Nuskausminamieji' },
  { id: 'm64', name: 'Penicilinum', dose: '1000000TV', route: 'IV', category: 'Antibiotikai' },
  { id: 'm65', name: 'Pentoxifyllinum', dose: '20mg/ml 5ml', route: 'IV', category: 'Kiti' },
  { id: 'm66', name: 'Propofolum', dose: '10mg/ml 20ml', route: 'IV', category: 'Sedacija' },
  { id: 'm67', name: 'Ramiprilum', dose: '10mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm68', name: 'Rocuronium bromide', dose: '10mg/ml 5ml', route: 'IV', category: 'Reanimaciniai' },
  { id: 'm69', name: 'Salbutamolum', dose: '100mcg/doz.', route: 'Inhal', category: 'Kvėpavimo takams' },
  { id: 'm70', name: 'Salbutamolum', dose: '2,5mg/2,5ml', route: 'Nebul', category: 'Kvėpavimo takams' },
  { id: 'm71', name: 'Salbutamolum', dose: '500mcg/ml', route: 'IV', category: 'Kvėpavimo takams' },
  { id: 'm72', name: 'Thiaminum', dose: '50mg/ml 2ml', route: 'IV', category: 'Vitaminai' },
  { id: 'm73', name: 'Nifedipinum', dose: '20mg', route: 'PO', category: 'Kardiologiniai' },
  { id: 'm74', name: 'Piperacillinum/Tazobactamum', dose: '4/0,5g', route: 'IV', category: 'Antibiotikai' },
  { id: 'm75', name: 'Midazolamum', dose: '5mg/ml 1ml', route: 'IV', category: 'Sedacija' },
  { id: 'm76', name: 'Tiapridum', dose: '100mg/2ml', route: 'IV', category: 'Neurologiniai' },
  { id: 'm77', name: 'Diazepamum', dose: '5mg/ml 2ml', route: 'IV', category: 'Neurologiniai' },
  { id: 'm78', name: 'Diazepamum', dose: '5mg', route: 'PO', category: 'Neurologiniai' },
  { id: 'm79', name: 'Haloperidolum', dose: '5mg/ml 1ml', route: 'IV', category: 'Neurologiniai' },
  { id: 'm80', name: 'Digoxinum', dose: '0,5mg/2ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm81', name: 'Flumazenilum', dose: '0,1mg/ml 5ml', route: 'IV', category: 'Reanimaciniai' },
  { id: 'm82', name: 'Calcium gluconatum', dose: '10% 10ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm83', name: 'Phytomenadionum', dose: '10mg/ml 1ml', route: 'IM', category: 'Vitaminai' },
  { id: 'm84', name: 'Tranexamic acid', dose: '100mg/ml 5ml', route: 'IV', category: 'Kraujavimui' },
  { id: 'm85', name: 'Ketaminum hydrochloridum', dose: '250mg/5ml', route: 'IV', category: 'Sedacija' },
  { id: 'm86', name: 'Labetalolum', dose: '5mg/ml 20ml', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm87', name: 'Glucose', dose: '40% 10ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm88', name: 'Natrio Nitroprusidas', dose: 'var', route: 'IV', category: 'Kardiologiniai' },
  { id: 'm89', name: 'Ultracarbon', dose: '61,5/50g', route: 'PO', category: 'Toksikologiniai' },
  { id: 'm90', name: 'Morphinum', dose: '10mg/ml 1ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm91', name: 'Fentanylum', dose: '50mcg/ml 2ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm92', name: 'Tramadolum', dose: '50mg/ml 2ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm93', name: 'Pethidinum', dose: '50mg/ml 1ml', route: 'IV', category: 'Nuskausminamieji' },
  { id: 'm94', name: 'Mannitol Fresenius', dose: '10% 500ml', route: 'IV', category: 'Kiti' },
  { id: 'm95', name: 'Sodium Bicarbonate', dose: '8,4% 100ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm96', name: 'Sodium chloride', dose: '10% 100ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm97', name: 'Potassium chloride', dose: '10% 100ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm98', name: 'Metronidazolum', dose: '0.5% 100ml', route: 'IV', category: 'Antibiotikai' },
  { id: 'm99', name: 'Sodium chloride', dose: '0,9% 500ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm100', name: 'Ringeri', dose: '500ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm101', name: 'Ringeri', dose: '1000ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm102', name: 'Sodium chloride', dose: '0.9% 250ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm103', name: 'Glucose', dose: '20% 500ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm104', name: 'Glucose', dose: '10% 500ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm105', name: 'Glucose', dose: '5% 500ml', route: 'IV', category: 'Elektrolitai' },
  { id: 'm106', name: 'Etanolio tirpalas', dose: '70% 100ml', route: 'Topical', category: 'Toksikologiniai' },
];

export const INITIAL_PROTOCOLS: MedicationProtocol[] = [
  { 
    id: 'prot-pain',
    name: 'Skausmo', 
    meds: [
      { name: 'Ketorolaci tromethaminum', dose: '30mg', route: 'IV' },
      { name: 'Paracetamolum', dose: '1g', route: 'IV' }
    ],
    actions: []
  },
  { 
    id: 'prot-acs',
    name: 'ŪKS (ACS)', 
    meds: [
      { name: 'Acidum acetylsalicylicum', dose: '300mg', route: 'PO' },
      { name: 'Tikagreloras', dose: '180mg', route: 'PO' },
      { name: 'Heparinum', dose: '5000UI', route: 'IV' }
    ],
    actions: [
      { type: 'EKG', name: 'EKG' }
    ]
  },
  { 
    id: 'prot-sepsis',
    name: 'Sepsis', 
    meds: [
      { name: 'Sodium chloride 0,9%', dose: '1000ml', route: 'IV' },
      { name: 'Amoxicillinum/Acidum Clavulanicum', dose: '1.2g', route: 'IV' },
      { name: 'Paracetamolum', dose: '1g', route: 'IV' }
    ],
    actions: [
      { type: 'LABS', name: 'Kraujo Pasėlis' },
      { type: 'LABS', name: 'Laktatas' }
    ]
  },
  { 
    id: 'prot-nausea',
    name: 'Pykinimo', 
    meds: [
      { name: 'Metoclopramidum', dose: '10mg', route: 'IV' },
      { name: 'Sodium chloride 0,9%', dose: '500ml', route: 'IV' }
    ],
    actions: []
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  overdueMinutes: 240, // 4 hours
  cleaningMinutes: 15
};

// Deprecated: Kept for backward compatibility if needed, but App uses INITIAL_PROTOCOLS
export const MEDICATION_PROTOCOLS = [
  { 
    name: 'Skausmo', 
    meds: [
      { name: 'Ketorolaci tromethaminum', dose: '30mg', route: 'IV' },
      { name: 'Paracetamolum', dose: '1g', route: 'IV' }
    ]
  },
  { 
    name: 'ŪKS (ACS)', 
    meds: [
      { name: 'Acidum acetylsalicylicum', dose: '300mg', route: 'PO' },
      { name: 'Tikagreloras', dose: '180mg', route: 'PO' },
      { name: 'Heparinum', dose: '5000UI', route: 'IV' }
    ]
  },
  { 
    name: 'Sepsis', 
    meds: [
      { name: 'Sodium chloride 0,9%', dose: '1000ml', route: 'IV' },
      { name: 'Amoxicillinum/Acidum Clavulanicum', dose: '1.2g', route: 'IV' },
      { name: 'Paracetamolum', dose: '1g', route: 'IV' }
    ]
  },
  { 
    name: 'Pykinimo', 
    meds: [
      { name: 'Metoclopramidum', dose: '10mg', route: 'IV' },
      { name: 'Sodium chloride 0,9%', dose: '500ml', route: 'IV' }
    ]
  }
];

// Initial Bed State with new Lithuanian Mock Data
export const INITIAL_BEDS: Bed[] = [
  // Section 1: 1 Postas (was Aušra)
  { id: 'bed-it1', label: 'IT1', section: '1 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-it2', label: 'IT2', section: '1 Postas', assignedDoctorId: 'd1', status: PatientStatus.OBSERVATION,
    patient: { id: 'p1', name: 'Jonas Petrauskas', symptoms: 'Sunkus kvėpavimo nepakankamumas', triageCategory: TriageCategory.IMMEDIATE, arrivalTime: '08:15' },
    comment: 'Stebėti saturaciją'
  },
  { 
    id: 'bed-1', label: '1', section: '1 Postas', assignedDoctorId: 'd1', status: PatientStatus.ADMITTING,
    patient: { id: 'p2', name: 'Ona Kazlauskienė', symptoms: 'Krūtinės angina', triageCategory: TriageCategory.EMERGENCY, arrivalTime: '09:30' },
    comment: 'EKG pakitimai'
  },
  { id: 'bed-p1', label: 'P1', section: '1 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-2', label: '2', section: '1 Postas', assignedDoctorId: 'd2', status: PatientStatus.WAITING_EXAM,
    patient: { id: 'p3', name: 'Tomas Banys', symptoms: 'Pilvo skausmai', triageCategory: TriageCategory.URGENT, arrivalTime: '10:00' },
    comment: 'Ūmus pankreatitas?'
  },
  { 
    id: 'bed-p2', label: 'P2', section: '1 Postas', status: PatientStatus.EMPTY
  },
  { id: 'bed-3', label: '3', section: '1 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-p3', label: 'P3', section: '1 Postas', assignedDoctorId: 'd2', status: PatientStatus.IV_DRIP,
    patient: { id: 'p4', name: 'Laima Stankevičienė', symptoms: 'Dehidratacija', triageCategory: TriageCategory.URGENT, arrivalTime: '10:15' },
    comment: 'Laša Ringeris'
  },
  // Rezervinės 1 Postas
  { id: 'bed-r1', label: 'R1', section: '1 Postas', status: PatientStatus.EMPTY },

  // Section 2: 2 Postas (was Deimantė)
  { 
    id: 'bed-4', label: '4', section: '2 Postas', assignedDoctorId: 'd2', status: PatientStatus.WAITING_EXAM,
    patient: { id: 'p5', name: 'Petras Jankauskas', symptoms: 'Galvos svaigimas', triageCategory: TriageCategory.SEMI_URGENT, arrivalTime: '10:45' }
  },
  { 
    id: 'bed-p4', label: 'P4', section: '2 Postas', status: PatientStatus.EMPTY
  },
  { 
    id: 'bed-5', label: '5', section: '2 Postas', assignedDoctorId: 'd3', status: PatientStatus.DISCHARGE,
    patient: { id: 'p7', name: 'Darius Vaitkus', symptoms: 'Hipertenzinė krizė', triageCategory: TriageCategory.URGENT, arrivalTime: '08:00' },
    comment: 'Spaudimas nukrito, išleidžiamas'
  },
  { id: 'bed-p5', label: 'P5', section: '2 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-s5', label: 'S5', section: '2 Postas', assignedDoctorId: 'd3', status: PatientStatus.WAITING_TESTS,
    patient: { id: 'p8', name: 'Rasa Urbonienė', symptoms: 'Inksto kolika', triageCategory: TriageCategory.URGENT, arrivalTime: '11:10' },
    comment: 'Laukia echoskopijos'
  },
  { id: 'bed-6', label: '6', section: '2 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-p6', label: 'P6', section: '2 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-s6', label: 'S6', section: '2 Postas', assignedDoctorId: 'd2', status: PatientStatus.IV_DRIP,
    patient: { id: 'p9', name: 'Saulius Lukšys', symptoms: 'Apsinuodijimas', triageCategory: TriageCategory.URGENT, arrivalTime: '11:20' },
    comment: 'Pykina'
  },
  // Rezervinės 2 Postas
  { id: 'bed-r2', label: 'R2', section: '2 Postas', status: PatientStatus.EMPTY },

  // Section 3: 3 Postas (was Kristina M.)
  { id: 'bed-7', label: '7', section: '3 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-p7', label: 'P7', section: '3 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-s7', label: 'S7', section: '3 Postas', assignedDoctorId: 'd4', status: PatientStatus.IV_DRIP,
    patient: { id: 'p10', name: 'Elena Žukauskienė', symptoms: 'Bendras silpnumas', triageCategory: TriageCategory.SEMI_URGENT, arrivalTime: '11:35' },
    comment: 'Vyresnio amžiaus'
  },
  { 
    id: 'bed-8', label: '8', section: '3 Postas', assignedDoctorId: 'd1', status: PatientStatus.WAITING_EXAM,
    patient: { id: 'p11', name: 'Andrius Vasiliauskas', symptoms: 'Nugaros skausmas', triageCategory: TriageCategory.NON_URGENT, arrivalTime: '12:00' },
    comment: 'Lėtinis radikulitas'
  },
  { id: 'bed-p8', label: 'P8', section: '3 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-s8', label: 'S8', section: '3 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-9', label: '9', section: '3 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-p9', label: 'P9', section: '3 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-s9', label: 'S9', section: '3 Postas', status: PatientStatus.EMPTY },
  // Rezervinės 3 Postas
  { id: 'bed-r3', label: 'R3', section: '3 Postas', status: PatientStatus.EMPTY },

  // Section 4: 4 Postas (was Armanda)
  { id: 'bed-10', label: '10', section: '4 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-p10', label: 'P10', section: '4 Postas', assignedDoctorId: 'd3', status: PatientStatus.WAITING_EXAM, 
    patient: {id: 'p13', name: 'Viktoras Butkus', symptoms: 'Pritraukė koją', triageCategory: TriageCategory.URGENT, arrivalTime: '12:15'}, 
    comment: 'Traumatologas pakviestas' 
  },
  { id: 'bed-s10', label: 'S10', section: '4 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-11', label: '11', section: '4 Postas', assignedDoctorId: 'd1', status: PatientStatus.IV_DRIP, 
    patient: {id: 'p14', name: 'Inga Kavaliauskaitė', symptoms: 'Alerginė reakcija', triageCategory: TriageCategory.EMERGENCY, arrivalTime: '12:30'}, 
    comment: 'Bėrimas, tinimas' 
  },
  { id: 'bed-p11', label: 'P11', section: '4 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-s11', label: 'S11', section: '4 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-12', label: '12', section: '4 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-p12', label: 'P12', section: '4 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-s12', label: 'S12', section: '4 Postas', status: PatientStatus.EMPTY },
  // Rezervinės 4 Postas
  { id: 'bed-r4', label: 'R4', section: '4 Postas', status: PatientStatus.EMPTY },

  // Section 5: 5 Postas (was Kristina A.)
  { id: 'bed-13', label: '13', section: '5 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-14', label: '14', section: '5 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-15', label: '15', section: '5 Postas', status: PatientStatus.EMPTY },
  { 
    id: 'bed-16', label: '16', section: '5 Postas', assignedDoctorId: 'd1', status: PatientStatus.WAITING_TESTS, 
    patient: {id: 'p15', name: 'Mantas Navickas', symptoms: 'Dusulys', triageCategory: TriageCategory.URGENT, arrivalTime: '12:50'}, 
    comment: 'Astmos paūmėjimas' 
  },
  { id: 'bed-17', label: '17', section: '5 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-121a', label: '121A', section: '5 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-121b', label: '121B', section: '5 Postas', status: PatientStatus.EMPTY },
  { id: 'bed-izo', label: 'IZO', section: '5 Postas', status: PatientStatus.EMPTY },
  // Rezervinės 5 Postas
  { id: 'bed-r5', label: 'R5', section: '5 Postas', status: PatientStatus.EMPTY },

  // Section 6: Ambulatorija (was Ambulatorinis (2 slaug.))
  { id: 'bed-a1', label: 'A1', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a2', label: 'A2', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a3', label: 'A3', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a4', label: 'A4', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a5', label: 'A5', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a6', label: 'A6', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a7', label: 'A7', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a8', label: 'A8', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a9', label: 'A9', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a10', label: 'A10', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a11', label: 'A11', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a12', label: 'A12', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a13', label: 'A13', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a14', label: 'A14', section: 'Ambulatorija', status: PatientStatus.EMPTY },
  { id: 'bed-a15', label: 'A15', section: 'Ambulatorija', status: PatientStatus.EMPTY },

  // Section 7: Traumos (NEW)
  { id: 'bed-t1', label: 'T1', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t2', label: 'T2', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t3', label: 'T3', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t4', label: 'T4', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t5', label: 'T5', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t6', label: 'T6', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t7', label: 'T7', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t8', label: 'T8', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t9', label: 'T9', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t10', label: 'T10', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t11', label: 'T11', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t12', label: 'T12', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t13', label: 'T13', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t14', label: 'T14', section: 'Traumos', status: PatientStatus.EMPTY },
  { id: 'bed-t15', label: 'T15', section: 'Traumos', status: PatientStatus.EMPTY },
];

export const STATUS_COLORS: Record<PatientStatus, string> = {
  [PatientStatus.EMPTY]: 'bg-slate-900/50 text-slate-700 border-slate-800',
  [PatientStatus.CLEANING]: 'bg-slate-800/80 text-slate-400 border-slate-600 border-dashed', // NEW: Housekeeping visual style
  [PatientStatus.WAITING_EXAM]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  [PatientStatus.ADMITTING]: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-900/20',
  [PatientStatus.DISCHARGE]: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20',
  [PatientStatus.IV_DRIP]: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  [PatientStatus.WAITING_TESTS]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  [PatientStatus.OBSERVATION]: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export const TRIAGE_COLORS: Record<number, string> = {
  0: 'bg-slate-800 text-slate-500 border border-slate-700', // Unassigned
  1: 'bg-blue-600 text-white',      // 1 - Mėlyna
  2: 'bg-red-600 text-white',       // 2 - Raudona
  3: 'bg-yellow-500 text-slate-900',// 3 - Geltona
  4: 'bg-green-600 text-white',     // 4 - Žalia
  5: 'bg-white text-slate-900',     // 5 - Balta
};
