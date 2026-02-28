import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Modal, TouchableOpacity, RefreshControl, Alert, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../../context/UserContext';
import theme from '../../styles/theme';
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, isBefore, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditCellModal from '../../components/modals/EditCellModal';
import { getAllCellsLeader, deleteCell } from '../../services/cellService';

interface Cell {
  id: number;
  cellName: string;
  address: string;
  cellPhase: string;
  meetingDate: string;
  membersPresent: string;
	attendees: string;
	visitors: string;
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

const ReportsLeaderListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null); // Armazenar a célula selecionada para edição

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
          const data = await getAllCellsLeader(user?.id);
          setCells(data);
        } catch (err) {
          setError('Failed to load cells');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCells();
  }, [user?.id]);

  useEffect(() => {
    // Filtra as células com base no mês selecionado
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const filtered = cells.filter(cell => {
      const cellDate = parseISO(cell.meetingDate);
      return isSameMonth(cellDate, selectedMonth);
    });
    setFilteredCells(filtered);
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
        const data = await getAllCellsLeader(user?.id);
        setCells(data);
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
    <View style={styles.container}>
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

      {filteredCells?.length === 0 ? (
        <Text style={styles.noReportsText}>Nenhum Relatório Enviado ainda</Text>
      ) : (
        <FlatList
          data={filteredCells}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: cell }) => (
            <View key={cell.id} style={styles.cellItem}>
              <View style={styles.cellHeader}>
                {isSameMonth(new Date(cell.meetingDate), new Date()) && (
                  <Ionicons name="checkmark-circle" size={24} color="green" />
                )}
                <Text style={styles.cellName}>Relatório do dia {new Date(cell.meetingDate).toLocaleDateString()}</Text>
              </View>
              <Text>{cell.membersPresent} Membros</Text>
              <Text>{cell.attendees} Frequentadores</Text>
              <Text>{cell.visitors} Visitantes</Text>
              <Text>Fase da Célula: {cell.cellPhase}</Text>
              <Text>Nome da Célula: {cell.cellName}</Text>
              <Text>Endereço da Célula: {cell.address}</Text>
              {isSameMonth(new Date(cell.meetingDate), new Date()) && (
                <View style={styles.buttonContainer}>
                  <Button title="Editar" onPress={() => { setSelectedCell(cell); setEditModalVisible(true); }} />
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

       {/* Modal para edição */}
       <Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <EditCellModal
            modalVisible={editModalVisible}
            closeModal={() => setEditModalVisible(false)}
            cell={selectedCell} // Passa a célula selecionada para o modal de edição
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
  },
  monthsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  monthsContentContainer: {
    paddingHorizontal: 8,
  },
  monthButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMonth: {
    backgroundColor: theme.COLORS.PURPLE2,
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
  monthText: {
    color: '#000',
  },
  disabledText: {
    color: '#aaa',
  },

  cellItem: {
    padding: 16,
    backgroundColor: theme.COLORS.WHITE,
    borderRadius: 8,
    marginBottom: 8,
  },
  cellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cellName: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  noReportsText: {
    textAlign: 'center',
    marginTop: 16,
    color: theme.COLORS.TEXT,
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
    color: theme.COLORS.BLACK,
    fontWeight: 'bold',
  },
  modalDeleteButton: {
    backgroundColor: 'red',
  },
});

export default ReportsLeaderListScreen;
