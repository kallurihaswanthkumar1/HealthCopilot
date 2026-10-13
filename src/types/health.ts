export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

export interface FamilyProfile {
  id: string;
  userId: string;
  name: string;
  relationship: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  abhaId?: string;
  abhaLinked: boolean;
  allergies: string[];
  chronicConditions: string[];
  heightCm?: number;
  weightKg?: number;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  primaryDoctorPhone?: string;
  hospitalPreference?: string;
}

export type DocumentType = 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Diagnostic Report' | 'Other';

export interface LabValue {
  id: string;
  testName: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'High' | 'Low' | 'Abnormal';
  category?: 'Blood Sugar' | 'Blood Pressure' | 'Lipid Panel' | 'Kidney Function' | 'Liver Function' | 'CBC' | 'Vitamins' | 'Other';
  explanationSimple?: string;
  adviceSimple?: string;
  date?: string;
  documentId?: string;
  documentTitle?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: 'Morning' | 'Noon' | 'Night' | 'Morning & Night' | 'Thrice Daily' | 'As Needed';
  instructions?: string;
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  purpose?: string;
  active: boolean;
}

export interface MedicalDocument {
  id: string;
  userId: string;
  profileId: string;
  title: string;
  type: DocumentType;
  date: string;
  doctorName?: string;
  clinicHospital?: string;
  fileUrl?: string;
  fileName: string;
  fileType: string;
  isHandwritten?: boolean;
  rawTextPreview?: string;
  summaryEnglish: string;
  summaryHindi?: string;
  abnormalHighlights: string[];
  diagnoses: string[];
  medications: Medication[];
  labValues: LabValue[];
  fhirData?: any;
  createdAt: string;
}

export interface MedicineReminder {
  id: string;
  profileId: string;
  medicationName: string;
  dosage: string;
  times: string[]; // e.g. ["08:00", "20:00"]
  instructions: string;
  takenToday: boolean[];
  active: boolean;
}

export interface DrugInteractionWarning {
  drugA: string;
  drugB: string;
  severity: 'Severe' | 'Moderate' | 'Minor';
  description: string;
  recommendation: string;
}

export interface DoctorPrepQuestion {
  category: string;
  question: string;
  context: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hindiContent?: string;
  timestamp: string;
  audioAvailable?: boolean;
  sources?: string[];
}

export interface RedFlagAlert {
  id: string;
  metric: string;
  category: 'sugar' | 'bp' | 'cholesterol' | 'weight' | 'other';
  title: string;
  severity: 'critical' | 'warning';
  currentValue: string;
  previousValue?: string;
  deltaText?: string;
  date: string;
  documentTitle?: string;
  clinicalSignificance: string;
  actionAdvice: string;
}

