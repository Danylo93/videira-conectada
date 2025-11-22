import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthState, AuthTransition } from '@/types/auth';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import FancyLoader from '@/components/FancyLoader';

type AuthLoaderCopy = {
  message: string;
  tips: string[];
};

const AUTH_LOADER_COPY: Record<AuthTransition, AuthLoaderCopy> = {
  initial: {
    message: 'Aquecendo o coração da Videira',
    tips: [
      'Conferindo se o seu login está no rol dos santos digitais…',
      'Chamando Gabriel pra guardar a senha…',
      'Espremendo uvas fresquinhas pra sessão começar!',
    ],
  },
  login: {
    message: 'Conferindo os pergaminhos do seu acesso',
    tips: [
      'Girando as chaves de Pedro pra abrir a porta certa…',
      'Procurando o selo real com o seu nome carimbado…',
      'Mandando um aleluia pro servidor antes de liberar a entrada…',
    ],
  },
  logout: {
    message: 'Recolhendo as cadeiras da célula com carinho',
    tips: [
      'Guardando o cajado do líder até a próxima batalha…',
      'Encerrando o culto digital com bênção apostólica…',
      'Lustrando o cálice pra quando você voltar sedento…',
    ],
  },
};


const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authTransition, setAuthTransition] = useState<AuthTransition>('initial');

  useEffect(() => {
    const handleSession = async (currentSession: Session | null) => {
     

      if (currentSession?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, phone, discipulador_uuid, pastor_uuid, celula, is_tesoureiro, created_at')
          .eq('user_id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setUser(null);
        } else if (profile) {
          console.log('Profile loaded:', profile);
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            phone: profile.phone,
            discipuladorId: profile.discipulador_uuid,
            pastorId: profile.pastor_uuid,
            celula: profile.celula,
            isTesoureiro: profile.is_tesoureiro || false,
            createdAt: new Date(profile.created_at),
          };
          console.log('User data created:', userData);
          setUser(userData);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
      setAuthTransition(prev => {
        if (currentSession?.user) {
          return prev === 'login' ? 'initial' : prev;
        }
        return prev === 'logout' ? 'logout' : 'initial';
      });
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      handleSession(session);
    });

    // Handle any existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthTransition('login');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setAuthTransition('initial');
      throw new Error(error.message);
    }
    
    // O onAuthStateChange callback irá processar a sessão automaticamente
    // Não setar loading como false aqui, deixar o handleSession fazer isso
  };

  const logout = async () => {
    setAuthTransition('logout');
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      setAuthTransition('initial');
      throw new Error(error.message);
    }
    // The onAuthStateChange callback will handle clearing the user
  };

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    authTransition
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}