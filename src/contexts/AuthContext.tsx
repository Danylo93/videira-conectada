import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthState, AuthTransition } from '@/types/auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authTransition, setAuthTransition] = useState<AuthTransition>('initial');

  useEffect(() => {
    const handleSession = async (currentSession: Session | null) => {
      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .single();

        if (profile) {
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
    // The onAuthStateChange callback will handle setting the user
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
    authTransition,
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