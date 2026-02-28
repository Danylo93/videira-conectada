import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ícones para faixa etária

const rooms = [
  { id: '1', name: 'Sala dos Bebês', ageGroup: '1 a 3', icon: 'flask' },
  { id: '2', name: 'Sala dos Pequenos', ageGroup: '1 a 3', icon: 'american-football' },
  { id: '3', name: 'Sala dos Jovens Exploradores', ageGroup: '4 a 7', icon: 'person' },
  { id: '4', name: 'Sala dos Aventureiros', ageGroup: '4 a 7', icon: 'flask' },
];

const DK = () => {
  const navigation = useNavigation();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    Alert.alert('Sala Selecionada', 'Você selecionou a sala com sucesso!');
  };

  const handleRoomDetails = (roomId: string) => {
    if (selectedRoom === roomId) {
      navigation.navigate('Retirada Kids');
    } else {
      Alert.alert('Erro', 'Você não colocou sua criança nesta sala.');
    }
  };

  const renderRoom = ({ item }) => (
    <View style={[styles.roomCard, styles[`roomCard_${item.ageGroup.replace(' ', '')}`]]}>
      <Ionicons name={item.icon} size={40} color="#4CAF50" style={styles.roomIcon} />
      <Text style={styles.roomName}>{item.name}</Text>
      <Text style={styles.roomAgeGroup}>Faixa etária: {item.ageGroup} anos</Text>
      {selectedRoom === item.id ? (
        <TouchableOpacity style={styles.detailsButton} onPress={() => handleRoomDetails(item.id)}>
          <Text style={styles.detailsButtonText}>Ver detalhes</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.selectButton} onPress={() => handleSelectRoom(item.id)}>
          <Text style={styles.selectButtonText}>Selecionar Sala</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Salas para Crianças</Text>

      {/* Seção: 1 a 3 anos */}
      <Text style={styles.sectionHeader}>1 a 3 anos</Text>
      <FlatList
        data={rooms.filter((room) => room.ageGroup === '1 a 3')}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Seção: 4 a 7 anos */}
      <Text style={styles.sectionHeader}>4 a 7 anos</Text>
      <FlatList
        data={rooms.filter((room) => room.ageGroup === '4 a 7')}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#555',
  },
  listContent: {
    paddingHorizontal: 8,
  },
  roomCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center', // Alinha o conteúdo ao centro
  },
  roomCard_1a3: { 
    backgroundColor: '#F0F8FF', // Azul claro para bebês
  },
  roomCard_4a7: { 
    backgroundColor: '#FFF5E1', // Amarelo suave para jovens exploradores
  },
  roomIcon: {
    marginBottom: 8,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  roomAgeGroup: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DK;