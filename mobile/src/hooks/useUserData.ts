// 📁 src/hooks/useUserData.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const useUserData = (userId: string | undefined) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/api/users/${userId}/details`);
      setUserData(response.data);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      const cachedUserData = await AsyncStorage.getItem('userData');
      if (cachedUserData) {
        setUserData(JSON.parse(cachedUserData));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  return { userData, loading, fetchUserData };
};
