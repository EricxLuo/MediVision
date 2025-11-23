

import React, { useState, useRef, useEffect } from 'react';
import { HexagonCursor } from './HexagonCursor';
import { Button } from './Button';

interface Props {
  onLogin: (username: string) => void;
  logoUrl?: string | null;
}

export const LandingPage: React.FC<Props> = ({ onLogin, logoUrl }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  // 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 40; // Divider controls sensitivity
      const y = (e.clientY - innerHeight / 2) / 40;
      
      // Invert Y for natural feel (looking up tilts up)
      setRotation({ x: -y, y: x });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return; 
    
    setIsLoading(true);
    setError(false);

    // Simulate secure authentication delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Hardcoded credentials for demo
      if (username.toLowerCase() === 'admin' && password === 'password') {
        onLogin(username);
      } else {
        setError(true);
        setPassword(''); // Clear password on error
        // Trigger a small vibration on mobile devices if supported
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }, 1200);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FBFBFD] perspective-[2000px]">
      <HexagonCursor />
      
      <div 
        ref={cardRef}
        className="relative z-10 w-full max-w-[420px] px-6 animate-fade-in transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="glass-panel rounded-[32px] p-10 shadow-2xl shadow-blue-900/5 backdrop-blur-3xl border border-white/50">
          <div className="flex flex-col items-center mb-10 transform translate-z-10">
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
            <div className={`space-y-4 transition-all duration-300 ${error ? 'translate-x-[-5px] translate-x-[5px] animate-pulse' : ''}`}>
              <div className="group">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Username
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(false); }}
                  className={`w-full bg-[#F5F5F7] border rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition-all duration-300 font-medium ${error ? 'border-red-300 focus:ring-red-100' : 'border-transparent focus:ring-[#0071e3]/30'}`}
                  placeholder="Enter Username (admin)"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  className={`w-full bg-[#F5F5F7] border rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition-all duration-300 font-medium ${error ? 'border-red-300 focus:ring-red-100' : 'border-transparent focus:ring-[#0071e3]/30'}`}
                  placeholder="•••••••• (password)"
                  required
                />
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-xs text-center font-medium animate-fade-in">
                Invalid credentials. Please try again.
              </p>
            )}

            <div className="pt-2">
              <Button 
                type="submit" 
                className={`w-full h-12 text-[15px] font-medium tracking-wide shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 transform active:scale-[0.98] ${error ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : ''}`}
                isLoading={isLoading}
              >
                {error ? 'Try Again' : 'Sign In'}
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
