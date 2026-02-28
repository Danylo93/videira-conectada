import React, { useContext } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AuthContext from '../../context/UserContext';

const screenWidth = Dimensions.get('window').width;
// const { user } = useContext(AuthContext);

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  anjosDaGuarda: number;
  lideresEmTreinamento: number;
  lideres: number;
  dataProximaMeta: string; // Formato 'YYYY-MM-DD'
  membrosMeta: number;
}



const CustomPieChartObreiro: React.FC<PieChartProps> = ({ data, anjosDaGuarda, lideresEmTreinamento, lideres, dataProximaMeta, membrosMeta }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Frequência nas células</Text>
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
  infoContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
});

export default CustomPieChartObreiro;
