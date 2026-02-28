import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AuthContext from '../../context/UserContext';
import LoadingScreen from './LoadingScreen';
import { api } from '../../services/api';

const screenWidth = Dimensions.get('window').width;

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface CellInfo {
  multiplicationDate?: string;
  phase?: string;
  reportDate?: string;
  additionalInfo?: string;
  cellName?: string;
}

interface PieChartProps {
  data: PieChartData[];
  leaderId: number; // Identificador do líder para buscar dados
}

const CustomPieChartLeader: React.FC<PieChartProps> = ({ data, leaderId }) => {
  const [cellInfo, setCellInfo] = useState<CellInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchCellInfo = async () => {
      try {
        const response = await api.get(`/api/reports/leader/${user?.id}`);
        const result = await response.data;

        if (Array.isArray(result) && result.length > 0) {
          const latestReport = result[0]; // Obtendo o relatório mais recente
          setCellInfo({
            multiplicationDate: new Date(latestReport.multiplicationDate).toLocaleDateString(),
            phase: latestReport.cellPhase,
            reportDate: new Date(latestReport.meetingDate).toLocaleDateString(),
            additionalInfo: latestReport.additionalInfo,
            cellName: latestReport.cellName,
          });
        } else {
          setCellInfo({});
        }
      } catch (error) {
        console.error('Erro ao buscar informações da célula:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCellInfo();
  }, [leaderId]);

  if (loading) {
      return <LoadingScreen />;
  }
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{cellInfo?.cellName}:</Text>
      <PieChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#f0f0f0',
          backgroundGradientTo: '#f0f0f0',
          color: (opacity = 1) => `rgba(34, 139, 230, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
      <View style={styles.cellInfoContainer}>
        <Text style={styles.infoText}>Nome da Célula: {cellInfo?.cellName || 'Não Definido'}</Text>
        <Text style={styles.infoText}>Data de Multiplicação: {cellInfo?.multiplicationDate || 'Não Definido'}</Text>
        <Text style={styles.infoText}>Fase: {cellInfo?.phase || 'Não Preenchido'}</Text>
        <Text style={styles.infoText}>Informações Adicionais: {cellInfo?.additionalInfo || 'Nenhuma informação'}</Text>
        <Text style={styles.infoReport}>Dados com base no último relatório enviado em: {cellInfo?.reportDate || 'Não Disponível'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#228BE6',
  },
  cellInfoContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  infoReport: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomPieChartLeader;
