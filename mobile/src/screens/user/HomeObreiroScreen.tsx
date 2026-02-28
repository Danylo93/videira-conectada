import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert, SafeAreaView, Text, ActivityIndicator } from 'react-native';
import CustomPieChartObreiro from '../../components/common/PieChartObreiro';
import AuthContext from '../../context/UserContext';
import DataContext from '../../context/DataContext';
import theme from '../../styles/theme';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '../../components/layout/Header';
import { listDisciplerByObreiro } from '../../services/listUserServices';

interface Discipler {
  id: number;
  name: string;
}

const getFormattedMonth = (monthKey?: string) => {
  if (!monthKey) return 'Indisponivel';
  try {
    return format(parse(monthKey, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: ptBR });
  } catch {
    return 'Indisponivel';
  }
};

const HomeObreiroScreen = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { data, fetchData } = useContext(DataContext);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([
    { name: 'Membros', value: 0, color: '#ff6384' },
    { name: 'Frequentadores', value: 0, color: '#36a2eb' },
    { name: 'Visitantes', value: 0, color: '#045309' },
  ]);

  const [disciplers, setDisciplers] = useState<Discipler[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const fetchDisciplers = async () => {
    try {
      const result = await listDisciplerByObreiro(user?.id);
      const formattedDisciplers = (result || []).map((item: any, index: number) => ({
        id: index,
        name: item?.name || String(item),
      }));
      setDisciplers(formattedDisciplers);
    } catch (error) {
      console.error('Erro ao buscar discipuladores:', error);
      setDisciplers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplers();
  }, []);

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
        <CustomPieChartObreiro data={chartData} />

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Discipuladores da Rede:</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#228BE6" />
          ) : (
            <View style={styles.infoContainer}>
              {disciplers.length > 0 ? (
                disciplers.map((discipler) => (
                  <Text key={discipler.id} style={styles.leaderCard}>
                    {discipler.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.noDataText}>Nenhum discipulador encontrado</Text>
              )}
            </View>
          )}
        </View>
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    alignSelf: 'center',
  },
  infoContainer: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderCard: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 8,
    borderRadius: 10,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: 140,
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeObreiroScreen;
