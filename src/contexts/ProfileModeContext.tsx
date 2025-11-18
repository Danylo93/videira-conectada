import React, { createContext, useContext, useState, useEffect } from 'react';

export type ProfileMode = 'normal' | 'kids';

interface ProfileModeState {
  mode: ProfileMode;
  setMode: (mode: ProfileMode) => void;
  toggleMode: () => void;
}

const ProfileModeContext = createContext<ProfileModeState | undefined>(undefined);

export function ProfileModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ProfileMode>(() => {
    // Carregar do localStorage se existir
    const saved = localStorage.getItem('profileMode');
    return (saved === 'kids' ? 'kids' : 'normal') as ProfileMode;
  });

  useEffect(() => {
    // Salvar no localStorage quando mudar
    localStorage.setItem('profileMode', mode);
    
    // Aplicar classe no body para tema Kids
    if (mode === 'kids') {
      document.documentElement.classList.add('kids-mode');
    } else {
      document.documentElement.classList.remove('kids-mode');
    }
  }, [mode]);

  const setMode = (newMode: ProfileMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'normal' ? 'kids' : 'normal');
  };

  const value: ProfileModeState = {
    mode,
    setMode,
    toggleMode,
  };

  return (
    <ProfileModeContext.Provider value={value}>
      {children}
    </ProfileModeContext.Provider>
  );
}

export function useProfileMode() {
  const context = useContext(ProfileModeContext);
  if (context === undefined) {
    throw new Error('useProfileMode must be used within a ProfileModeProvider');
  }
  return context;
}

