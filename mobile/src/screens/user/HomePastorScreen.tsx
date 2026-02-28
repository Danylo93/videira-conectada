import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert, SafeAreaView, Text } from 'react-native';
import AuthContext from '../../context/UserContext';
import theme from '../../styles/theme';
import DataContext from '../../context/DataContext';
import CustomPieChartPastor from '../../components/common/PieChartPastor';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '../../components/layout/Header';

const getFormattedMonth = (monthKey?: string) => {
  if (!monthKey) return 'Indisponivel';
  try {
    return format(parse(monthKey, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: ptBR });
  } catch {
    return 'Indisponivel';
  }
};

const HomePastorScreen = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { data, fetchData } = useContext(DataContext);
  const [refreshing, setRefreshing] = useState(false);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.PURPLE_CARD }}>
      <Header userName={user?.name} userPhoto="https://i.pravatar.cc/300" onPress={confirmLogout} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.cellInfoContainer}>
          <Text style={styles.cellName}>Relatorio de {getFormattedMonth(data?.dataGraph?.month)}</Text>
        </View>
        <CustomPieChartPastor data={chartData} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
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

export default HomePastorScreen;
