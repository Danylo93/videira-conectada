import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Pastor João Silva',
    email: 'pastor@videirasaomiguel.com',
    role: 'pastor',
    phone: '(11) 99999-9999',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Obreiro Maria Santos',
    email: 'obreiro@videirasaomiguel.com',
    role: 'obreiro',
    phone: '(11) 88888-8888',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Discipulador Carlos Lima',
    email: 'discipulador@videirasaomiguel.com',
    role: 'discipulador',
    phone: '(11) 77777-7777',
    pastorId: '1',
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Líder Ana Costa',
    email: 'lider@videirasaomiguel.com',
    role: 'lider',
    phone: '(11) 66666-6666',
    discipuladorId: '3',
    celula: 'Célula Esperança',
    createdAt: new Date(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('videira-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Simple mock authentication
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === '123456') {
      setUser(foundUser);
      localStorage.setItem('videira-user', JSON.stringify(foundUser));
    } else {
      throw new Error('Credenciais inválidas');
    }
    
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('videira-user');
  };

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
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