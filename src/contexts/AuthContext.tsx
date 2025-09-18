import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthState, AuthTransition } from '@/types/auth';

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

  const handleSession = useCallback(async (currentSession: Session | null) => {
    try {
      if (currentSession?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setUser(null);
        } else if (profile) {
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            phone: profile.phone,
            discipuladorId: profile.discipulador_uuid,
            pastorId: profile.pastor_uuid,
            celula: profile.celula,
            createdAt: new Date(profile.created_at),
          };
          setUser(userData);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error in handleSession:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setAuthTransition(prev => {
        if (currentSession?.user) {
          return prev === 'login' ? 'initial' : prev;
        }
        return prev === 'logout' ? 'logout' : 'initial';
      });
    }
  }, []);

  useEffect(() => {
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
  }, [handleSession]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setAuthTransition('login');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        setAuthTransition('initial');
        throw new Error(error.message);
      }
      
      // The onAuthStateChange callback will handle setting the user
    } catch (error) {
      setLoading(false);
      setAuthTransition('initial');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthTransition('logout');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLoading(false);
        setAuthTransition('initial');
        throw new Error(error.message);
      }
      // The onAuthStateChange callback will handle clearing the user
    } catch (error) {
      setLoading(false);
      setAuthTransition('initial');
      throw error;
    }
  }, []);

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