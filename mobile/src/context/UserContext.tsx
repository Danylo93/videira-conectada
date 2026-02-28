import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  login,
  register,
  registerMember as registerMemberService,
  update as updateProfile,
  logout,
  fetchProfile,
  UserData,
} from '../services/authService';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: any;
  loading: boolean;
  loginUser: (email: string, password: string) => Promise<boolean>;
  registerMember: (userData: { email: string; password: string; name: string; phone?: string; cellName?: string }) => Promise<{ autoLoggedIn: boolean; requiresEmailConfirmation: boolean }>;
  createUser: (userData: UserData) => Promise<void>;
  updateUser: (userId: number | string, userData: UserData) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserPhoto: (photoUri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginUser: async () => false,
  registerMember: async () => ({ autoLoggedIn: false, requiresEmailConfirmation: false }),
  createUser: async () => {},
  updateUser: async () => {},
  logoutUser: async () => {},
  updateUserPhoto: async () => {},
});



export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await fetchProfile();
        if (userData && isMounted) {
          setUser(userData);
          return;
        }

        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser && isMounted) setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to fetch user on startup', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        await AsyncStorage.multiRemove(['user', 'token']);
        return;
      }

      const userData = await fetchProfile();
      setUser(userData);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  
  const loginUser = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: loggedUser } = await login(email, password);
      setUser(loggedUser);
      return true;
    } catch (error: any) {
      if (error.response) {
        console.error('API Error:', error.response.data);
      } else if (error.request) {
        console.error('Request Error:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      return false;
    }
  };

  const createUser = async (userData: UserData) => {
    try {
      const created = await register(userData);
      setUser(created);
    } catch (error: any) {
      console.error('User creation failed', error);
      throw new Error(error?.message || error?.response?.data?.message || 'User creation failed');
    }
  };

  const registerMember = async (userData: { email: string; password: string; name: string; phone?: string; cellName?: string }) => {
    const result = await registerMemberService(userData);

    if (result.autoLoggedIn) {
      const profile = await fetchProfile();
      setUser(profile);
    }

    return result;
  };

  const updateUser = async (userId: number | string, userData: UserData) => {
    try {
      const updated = await updateProfile(userId, userData);
      setUser(updated);
    } catch (error) {
      console.error('User update failed:', error);
      throw new Error((error as Error)?.message || 'User update failed');
    }
  };

  const updateUserPhoto = async (photoUri: string) => {
    try {
      const updatedUser = { ...user, photo: photoUri };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update user photo:', error);
    }
  };

  const logoutUser = async () => {
    try {
      setUser(null);
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerMember, createUser, updateUser, logoutUser, updateUserPhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
