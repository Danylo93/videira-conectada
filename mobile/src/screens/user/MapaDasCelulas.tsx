import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import * as Location from 'expo-location';
import { api } from 'src/services/api';

const MapaDasCelulas = () => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedChurch, setSelectedChurch] = useState(false);
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -23.557279924280415, 
    longitude: -46.464708997713046,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [travelTime, setTravelTime] = useState({ car: null, bus: null });

  const churchLocation = {
    latitude: -23.557279924280415,
    longitude: -46.464708997713046,
  };

  useEffect(() => {
    const fetchCells = async () => {
      try {
        const response = await api.get('/api/all/cells');
        console.log('Dados das células:', response.data); // Log dos dados recebidos
        const validCells = response.data.filter(cell => cell.latitude && cell.longitude);
        setCells(validCells);
        console.log('Células válidas:', validCells); // Log das células válidas

        if (validCells.length > 0) {
          setInitialRegion({
            latitude: validCells[0].latitude,
            longitude: validCells[0].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar células:', error); // Log do erro
        Alert.alert('Erro', 'Não foi possível carregar as células.');
      } finally {
        setLoading(false);
      }
    };

    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Permissão de localização foi negada.');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Erro ao obter localização do usuário:', error);
        Alert.alert('Erro', 'Não foi possível obter sua localização.');
      }
    };

    fetchCells();
    getUserLocation();
  }, []);

  const handleMarkerPress = (cell) => {
    setSelectedCell(cell);
    setSelectedChurch(false);
    calculateTravelTime(cell);
  };

  const handleChurchPress = () => {
    setSelectedChurch(true);
    setSelectedCell(null);
    calculateTravelTime(churchLocation);
  };

  const handleCloseModal = () => {
    setSelectedCell(null);
    setSelectedChurch(false);
    setTravelTime({ car: null, bus: null });
  };

  const handleWhatsAppPress = (phone, leader) => {
    const message = `Olá ${leader}, gostaria de mais informações sobre a célula.`;
    const url = `whatsapp://send?phone=${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  };

  const calculateTravelTime = async (destination) => {
    if (!userLocation) {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
      return;
    }

    try {
      const responseCar = await axios.get(`https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destination.longitude},${destination.latitude}?overview=false`);
      const responseBus = await axios.get(`https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destination.longitude},${destination.latitude}?overview=false`);

      const carTime = responseCar.data.routes[0].duration / 60; // Convertendo segundos para minutos
      const busTime = responseBus.data.routes[0].duration / 60; // Convertendo segundos para minutos

      setTravelTime({ car: `${Math.round(carTime)} min`, bus: `${Math.round(busTime)} min` });
    } catch (error) {
      console.error('Erro ao calcular o tempo de viagem:', error);
      Alert.alert('Erro', 'Não foi possível calcular o tempo de viagem.');
    }
  };

  const handleGetDirections = (destination) => {
    if (!userLocation || !destination) {
      Alert.alert('Erro', 'Não foi possível obter a localização ou destino.');
      return;
    }

    Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
       <WebView
        source={{
          uri: `https://www.google.com/maps/@${initialRegion.latitude},${initialRegion.longitude},15z`,
        }}
        style={{ flex: 1, width: '100%' }}
      />

      )}
      {(selectedCell || selectedChurch) && (
        <View style={styles.modal}>
          {selectedChurch ? (
            <>
              <Text style={styles.modalTitle}>Videira Itaquera</Text>
              <Text style={styles.modalText}>Endereço: Rua Cachoeira Utupanema, 344,Itaquera, SP</Text>
              <Text style={styles.modalText}>Horário: Culto aos domingos às 10h e as 18h</Text>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Célula do {selectedCell.leaderName}</Text>
              <Text style={styles.modalText}>Líder: {selectedCell.leaderName}</Text>
              <Text style={styles.modalText}>Endereço: {selectedCell.address}</Text>
              <Text style={styles.modalText}>Horário: {selectedCell.schedule}</Text>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => handleWhatsAppPress(selectedCell.whatsapp, selectedCell.leaderName)}
              >
                <Text style={styles.whatsappButtonText}>Entrar em Contato pelo WhatsApp</Text>
              </TouchableOpacity>
            </>
          )}
          {travelTime.car && <Text style={styles.modalText}>Tempo de aproximado de carro: {travelTime.car}</Text>}
          {travelTime.bus && <Text style={styles.modalText}>Tempo de aproximado de ônibus: {travelTime.bus}</Text>}
          <TouchableOpacity style={styles.routeButton} onPress={() => handleGetDirections(selectedChurch ? churchLocation : selectedCell)}>
            <Text style={styles.routeButtonText}>Traçar Rota</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  routeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapaDasCelulas;