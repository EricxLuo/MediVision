
import React from 'react';
import { Medication } from '../types';
import { Card } from './Card';

interface Props {
  medications: Medication[];
  onUpdate: (id: string, field: keyof Medication, value: string) => void;
  highlightedIds?: string[];
}

export const MedicationList: React.FC<Props> = ({ medications, onUpdate, highlightedIds = [] }) => {
  return (
    <Card title="Identified Medications" className="h-full">
      <div className="space-y-3">
        {medications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">No medications detected yet.</p>
          </div>
        )}
        {medications.map((med) => {
          const isHighlighted = highlightedIds.includes(med.id);
          const isOTC = med.category === 'OTC';
          
          return (
            <div 
              key={med.id} 
              className={`group relative p-4 rounded-2xl bg-white border transition-all duration-300 
                ${isHighlighted 
                  ? 'border-red-300 shadow-md shadow-red-100 ring-1 ring-red-200' 
                  : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                
                {/* Editable Fields Container */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Name Input */}
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => onUpdate(med.id, 'name', e.target.value)}
                    className="block w-full font-semibold text-gray-900 text-[15px] bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors px-0 py-0.5 placeholder-gray-300"
                    placeholder="Medication Name"
                  />
                  
                  <div className="flex items-center gap-2">
                    {/* Dosage Input */}
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => onUpdate(med.id, 'dosage', e.target.value)}
                      className="w-24 text-xs text-gray-500 font-medium bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors px-0 py-0.5"
                      placeholder="Dosage"
                    />
                    <span className="text-gray-300">•</span>
                    {/* Frequency Input & Reasoning */}
                    <div className="flex items-center gap-1 group/reasoning relative">
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => onUpdate(med.id, 'frequency', e.target.value)}
                        className="flex-1 min-w-[100px] text-xs text-gray-500 font-medium bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors px-0 py-0.5"
                        placeholder="Frequency"
                      />
                      {/* Explainable AI Icon */}
                      {med.reasoning && (
                        <div className="cursor-help text-blue-400 hover:text-blue-600">
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           {/* Tooltip */}
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] rounded-xl shadow-xl opacity-0 group-hover/reasoning:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                              <span className="font-bold text-gray-400 block mb-1 uppercase tracking-wider text-[9px]">AI Reasoning</span>
                              "{med.reasoning}"
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <span className={`flex-shrink-0 text-[9px] uppercase font-bold px-2 py-1 rounded-md tracking-wider border select-none ${
                  isOTC
                    ? 'bg-green-50 text-green-700 border-green-200' // Over the Counter
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200' // Prescription
                }`}>
                  {isOTC ? 'Over the Counter' : 'Prescription'}
                </span>
              </div>
              
              {/* Edit Indicator (Subtle) */}
              <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                 </svg>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
