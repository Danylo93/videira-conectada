import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Button, 
  Alert, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  FlatList 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../../context/UserContext';
import { api } from '../../services/api';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const QRCodeScanner = ({  }) => { 
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState<any | null>(null);
  const [childrenList, setChildrenList] = useState([]); 
  const qrCodeLock = useRef(false);
  const { user } = useContext(AuthContext);


  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cameraModalVisible) {
      startAnimation();
    } else {
      animation.stopAnimation();
    }
  }, [cameraModalVisible]);

  useEffect(() => {
    async function fetchChildren() {
      try {
        const response = await api.get(`/api/children/parent/${user?.id}`);
        setChildrenList(response.data);
      } catch (error) {
       console.error('Erro', 'Não foi possível carregar as crianças.');
      }
    }
    
    fetchChildren();
  }, [user?.id]);

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: screenHeight * 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  async function handleOpenCamera() {
    const { granted } = await requestPermission();
    if (!granted) {
      return Alert.alert('Câmera', 'Você precisa habilitar o uso da câmera.');
    }
    setCameraModalVisible(true);
    qrCodeLock.current = false;
  }

  async function handleQRCodeRead(data: string) {
    try {
      const parsedData = JSON.parse(data);
  console.log(parsedData)
      // Verificar se o campo status está presente
      const childStatus = parsedData.status // Define 'ativo' como padrão, caso não haja status
  
      if (childStatus === 'retirada') {
        Alert.alert('Atenção', 'Esta criança já foi retirada.');
        return; // Impede a alteração de status se já foi retirada
      }
  
      setScannedData(parsedData); // Definir os dados da criança escaneada
      setCameraModalVisible(false);
      setConfirmationModalVisible(true); // Mostrar modal de confirmação
    } catch (error) {
      Alert.alert('Erro', 'QR Code inválido.');
    }
  }
  

  async function handleConfirm() {
    try {
      const { childName, parentName } = scannedData;
      // Enviar o status de retirada para o endpoint da API
      const response = await api.post('/api/children/update-status', {
        childName,
        parentName
      });
  
      if (response.status === 200) {
        Alert.alert('Sucesso', 'O status foi alterado com sucesso!');
        
        // Atualizar a lista de crianças após a confirmação
        setChildrenList(prevChildrenList => 
          prevChildrenList.map(child =>
            child.name === childName
              ? { ...child, status: 'retirada' } // Atualiza o status da criança retirada
              : child
          )
        );
  
        setConfirmationModalVisible(false); // Fechar o modal de confirmação
        setScannedData(null); // Limpar dados da criança
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o status.');
    }
  }
  

  function handleCancelConfirmation() {
    setConfirmationModalVisible(false);
  }

  function handleCancelCamera() {
    setCameraModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.childrenList}>
        <Text style={styles.title}>Minhas Crianças</Text>
        <FlatList
          data={childrenList}
          renderItem={({ item }) => (
            <View style={styles.childItem}>
              <Text>{item.name}</Text>
              <Text>Idade: {item.age}</Text>
              <Text>Salinha: {item.room}</Text>
              <View style={styles.iconContainer}>
                {item.status === 'ativo' ? (
                  <Ionicons name="timer" size={24} color="orange" />
                ) : (
                  <Ionicons name="bag-check-outline" size={24} color="green" />
                )}
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {scannedData ? (
        <View style={styles.card}>
          <Text style={styles.title}>Detalhes da Criança</Text>
          <Text style={styles.label}>Nome: <Text style={styles.value}>{scannedData.childName || 'N/A'}</Text></Text>
          <Text style={styles.label}>Idade: <Text style={styles.value}>{scannedData.age || 'N/A'}</Text></Text>
          <Text style={styles.label}>Salinha: <Text style={styles.value}>{scannedData.room || 'N/A'}</Text></Text>
          <Text style={styles.label}>Responsável: <Text style={styles.value}>{scannedData.parentName || 'N/A'}</Text></Text>
          <Text style={styles.label}>Telefone: <Text style={styles.value}>{scannedData.phone || 'N/A'}</Text></Text>
        </View>
      ) : (
        <Button title="Escanear QRCode" onPress={handleOpenCamera} />
      )}

      <Modal visible={cameraModalVisible} style={{ flex: 1 }} animationType="slide">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={({ data }) => {
            if (data && !qrCodeLock.current) {
              qrCodeLock.current = true;
              setTimeout(() => handleQRCodeRead(data), 500);
            }
          }}
        />

        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.scannerLine,
              { transform: [{ translateY: animation }] },
            ]}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelCamera}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={confirmationModalVisible} animationType="slide" transparent>
        <View style={styles.confirmationModal}>
          <Text style={styles.title}>Confirmar Retirada</Text>
          <Text>Tem certeza de que deseja alterar o status?</Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelConfirmation}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  childrenList: {
    width: screenWidth * 0.9,
    padding: 10,
    marginBottom: 20,
  },
  childItem: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    width: screenWidth * 0.9,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontWeight: 'normal',
  },
  confirmationModal: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    padding: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerLine: {
    width: 300,
    height: 2,
    backgroundColor: 'red',
  },
});

export default QRCodeScanner;