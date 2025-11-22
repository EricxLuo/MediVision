import React from 'react';
import { DailySchedule, Medication } from '../types';
import { Card } from './Card';

interface Props {
  schedule: DailySchedule;
  medications: Medication[];
}

const TimeSection: React.FC<{ 
  title: string; 
  time: string;
  icon: string; 
  medIds: string[]; 
  allMeds: Medication[] 
}> = ({ title, time, icon, medIds, allMeds }) => {
  
  if (medIds.length === 0) return null;

  return (
    <div className="relative pl-8 pb-10 last:pb-0 group">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-gray-100 group-last:hidden"></div>
      
      {/* Icon Bubble */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center z-10 text-base">
        {icon}
      </div>

      <div className="flex items-baseline gap-3 mb-4 pt-1.5">
        <h4 className="text-[15px] font-semibold text-gray-900">{title}</h4>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{time}</span>
      </div>
      
      <div className="grid gap-3">
        {medIds.map(id => {
          const med = allMeds.find(m => m.id === id) || allMeds.find(m => m.name === id);
          return (
            <div key={id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-100/50">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0071e3] flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 leading-tight text-[15px]">{med ? med.name : id}</p>
                {med && <p className="text-xs text-gray-500 mt-1 font-medium">{med.dosage}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ScheduleTimeline: React.FC<Props> = ({ schedule, medications }) => {
  return (
    <Card title="Generated Daily Schedule" className="bg-gray-50/50">
      <div className="mt-4">
        <TimeSection title="Morning" time="8:00 AM" icon="☀️" medIds={schedule.morning} allMeds={medications} />
        <TimeSection title="Noon" time="12:00 PM" icon="🌤️" medIds={schedule.noon} allMeds={medications} />
        <TimeSection title="Evening" time="6:00 PM" icon="🌙" medIds={schedule.evening} allMeds={medications} />
        <TimeSection title="Bedtime" time="9:00 PM" icon="🛌" medIds={schedule.bedtime} allMeds={medications} />
      </div>
    </Card>
  );
};