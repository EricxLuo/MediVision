import React from 'react';
import { CursorTrail } from './CursorTrail';
import { UserIcon } from './Icons';

interface Props {
  onLogin: () => void;
}

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50">
      <CursorTrail />
      
      <div className="relative z-10 p-8 max-w-md w-full flex flex-col items-center text-center animate-fade-in">
        <div className="mb-8 p-4 bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
          Transition Care Hub
        </h1>
        <p className="text-lg text-slate-500 mb-10 font-light">
          Seamlessly bridging your journey from hospital to home.
        </p>

        <button 
          onClick={onLogin}
          className="group relative w-full bg-slate-900 text-white h-12 rounded-full font-medium text-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-slate-200 flex items-center justify-center gap-2 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Access Patient Portal <span className="text-slate-400">→</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </button>
        
        <div className="mt-8 text-xs text-slate-400">
          Powered by Gemini AI & Google Vision
        </div>
      </div>
    </div>
  );
};