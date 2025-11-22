

import React, { useState } from 'react';
import { DailySchedule, Medication, TimeSlot, Warning } from '../types';
import { Card } from './Card';

interface Props {
  schedule: DailySchedule;
  medications: Medication[];
  warnings?: Warning[];
  onMove?: (medId: string, from: TimeSlot, to: TimeSlot) => void;
  isEditable?: boolean;
  mode?: 'default' | 'print';
  scheduleName?: string;
}

// --- Professional Print View Component ---
const ProfessionalView: React.FC<Props> = ({ schedule, medications, warnings, scheduleName }) => {
  const slots: TimeSlot[] = ['morning', 'noon', 'evening', 'bedtime'];

  return (
    <div className="w-full bg-white text-gray-900 font-sans p-4">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center rounded-lg">
            <span className="text-3xl font-bold">M</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900">MediVision</h1>
            <h2 className="text-lg text-gray-600 font-medium">Medication Reconciliation Report</h2>
          </div>
        </div>
        <div className="text-right text-sm leading-relaxed">
          <p><span className="font-bold text-gray-900">Date:</span> {new Date().toLocaleDateString()}</p>
          <div className="mt-2 border border-gray-300 p-2 min-w-[200px] text-left">
            <p className="text-xs text-gray-500 uppercase">Schedule Name</p>
            <p className="h-6 font-medium text-lg">{scheduleName}</p>
          </div>
        </div>
      </div>

      {/* Clinical Alerts Section - Only if warnings exist */}
      {warnings && warnings.length > 0 && (
        <div className="mb-8 border border-red-200 bg-red-50 rounded-lg p-4">
          <h3 className="text-red-700 font-bold uppercase tracking-wide text-sm mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Clinical Alerts Detected
          </h3>
          <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w.description}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Schedule Table */}
      <div className="space-y-8">
        {slots.map((slot) => {
          const medIds = schedule[slot];
          
          return (
            <div key={slot} className="break-inside-avoid">
              <div className="flex items-center gap-4 mb-3 border-b border-gray-200 pb-2">
                 <div className="bg-gray-100 rounded px-3 py-1 font-bold text-lg uppercase tracking-wider min-w-[120px] text-center">
                   {slot}
                 </div>
                 <span className="text-gray-400 text-sm font-medium">
                    {slot === 'morning' ? 'Take between 7:00 AM - 9:00 AM' : 
                     slot === 'noon' ? 'Take between 11:00 AM - 1:00 PM' : 
                     slot === 'evening' ? 'Take between 5:00 PM - 7:00 PM' : 'Take before sleeping'}
                 </span>
              </div>
              
              {medIds.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-[35%] font-bold text-gray-700 uppercase py-2 px-4 border-r border-gray-200">Medication</th>
                      <th className="w-[15%] font-bold text-gray-700 uppercase py-2 px-4 border-r border-gray-200">Type</th>
                      <th className="w-[35%] font-bold text-gray-700 uppercase py-2 px-4 border-r border-gray-200">Instructions</th>
                      <th className="w-[15%] font-bold text-gray-700 uppercase py-2 px-4 text-center">Administered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medIds.map((id) => {
                      const med = medications.find(m => m.id === id) || medications.find(m => m.name === id);
                      const name = med ? med.name : id;
                      const dosage = med ? med.dosage : '';
                      const category = med ? (med.category === 'OTC' ? 'OTC' : 'Rx') : '--';
                      const instructions = med ? (med.instructions || med.frequency) : '';

                      return (
                        <tr key={id} className="border-t border-gray-200">
                          <td className="py-3 px-4 border-r border-gray-200 font-semibold text-gray-900">
                            {name} <span className="text-gray-500 font-normal ml-1">{dosage}</span>
                          </td>
                          <td className="py-3 px-4 border-r border-gray-200 text-gray-600 font-medium text-xs">
                             {category}
                          </td>
                          <td className="py-3 px-4 border-r border-gray-200 text-gray-600 italic">
                             {instructions}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="w-6 h-6 border border-gray-300 rounded mx-auto"></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                 <div className="text-gray-400 italic text-sm py-2 px-4 border border-dashed border-gray-200 rounded">No medications scheduled.</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t-2 border-gray-100 flex justify-between items-end">
        <div className="text-xs text-gray-400 max-w-md">
           <p>Disclaimer: This schedule is generated by AI assistant based on provided documents. Always verify with your primary care physician before making changes to your regimen.</p>
        </div>
        <div className="text-center">
           <div className="w-64 border-b border-gray-900 mb-2"></div>
           <p className="text-xs font-bold uppercase tracking-wide">Physician Signature</p>
        </div>
      </div>
    </div>
  );
};

// --- Interactive View Component ---

const DraggableMedication: React.FC<{
  id: string;
  med: Medication | undefined;
  slot: TimeSlot;
  isEditable: boolean;
  onMove?: (id: string, from: TimeSlot, to: TimeSlot) => void;
}> = ({ id, med, slot, isEditable, onMove }) => {
  
  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.dataTransfer.setData('medId', id);
    e.dataTransfer.setData('fromSlot', slot);
    e.dataTransfer.effectAllowed = 'move';
    // Add a ghost image styling if desired, browser default usually fine
  };

  return (
    <div
      draggable={isEditable}
      onDragStart={handleDragStart}
      className={`bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 relative group
        ${isEditable ? 'cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5' : ''}
      `}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${med?.category === 'OTC' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
        {med?.category === 'OTC' ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
           </svg>
        ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
           </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 leading-tight text-[15px] truncate pr-8">{med ? med.name : id}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{med?.dosage}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${med?.category === 'OTC' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {med?.category === 'OTC' ? 'OTC' : 'Rx'}
          </span>
        </div>
      </div>

      {/* Move Dropdown for Accessibility/Ease */}
      {isEditable && onMove && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <select 
             className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-gray-600 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
             value={slot}
             onChange={(e) => onMove(id, slot, e.target.value as TimeSlot)}
             onClick={(e) => e.stopPropagation()} // Prevent drag start
           >
             <option value="morning">Morning</option>
             <option value="noon">Noon</option>
             <option value="evening">Evening</option>
             <option value="bedtime">Night</option>
           </select>
        </div>
      )}
      
      {isEditable && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:opacity-0 transition-opacity">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
           </svg>
        </div>
      )}
    </div>
  );
};

const InteractiveSlot: React.FC<{
  slot: TimeSlot;
  medIds: string[];
  medications: Medication[];
  icon: string;
  isEditable: boolean;
  onMove?: (id: string, from: TimeSlot, to: TimeSlot) => void;
}> = ({ slot, medIds, medications, icon, isEditable, onMove }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditable || !onMove) return;
    e.preventDefault();
    setIsOver(false);
    const medId = e.dataTransfer.getData('medId');
    const fromSlot = e.dataTransfer.getData('fromSlot') as TimeSlot;
    
    if (medId && fromSlot && fromSlot !== slot) {
      onMove(medId, fromSlot, slot);
    }
  };

  return (
    <div 
      className={`relative pl-8 pb-10 last:pb-0 transition-all duration-300 rounded-2xl ${isOver ? 'bg-blue-50 ring-2 ring-blue-200 ring-offset-2 scale-[1.01] -ml-2 pl-10 pr-2 pt-2 z-10 shadow-lg' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Timeline Line */}
      <div className={`absolute left-[15px] top-10 bottom-0 w-[2px] group-last:hidden transition-colors duration-300 ${isOver ? 'bg-blue-300' : 'bg-gray-100'}`}></div>
      
      {/* Icon Bubble */}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border shadow-sm flex items-center justify-center z-10 text-base transition-all duration-300 ${isOver ? 'bg-blue-500 border-blue-600 text-white scale-110 shadow-blue-500/30' : 'bg-white border-gray-200'}`}>
        {icon}
      </div>

      <div className="flex items-baseline gap-3 mb-4 pt-1.5">
        <h4 className={`text-[15px] font-semibold transition-colors ${isOver ? 'text-blue-700' : 'text-gray-900'}`}>
           {slot === 'bedtime' ? 'Night' : slot.charAt(0).toUpperCase() + slot.slice(1)}
        </h4>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {slot === 'morning' ? '8:00 AM' : slot === 'noon' ? '12:00 PM' : slot === 'evening' ? '6:00 PM' : '9:00 PM'}
        </span>
      </div>
      
      <div className="grid gap-3 min-h-[60px]">
        {medIds.length === 0 && isEditable && (
          <div className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center text-xs transition-colors duration-300 ${isOver ? 'border-blue-300 text-blue-500 bg-white' : 'border-gray-100 text-gray-300'}`}>
             {isOver ? 'Drop Medication Here' : `Drag medication to ${slot === 'bedtime' ? 'night' : slot}`}
          </div>
        )}
        {medIds.map(id => {
          const med = medications.find(m => m.id === id) || medications.find(m => m.name === id);
          return (
            <DraggableMedication 
              key={id} 
              id={id} 
              med={med} 
              slot={slot} 
              isEditable={isEditable} 
              onMove={onMove} 
            />
          );
        })}
      </div>
    </div>
  );
};

export const ScheduleTimeline: React.FC<Props> = ({ schedule, medications, warnings, onMove, isEditable = false, mode = 'default', scheduleName }) => {
  if (mode === 'print') {
    return <ProfessionalView schedule={schedule} medications={medications} warnings={warnings} scheduleName={scheduleName} />;
  }

  return (
    <Card title="Daily Schedule" className="bg-gray-50/50 h-full">
       {isEditable && (
         <p className="text-xs text-gray-400 mb-6 -mt-4 pl-1 flex items-center gap-1.5">
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
           </svg>
           Drag cards between slots to reschedule
         </p>
       )}
      <div className="mt-4">
        <InteractiveSlot slot="morning" icon="☀️" medIds={schedule.morning} medications={medications} isEditable={isEditable} onMove={onMove} />
        <InteractiveSlot slot="noon" icon="🌤️" medIds={schedule.noon} medications={medications} isEditable={isEditable} onMove={onMove} />
        <InteractiveSlot slot="evening" icon="🌙" medIds={schedule.evening} medications={medications} isEditable={isEditable} onMove={onMove} />
        <InteractiveSlot slot="bedtime" icon="🛌" medIds={schedule.bedtime} medications={medications} isEditable={isEditable} onMove={onMove} />
      </div>
    </Card>
  );
};