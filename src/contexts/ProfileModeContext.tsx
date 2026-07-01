import React, { createContext, useContext, useState, useEffect } from 'react';

export type ProfileMode = 'normal' | 'kids' | 'radicais';

// Importados de forma tardia para evitar dependência circular em runtime
// (config/profileModes faz apenas import de tipo deste arquivo).
import { PROFILE_MODE_CONFIG, PROFILE_MODE_ORDER } from '@/config/profileModes';

const PROFILE_MODES = PROFILE_MODE_ORDER;

// Modo exibido para quem ainda não escolheu um (sem preferência salva).
const DEFAULT_PROFILE_MODE: ProfileMode = 'radicais';

interface ProfileModeState {
  mode: ProfileMode;
  setMode: (mode: ProfileMode) => void;
  /** Avança ciclicamente entre normal -> kids -> radicais -> normal. */
  toggleMode: () => void;
}

const ProfileModeContext = createContext<ProfileModeState | undefined>(undefined);

function isValidMode(value: string | null): value is ProfileMode {
  return PROFILE_MODES.includes(value as ProfileMode);
}

function normalizeMode(value: string | null): ProfileMode {
  return isValidMode(value) ? value : DEFAULT_PROFILE_MODE;
}

// Permite forçar o modo via URL (ex.: /?mode=radicais), útil para links diretos.
function readModeFromUrl(): ProfileMode | null {
  if (typeof window === 'undefined') return null;
  const urlMode = new URLSearchParams(window.location.search).get('mode');
  return isValidMode(urlMode) ? urlMode : null;
}

export function ProfileModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ProfileMode>(() => {
    // Prioridade: parâmetro de URL > localStorage > padrão
    return readModeFromUrl() ?? normalizeMode(localStorage.getItem('profileMode'));
  });

  useEffect(() => {
    // Salvar no localStorage quando mudar
    localStorage.setItem('profileMode', mode);

    // Aplicar a classe de tema do modo atual (e remover as dos outros)
    const root = document.documentElement;
    for (const m of PROFILE_MODES) {
      const themeClass = PROFILE_MODE_CONFIG[m].themeClass;
      if (themeClass) root.classList.toggle(themeClass, m === mode);
    }
  }, [mode]);

  const setMode = (newMode: ProfileMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prev) => {
      const currentIndex = PROFILE_MODES.indexOf(prev);
      return PROFILE_MODES[(currentIndex + 1) % PROFILE_MODES.length];
    });
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
