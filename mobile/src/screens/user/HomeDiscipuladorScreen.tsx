import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert, SafeAreaView, Text, ActivityIndicator } from 'react-native';
import CustomPieChartDisc from '../../components/common/PieChartDisc';
import AuthContext from '../../context/UserContext';
import theme from '../../styles/theme';
import DataContext from '../../context/DataContext';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NotificationsModal from '../../components/common/NotificationsModal';
import Header from '../../components/layout/Header';
import { listLeaderByDiscipler } from '../../services/listUserServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Leader {
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

const HomeDiscipuladorScreen = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { data, fetchData } = useContext(DataContext);
  const [refreshing, setRefreshing] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const fetchLeaders = async () => {
    try {
      const result = await listLeaderByDiscipler(user?.id);
      const formattedLeaders = (result || []).map((item: any, index: number) => ({
        id: index,
        name: item?.name || String(item),
      }));
      setLeaders(formattedLeaders);
    } catch (error) {
      console.error('Erro ao buscar lideres:', error);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
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
      {
        text: 'Sair',
        onPress: () => {
          Toast.show({
            type: 'info',
            text1: 'Logout',
            text2: 'Voce foi deslogado com sucesso.',
            position: 'top',
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 50,
          });
          logoutUser();
        },
      },
    ]);
  };

  const handleNotifications = () => {
    setNotificationsVisible(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/api/users/${user?.id}/details`);
        setUserData(response.data);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      } catch (error) {
        const cachedUserData = await AsyncStorage.getItem('userData');
        if (cachedUserData) {
          setUserData(JSON.parse(cachedUserData));
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.PURPLE_CARD }}>
      <Header
        userName={user?.name}
        userPhoto={userData?.photo || 'https://i.pravatar.cc/300'}
        onPress={confirmLogout}
        onPressNotifications={handleNotifications}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.cellInfoContainer}>
          <Text style={styles.cellName}>Relatorio de {getFormattedMonth(data?.dataGraph?.month)}</Text>
        </View>
        {chartData.length > 0 && chartData.some((item) => item.value > 0) ? (
          <CustomPieChartDisc data={chartData} />
        ) : (
          <View style={styles.emptyChartContainer}>
            <Icon name="pie-chart" size={120} color="#ccc" />
            <Text style={styles.emptyChartText}>Ainda nao tenho dados graficos para exibir</Text>
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Lideres da Rede:</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#228BE6" />
          ) : (
            <View style={styles.infoContainer}>
              {leaders.map((leader) => (
                <Text key={leader.id} style={styles.leaderCard}>
                  {leader.name}
                </Text>
              ))}
            </View>
          )}
        </View>
        <NotificationsModal visible={isNotificationsVisible} onClose={() => setNotificationsVisible(false)} />
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
  emptyChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyChartText: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 10,
  },
});

export default HomeDiscipuladorScreen;
