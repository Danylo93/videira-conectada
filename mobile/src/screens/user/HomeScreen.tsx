import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, SafeAreaView, StyleSheet, Text, Alert } from 'react-native';
import CustomPieChartLeader from '../../components/common/PieChartLeader';
import AuthContext from '../../context/UserContext';
import DataContext from '../../context/DataContext';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import theme from '../../styles/theme';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications } from '../../context/NotificationsContext';
import NotificationsModal from '../../components/common/NotificationsModal';
import Header from '../../components/layout/Header';

const getFormattedMonth = (monthKey?: string) => {
  if (!monthKey) return 'Indisponivel';
  try {
    return format(parse(monthKey, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: ptBR });
  } catch {
    return 'Indisponivel';
  }
};

const HomeScreen = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { data, fetchData } = useContext(DataContext);
  const [refreshing, setRefreshing] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = React.useState(false);
  const { addNotification } = useNotifications();

  const [chartData, setChartData] = useState([
    { name: 'Membros', value: 0, color: '#ff6384' },
    { name: 'Frequentadores', value: 0, color: '#36a2eb' },
    { name: 'Visitantes', value: 0, color: '#045309' },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    const updatedChartData = [
      { name: 'Membros', value: data?.dataGraph?.averageMembers || 0, color: '#0000FF' },
      { name: 'Frequentadores', value: data?.dataGraph?.averageAttendees || 0, color: '#B22222' },
      { name: 'Visitantes', value: data?.dataGraph?.averageVisitors || 0, color: '#A020F0' },
    ];
    setChartData(updatedChartData);
  }, [data]);

  const confirmLogout = () => {
    Alert.alert('Deslogar', 'Voce tem certeza que deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: () => logoutUser() },
    ]);
  };

  const handleNotifications = () => {
    setNotificationsVisible(true);
  };

  const simulateNotification = () => {
    addNotification({
      id: Math.random().toString(),
      title: 'Notificacao Simulada',
      message: 'Essa e uma notificacao de exemplo adicionada manualmente.',
      read: false,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.PURPLE_CARD }}>
      <Header
        userName={user?.name}
        userPhoto="https://i.pravatar.cc/300"
        onPress={confirmLogout}
        onPressNotifications={handleNotifications}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.cellInfoContainer}>
          <Text style={styles.cellName}>Relatorio de: {getFormattedMonth(data?.dataGraph?.month)}</Text>
        </View>

        <CustomPieChartLeader data={chartData} />
      </ScrollView>
      <NotificationsModal visible={isNotificationsVisible} onClose={() => setNotificationsVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: getStatusBarHeight(),
    backgroundColor: theme.COLORS.BACKGROUND,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cellInfoContainer: {
    marginVertical: 20,
    backgroundColor: theme.COLORS.PURPLE_CARD,
    padding: 16,
    borderRadius: 8,
  },
  cellName: {
    fontSize: 20,
    color: theme.COLORS.WHITE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;
