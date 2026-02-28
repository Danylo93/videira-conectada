import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CellDetailsScreen: React.FC<{ route: any }> = ({ route }) => {
  const { cell } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reunião de Célula do dia: {new Date(cell.date).toLocaleDateString()}</Text>
      <Text style={styles.detail}>Líder: {cell.leader?.name || 'Não informado'}</Text>
      <Text style={styles.detail}>Endereço: {cell.address || 'Não informado'}</Text>
      <Text style={styles.detail}>Quantidade de membros: {cell.quantityMembers || 'Não informado'}</Text>
      <Text style={styles.detail}>Quantidade de F.A: {cell.quantityAttendees || 'Não informado'}</Text>
      <Text style={styles.detail}>Visitantes: {cell.visitors || 'Não informado'}</Text>
      <Text style={styles.detail}>Fase da Célula: {cell.cellPhase || 'Não informado'}</Text>
      <Text style={styles.detail}>Discipulador: {cell.discipulador?.name || 'Não informado'}</Text>
      <Text style={styles.detail}>Obreiro: {cell.obreiro?.name || 'Não informado'}</Text>
      <Text style={styles.detail}>Pastor: {cell.pastor?.name || 'Não informado'}</Text>

      <Text style={styles.detail}>Whatsapp do Líder: {cell.leader?.phone || 'Não informado'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detail: {
    fontSize: 18,
    marginBottom: 8,
  },
});

export default CellDetailsScreen;
