import React, { useState } from 'react';
import { HexagonCursor } from './HexagonCursor';
import { Button } from './Button';

interface Props {
  onLogin: () => void;
  logoUrl?: string | null;
}

export const LandingPage: React.FC<Props> = ({ onLogin, logoUrl }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate secure authentication delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FBFBFD]">
      <HexagonCursor />
      
      <div className="relative z-10 w-full max-w-[420px] px-6 animate-fade-in">
        <div className="glass-panel rounded-[32px] p-10 shadow-2xl shadow-blue-900/5">
          <div className="flex flex-col items-center mb-10">
            {logoUrl ? (
              <img src={logoUrl} alt="MediVision Logo" className="w-20 h-20 rounded-2xl shadow-lg shadow-blue-500/20 mb-6 object-cover" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#0071e3] to-[#0077ED] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30 mb-6">
                M
              </div>
            )}
            
            <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
              MediVision
            </h1>
            <p className="text-[#86868b] text-sm mt-2 text-center leading-relaxed">
              Professional Medication Reconciliation System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Professional ID
                </label>
                <input 
                  type="text" 
                  className="w-full bg-[#F5F5F7] border-none rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all duration-300 font-medium"
                  placeholder="Enter ID"
                  defaultValue="MD-8821"
                />
              </div>
              <div className="group">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Access Key
                </label>
                <input 
                  type="password" 
                  className="w-full bg-[#F5F5F7] border-none rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all duration-300 font-medium"
                  placeholder="••••••••"
                  defaultValue="password"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 text-[15px] font-medium tracking-wide shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 transform active:scale-[0.98]"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">
              AUTHORIZED PERSONNEL ONLY • HIPAA COMPLIANT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};