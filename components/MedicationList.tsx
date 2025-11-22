import React from 'react';
import { Medication, SourceType } from '../types';
import { Card } from './Card';

interface Props {
  medications: Medication[];
}

export const MedicationList: React.FC<Props> = ({ medications }) => {
  return (
    <Card title="Identified Medications" className="h-full">
      <div className="space-y-3">
        {medications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">No medications detected yet.</p>
          </div>
        )}
        {medications.map((med) => (
          <div key={med.id} className="group flex items-start justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
            <div className="flex-1 min-w-0 pr-4">
              <div className="font-semibold text-gray-900 truncate text-[15px]">{med.name}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{med.dosage} • {med.frequency}</div>
            </div>
            <span className={`flex-shrink-0 text-[9px] uppercase font-bold px-2 py-1 rounded-md tracking-wider border ${
              med.source === SourceType.HOSPITAL 
                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                : 'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
              {med.source === SourceType.HOSPITAL ? 'New / Hospital' : 'Home Supply'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};