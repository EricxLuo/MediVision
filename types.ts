export enum UserRole {
  PATIENT = 'PATIENT',
  PHARMACIST = 'PHARMACIST'
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  NEEDS_CHANGES = 'NEEDS_CHANGES'
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  source: 'HOSPITAL_DISCHARGE' | 'HOME_MEDICATION';
  originalImage?: string; // Base64
}

export interface DailyScheduleItem {
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime';
  medications: Medication[];
  notes?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  status: WorkflowStatus;
  medications: Medication[];
  schedule: DailyScheduleItem[];
  pharmacistNotes?: string;
  lastUpdated: string;
}

export interface AppState {
  userRole: UserRole;
  currentProfile: PatientProfile;
}
