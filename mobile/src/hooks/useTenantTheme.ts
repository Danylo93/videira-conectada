import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTenantTheme } from '../services/themeService';

export function useTenantTheme(slug: string) {
  const [backgroundColor, setBackgroundColor] = useState("#5B259F");

  useEffect(() => {
    async function loadTheme() {
      try {
        const cached = await AsyncStorage.getItem(`@theme:${slug}`);
        if (cached) setBackgroundColor(cached);

        const color = await fetchTenantTheme(slug);
        setBackgroundColor(color);
        await AsyncStorage.setItem(`@theme:${slug}`, color);
      } catch (err) {
        console.warn('Erro ao carregar tema', err);
      }
    }

    loadTheme();
  }, [slug]);

  return { backgroundColor };
}
