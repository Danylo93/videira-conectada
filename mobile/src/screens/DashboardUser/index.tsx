import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';

import Header from '../../components/layout/Header';
import { useEvents } from '../../hooks/useEvents';
import { useUserData } from '../../hooks/useUserData';
import { useNotifications } from '../../context/NotificationsContext';
import NotificationsModal from '../../components/common/NotificationsModal';
import SlidesEventos from './SlidesEventos';
import VideoCarousel from './VideoCarousel';
import AuthContext from '../../context/UserContext';
import DataContext from '../../context/DataContext';
import styles from './styles';
import theme from '../../styles/theme';
import { useTenantTheme } from '../../hooks/useTenantTheme';

function extractEventDate(evento: any): string {
  return evento?.eventDate || evento?.startDate || evento?.event_date || '';
}

const DashboardUser = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { fetchData } = useContext(DataContext);
  const { eventos, loading, fetchEvents } = useEvents();
  const { userData } = useUserData(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const { backgroundColor } = useTenantTheme(user?.slug || 'default');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([fetchData(), fetchEvents()]);
    } finally {
      setRefreshing(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Deslogar', 'Deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: logoutUser },
    ]);
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();

    return [...(eventos || [])]
      .filter((evento) => {
        const rawDate = extractEventDate(evento);
        const date = new Date(rawDate);
        return rawDate && !Number.isNaN(date.getTime()) && date >= now;
      })
      .sort((a, b) => new Date(extractEventDate(a)).getTime() - new Date(extractEventDate(b)).getTime());
  }, [eventos]);

  const agendaDates = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const evento of upcomingEvents) {
      const rawDate = extractEventDate(evento);
      const parsed = new Date(rawDate);
      if (!rawDate || Number.isNaN(parsed.getTime())) continue;

      const key = parsed.toISOString().split('T')[0];
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(
        parsed.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }),
      );
    }

    return result.slice(0, 7);
  }, [upcomingEvents]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <Header
        userName={user?.name}
        userPhoto={userData?.photo || ''}
        onPress={confirmLogout}
        onPressNotifications={() => setNotificationsVisible(true)}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollViewContent}
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.COLORS.PRIMARY} />
        ) : (
          <SlidesEventos eventos={upcomingEvents} />
        )}

        <View style={styles.agendaContainer}>
          <Text style={styles.agendaTitle}>Agenda</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agendaDatesRow}
          >
            {agendaDates.map((dateLabel) => (
              <View key={dateLabel} style={styles.agendaDateChip}>
                <Text style={styles.agendaDateText}>{dateLabel}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.agendaList}>
            {upcomingEvents.slice(0, 5).map((evento) => (
              <View key={evento.id} style={styles.agendaItem}>
                <Text style={styles.agendaItemTitle}>{evento.name}</Text>
                <Text style={styles.agendaItemMeta}>
                  {new Date(extractEventDate(evento)).toLocaleDateString('pt-BR')}
                  {evento.location ? ` - ${evento.location}` : ''}
                </Text>
              </View>
            ))}

            {upcomingEvents.length === 0 && (
              <Text style={styles.agendaEmpty}>Sem eventos ativos no momento.</Text>
            )}
          </View>
        </View>

        <VideoCarousel />
      </ScrollView>

      <NotificationsModal visible={isNotificationsVisible} onClose={() => setNotificationsVisible(false)} />
    </SafeAreaView>
  );
};

export default DashboardUser;
