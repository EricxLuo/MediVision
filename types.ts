export enum SourceType {
  HOSPITAL = 'HOSPITAL', // From discharge summary
  HOME = 'HOME'          // From home pill bottles
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  source: SourceType;
}

export interface DailySchedule {
  morning: string[]; // List of medication IDs or Names
  noon: string[];
  evening: string[];
  bedtime: string[];
}

export interface AnalysisResult {
  medications: Medication[];
  schedule: DailySchedule;
  warnings: string[]; // Potential drug interactions
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW_PENDING = 'REVIEW_PENDING',
  APPROVED = 'APPROVED'
}