import { PatientProfile, WorkflowStatus } from "../types";

const DB_KEY = 'transition_care_hub_db';

const defaultProfile: PatientProfile = {
  id: 'patient-001',
  name: 'Alex Doe',
  status: WorkflowStatus.DRAFT,
  medications: [],
  schedule: [],
  lastUpdated: new Date().toISOString()
};

export const getProfile = (): PatientProfile => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    return defaultProfile;
  }
  return JSON.parse(data);
};

export const saveProfile = (profile: PatientProfile): void => {
  localStorage.setItem(DB_KEY, JSON.stringify({
    ...profile,
    lastUpdated: new Date().toISOString()
  }));
};

export const resetProfile = (): void => {
  localStorage.removeItem(DB_KEY);
};
