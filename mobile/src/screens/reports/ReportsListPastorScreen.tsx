import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Modal, TouchableOpacity, RefreshControl, Alert, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../../context/UserContext';
import theme from '../../styles/theme';
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, isBefore, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteCell, getAllCellsForPastor } from '../../services/cellService';

interface Cell {
  leader: any;
  discipler: any;
  obreiro: any;
  id: number;
  cellName: string;
  cellPhase: string;
  meetingDate: string;
  membersPresent: number;
  attendees: number;
  visitors: number;
  address?: string; // Adicione "opcional" se não existir na API
}

// Função para agrupar células por mês
const groupCellsByMonth = (cells: Cell[]) => {
  const grouped: { [key: string]: Cell[] } = {};

  cells.forEach(cell => {
    const date = new Date(cell.meetingDate);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(cell);
  });

  return grouped;
};

const ReportsListPastorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [filteredCells, setFilteredCells] = useState<Cell[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const fetchCells = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const data = await getAllCellsForPastor(user?.id);
          // Verifique o formato da resposta
          if (data && data) {
            setCells(data || []); 
          } else {
            console.error("A resposta da API não contém 'cells'");
            setCells([]);
          }
        } catch (err) {
          console.error("Erro ao buscar células:", err);
          setError('Ainda não há relatórios enviados');
        } finally {
          setLoading(false);
        }
      }
    };
    
    
    

    fetchCells();
  }, [user?.id]);

  useEffect(() => {
    // Verificar se 'cells' está definido
    if (cells && cells.length > 0) {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      const filtered = cells.filter(cell => {
        const cellDate = parseISO(cell.meetingDate);
        return isSameMonth(cellDate, selectedMonth);
      });
      setFilteredCells(filtered);
    } else {
      setFilteredCells([]); // Caso não haja células
    }
  }, [selectedMonth, cells]);

  useEffect(() => {
    const months = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date();
      monthDate.setMonth(index);
      monthDate.setDate(1);
      return monthDate;
    });
  
    const currentMonthIndex = months.findIndex(month => isSameMonth(month, selectedMonth));
    const monthWidth = 100; // Largura média do botão do mês
    const monthMargin = 8; // Margem entre os botões
    const screenWidth = Dimensions.get('window').width; // Largura da tela
  
    const offset = currentMonthIndex >= 0
      ? (currentMonthIndex * (monthWidth + monthMargin)) - (screenWidth / 2) + (monthWidth / 2)
      : 0;
  
    scrollViewRef.current?.scrollTo({ x: offset, animated: true });
  }, [selectedMonth]);
  

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.id) {
        const data = await getAllCellsForPastor(user?.id);
        setCells(data);
        //console.log(`teste`,data)
      }
    } catch (err) {
      setError('Failed to refresh cells');
    } finally {
      setRefreshing(false);
    }
  };

  const confirmDelete = (cellId: number) => {
    setSelectedCellId(cellId);
    setModalVisible(true);
  };

  const handleDelete = async () => {
      if (selectedCellId !== null) {
        try {
          await deleteCell(selectedCellId);
          console.log('ID DA CELULA', selectedCellId)
          setCells(cells.filter(cell => cell.id !== selectedCellId));
          setModalVisible(false);
        } catch (err) {
          Alert.alert('Erro', 'Falha ao excluir a célula');
        }
      }
    };

  const handleEdit = (cell: Cell) => {
    navigation.navigate('EditCellScreen', { cell });
  };

  const groupedCells = groupCellsByMonth(cells);
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date();
    monthDate.setMonth(index);
    monthDate.setDate(1);
    return monthDate;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.PURPLEDARK1} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.monthsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthsContentContainer}
          ref={scrollViewRef}
        >
          {months.map((month, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.monthButton, 
                isSameMonth(month, selectedMonth) && styles.selectedMonth,
                isSameMonth(month, new Date()) && styles.currentMonth,
                isBefore(month, new Date()) && styles.pastMonth,
                isFuture(month) && styles.futureMonth,
              ]}
              onPress={() => !isFuture(month) && setSelectedMonth(month)}
              disabled={isFuture(month)}
            >
              <Text style={[
                styles.monthText,
                isFuture(month) && styles.disabledText
              ]}>
                {format(month, 'MMMM yyyy', { locale: ptBR })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredCells.length === 0 ? (
        <Text style={styles.noReportsText}>Nenhum Relatório Enviado ainda</Text>
      ) : (
        <FlatList
          data={filteredCells}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: cell }) => (
            <View key={cell.id} style={styles.cellItem}>
              <View style={styles.cellHeader}>
              
            </View>
              <View style={styles.cellHeader}>
                {isSameMonth(new Date(cell.meetingDate), new Date()) && (
                  <Ionicons name="checkmark-circle" size={24} color="green" />
                )}
                <Text style={styles.cellName}>Relatório do dia {new Date(cell.meetingDate).toLocaleDateString()}</Text>
                
              </View>
              <Text style={styles.cellLeader}>Líder: {cell.leader.name || 'Não informado'}</Text>
              <Text style={styles.cellDiscipulador}>Discipulador: {cell.discipler.name || 'Não informado'}</Text>
              <Text style={styles.cellDiscipulador}>Obreiro: {cell.obreiro.name || 'Não informado'}</Text>

              <Text>{cell.membersPresent} Membros</Text>
              <Text>{cell.attendees} Frequentadores</Text>
              <Text>{cell.visitors} Visitantes</Text>
              <Text>Fase da Célula: {cell.cellPhase}</Text>
              <Text>Nome da Célula: {cell.cellName}</Text>
              <Text>Endereço da Célula: {cell.address}</Text>
              {isSameMonth(new Date(cell.meetingDate), new Date()) && (
                <View style={styles.buttonContainer}>
                  <Button title="Deletar" onPress={() => confirmDelete(cell.id)} color="red" />
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noReportsText}>Nenhum Relatório Enviado ainda</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
            <Text>Você tem certeza que deseja deletar esta célula?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.modalButton, styles.modalDeleteButton]}>
                <Text style={styles.modalButtonText}>Deletar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.PURPLE_CARD,
  },
  monthsContainer: {
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: theme.COLORS.PURPLE_CARD,
  },
  monthsContentContainer: {
    justifyContent: 'center',
  },
  monthButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMonth: {
    backgroundColor: theme.COLORS.PURPLE2,
  },
  disabledMonth: {
    backgroundColor: '#f0f0f0',
  },
  monthText: {
    color: '#000',
  },
  disabledText: {
    color: '#aaa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  headerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.COLORS.PURPLE_CARD,
    borderRadius: 10,
  },
  leaderName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  cellItem: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cellName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
 
  listContainer: {
    flexGrow: 1,
  },
  noReportsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold'
  },
    currentMonth: {
      borderWidth: 2,
      borderColor: theme.COLORS.PURPLE2,
      shadowColor: theme.COLORS.PURPLE2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    },
    pastMonth:{
      shadowColor: theme.COLORS.PURPLE1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    },
    
    futureMonth: {
      backgroundColor: '#f0f0f0',
    },
    
    
  
    
    cellHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    cellLeader: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.COLORS.GRAY1,
      marginBottom: 5,
    },
    cellDiscipulador: {
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.COLORS.GRAY1,
      marginBottom: 10,
    },
   
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
   
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.COLORS.WHITE,
      padding: 20,
      borderRadius: 10,
      width: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      padding: 10,
      alignItems: 'center',
      borderRadius: 5,
    },
    modalButtonText: {
      color: theme.COLORS.PRIMARY,
      fontWeight: 'bold',
    },
    modalDeleteButton: {
      backgroundColor: 'red',
    },
});

export default ReportsListPastorScreen;


