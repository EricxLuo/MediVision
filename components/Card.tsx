import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, 
  className = '',
  title
}) => {
  return (
    <div className={`glass-panel rounded-[24px] p-8 ${className}`}>
      {title && (
        <h3 className="text-[19px] font-semibold text-[#1D1D1F] mb-6 tracking-tight flex items-center gap-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};