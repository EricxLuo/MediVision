import React, { useState, useEffect } from 'react';
import { UserRole, PatientProfile } from './types';
import { getProfile, resetProfile } from './services/mockDatabase';
import { PatientDashboard } from './components/PatientDashboard';
import { LandingPage } from './components/LandingPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<PatientProfile>(getProfile());

  const handleProfileUpdate = (updated: PatientProfile) => {
    setProfile(updated);
  };

  const handleLogin = () => {
    // In a real app, validation logic here
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <PatientDashboard 
      profile={profile} 
      onUpdate={handleProfileUpdate} 
      onLogout={handleLogout}
    />
  );
}

export default App;