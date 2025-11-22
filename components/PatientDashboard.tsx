import React, { useState, useRef } from 'react';
import { PatientProfile, Medication, WorkflowStatus } from '../types';
import { extractMedicationsFromImage, generateDailySchedule } from '../services/geminiService';
import { saveProfile } from '../services/mockDatabase';
import { CameraIcon, UploadIcon, PillIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon, SunIcon, MoonIcon } from './Icons';

interface Props {
  profile: PatientProfile;
  onUpdate: (profile: PatientProfile) => void;
  onLogout: () => void;
}

export const PatientDashboard: React.FC<Props> = ({ profile, onUpdate, onLogout }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<'HOSPITAL_DISCHARGE' | 'HOME_MEDICATION'>('HOSPITAL_DISCHARGE');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep('Analyzing medication label...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          const newMeds = await extractMedicationsFromImage(base64String, activeUploadType);
          setProcessingStep(`Found ${newMeds.length} medications...`);
          
          const updatedMeds = [...profile.medications, ...newMeds];
          const updatedProfile = {
            ...profile,
            medications: updatedMeds,
            status: WorkflowStatus.DRAFT
          };
          
          saveProfile(updatedProfile);
          onUpdate(updatedProfile);

        } catch (err) {
          alert('Failed to analyze image. Please try again.');
          console.error(err);
        } finally {
          setIsProcessing(false);
          setProcessingStep('');
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (profile.medications.length === 0) return;
    
    setIsProcessing(true);
    setProcessingStep('Creating your daily schedule...');
    
    try {
      const schedule = await generateDailySchedule(profile.medications);
      const updatedProfile: PatientProfile = {
        ...profile,
        schedule: schedule,
        status: WorkflowStatus.PENDING_REVIEW
      };
      saveProfile(updatedProfile);
      onUpdate(updatedProfile);
    } catch (e) {
      console.error(e);
      alert('Error generating schedule');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const triggerUpload = (type: 'HOSPITAL_DISCHARGE' | 'HOME_MEDICATION') => {
    setActiveUploadType(type);
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Transition Care Hub
          </h1>
          <div className="flex items-center gap-4">
             <span className="text-sm text-slate-500">{profile.name}</span>
             <button onClick={onLogout} className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">
               Sign Out
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-12 space-y-10 animate-fade-in">
        
        {/* Welcome & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Medication Manager</h2>
            <p className="text-lg text-slate-500 font-light">
              Upload your prescriptions to generate a consolidated plan.
            </p>
          </div>
          
          <div className={`px-5 py-2.5 rounded-full border text-sm font-medium flex items-center gap-2 shadow-sm ${
            profile.status === WorkflowStatus.APPROVED ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            profile.status === WorkflowStatus.PENDING_REVIEW ? 'bg-amber-50 border-amber-100 text-amber-700' :
            'bg-white border-slate-200 text-slate-600'
          }`}>
            {profile.status === WorkflowStatus.APPROVED ? <CheckCircleIcon className="w-4 h-4" /> : 
             profile.status === WorkflowStatus.PENDING_REVIEW ? <RefreshCwIcon className="w-4 h-4 animate-spin-slow" /> :
             <div className="w-2 h-2 rounded-full bg-slate-400"></div>}
            <span>
              {profile.status === WorkflowStatus.DRAFT && "Draft Mode"}
              {profile.status === WorkflowStatus.PENDING_REVIEW && "Pending Pharmacist Review"}
              {profile.status === WorkflowStatus.APPROVED && "Schedule Approved"}
              {profile.status === WorkflowStatus.NEEDS_CHANGES && "Action Required"}
            </span>
          </div>
        </div>

        {/* Action Cards */}
        {(profile.status === WorkflowStatus.DRAFT || profile.status === WorkflowStatus.NEEDS_CHANGES) && (
          <div className="grid md:grid-cols-2 gap-6">
            <button 
              onClick={() => triggerUpload('HOSPITAL_DISCHARGE')}
              disabled={isProcessing}
              className="group relative h-48 rounded-3xl bg-white border border-slate-200 p-8 text-left hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <UploadIcon className="w-24 h-24 text-blue-600" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <UploadIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900">Scan Discharge Papers</h4>
                  <p className="text-slate-500 mt-1 font-light">Upload photos from the hospital.</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => triggerUpload('HOME_MEDICATION')}
              disabled={isProcessing}
              className="group relative h-48 rounded-3xl bg-white border border-slate-200 p-8 text-left hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <CameraIcon className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                   <CameraIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900">Scan Home Meds</h4>
                  <p className="text-slate-500 mt-1 font-light">Capture bottles you have at home.</p>
                </div>
              </div>
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <div className="inline-block relative w-16 h-16 mb-4">
               <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg text-slate-700 font-medium">{processingStep}</p>
            <p className="text-sm text-slate-400 mt-2">Powered by Gemini AI</p>
          </div>
        )}

        {/* Medication List */}
        {!isProcessing && profile.medications.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Medications</h3>
                <p className="text-slate-500 font-light mt-1">Identified from your uploads</p>
              </div>
              
              {(profile.status === WorkflowStatus.DRAFT || profile.status === WorkflowStatus.NEEDS_CHANGES) && (
                <button 
                  onClick={handleGenerateSchedule}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  Generate Schedule
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-50">
              {profile.medications.map((med) => (
                <div key={med.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${med.source === 'HOSPITAL_DISCHARGE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <PillIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-slate-900 truncate">{med.name}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${med.source === 'HOSPITAL_DISCHARGE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {med.source === 'HOSPITAL_DISCHARGE' ? 'Discharge' : 'Home'}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">{med.dosage} • {med.frequency}</p>
                  </div>
                  <div className="text-sm text-slate-400 font-light italic hidden sm:block">
                    "{med.instructions}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Schedule View */}
        {!isProcessing && profile.schedule.length > 0 && (
           <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden mb-12">
             <div className="p-8 border-b border-slate-100">
               <h3 className="text-xl font-bold text-slate-900">Your Daily Routine</h3>
               {profile.status !== WorkflowStatus.APPROVED && (
                 <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                   <AlertCircleIcon className="w-4 h-4" />
                   Pending pharmacist verification. Do not rely on this schedule yet.
                 </p>
               )}
             </div>
             
             <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
               {profile.schedule.map((slot, idx) => (
                 <div key={idx} className="p-8 group hover:bg-slate-50/50 transition-colors">
                   <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg ${
                        slot.timeOfDay === 'Morning' ? 'bg-orange-100 text-orange-600' :
                        slot.timeOfDay === 'Afternoon' ? 'bg-yellow-100 text-yellow-600' :
                        slot.timeOfDay === 'Evening' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {slot.timeOfDay === 'Morning' || slot.timeOfDay === 'Afternoon' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                      </div>
                      <span className="font-semibold text-slate-900">{slot.timeOfDay}</span>
                   </div>
                   
                   <ul className="space-y-4">
                     {slot.medications.map(m => (
                       <li key={m.id} className="relative pl-4 border-l-2 border-slate-200">
                         <span className="font-medium text-slate-900 block text-lg">{m.name}</span>
                         <span className="text-slate-500 text-sm">{m.dosage}</span>
                       </li>
                     ))}
                     {slot.medications.length === 0 && (
                       <li className="text-sm text-slate-400 font-light italic">Nothing scheduled</li>
                     )}
                   </ul>

                   {slot.notes && (
                     <div className="mt-6 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-100 leading-relaxed">
                       Note: {slot.notes}
                     </div>
                   )}
                 </div>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};