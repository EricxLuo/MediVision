import React, { useState } from 'react';
import { PatientProfile, WorkflowStatus, DailyScheduleItem } from '../types';
import { saveProfile } from '../services/mockDatabase';
import { CheckCircleIcon, AlertCircleIcon, PillIcon } from './Icons';

interface Props {
  profile: PatientProfile;
  onUpdate: (profile: PatientProfile) => void;
}

export const PharmacistDashboard: React.FC<Props> = ({ profile, onUpdate }) => {
  const [editingSchedule, setEditingSchedule] = useState<DailyScheduleItem[] | null>(null);

  if (profile.status === WorkflowStatus.DRAFT) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <PillIcon className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Pending Reviews</h3>
        <p className="text-slate-500">Waiting for patient to submit their medication list.</p>
      </div>
    );
  }

  const handleApprove = () => {
    const updated = {
      ...profile,
      status: WorkflowStatus.APPROVED,
      // If we were editing, save the edits. Otherwise keep original.
      schedule: editingSchedule || profile.schedule 
    };
    saveProfile(updated);
    onUpdate(updated);
  };

  const handleRequestChanges = () => {
    const updated = {
      ...profile,
      status: WorkflowStatus.NEEDS_CHANGES
    };
    saveProfile(updated);
    onUpdate(updated);
  };

  const scheduleToRender = editingSchedule || profile.schedule;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Sidebar: Patient Info & Actions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{profile.name}</h2>
              <p className="text-sm text-slate-500">ID: {profile.id}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Status</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                profile.status === WorkflowStatus.APPROVED ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {profile.status}
              </span>
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-semibold text-sm mb-3 text-slate-900">Clinical Actions</h4>
              <div className="space-y-2">
                <button 
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Approve Schedule
                </button>
                <button 
                  onClick={handleRequestChanges}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <AlertCircleIcon className="w-4 h-4" />
                  Request Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Source Meds List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-h-[500px] overflow-y-auto">
          <h3 className="font-bold text-slate-900 mb-4">Source Medications</h3>
          <div className="space-y-4">
             {profile.medications.map(med => (
               <div key={med.id} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                 <p className="font-semibold text-slate-900">{med.name}</p>
                 <p className="text-slate-500">{med.dosage} - {med.frequency}</p>
                 <p className="text-xs text-slate-400 mt-1">{med.source}</p>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content: Schedule Review */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900">Review Daily Schedule</h3>
            <span className="text-xs text-slate-500">Generated by Gemini AI</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {scheduleToRender.map((slot, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {slot.timeOfDay}
                  </h4>
                  {slot.notes && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Interaction Note: {slot.notes}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                  {slot.medications.map(med => (
                    <div key={med.id} className="flex justify-between items-center">
                      <span className="text-slate-700 font-medium">{med.name} <span className="text-slate-400 font-normal text-sm">({med.dosage})</span></span>
                      {/* In a real app, allow drag-and-drop or remove here */}
                    </div>
                  ))}
                  {slot.medications.length === 0 && (
                     <p className="text-slate-400 text-sm italic">No medications scheduled</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-sm text-slate-500">
             Pharmacists can verify extracted data against uploaded images (Mock functionality).
          </div>
        </div>
      </div>
    </div>
  );
};
