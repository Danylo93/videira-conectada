import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, Text, SafeAreaView, View, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '../../services/api';

const PalavrasScreen: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEsboco, setSelectedEsboco] = useState<string | null>(null);
  const [esbocos, setEsbocos] = useState<any[]>([]); // Array para armazenar os esboços do S3

  // Função para buscar os esboços do backend
  const fetchEsbocos = async () => {
    try {
      const response = await api.get('/api/files/list'); 
      setEsbocos(response.data.files);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os esboços.');
    }
  };

  useEffect(() => {
    fetchEsbocos(); // Carregar os esboços ao montar o componente
  }, []);

  const handleDownload = async (esboco: string, titulo: string) => {
    try {
      // Formatar o esboço para melhorar a legibilidade (adicionar quebras de linha)
      const formattedEsboco = esboco.replace(/\n/g, "\n\n"); // Dupla quebra de linha para melhor legibilidade
      const filePath = `${FileSystem.documentDirectory}${titulo.replace(/\s/g, "_")}.txt`;
  
      // Salvar o arquivo
      await FileSystem.writeAsStringAsync(filePath, formattedEsboco, {
        encoding: FileSystem.EncodingType.UTF8, // Garantir que a codificação seja UTF-8
      });
  
      // Compartilhar o arquivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert("Erro", "Compartilhamento não suportado neste dispositivo.");
      }
  
      setIsModalVisible(false); // Fechar modal após compartilhar
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o arquivo. Tente novamente.");
    }
  };
  

  const handleOpenModal = (esboco: string) => {
    setSelectedEsboco(esboco);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedEsboco(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {esbocos.map((esboco, index) => (
          <View style={styles.cultoContainer} key={index}>
          <Text style={styles.cultoTitle}>{esboco.titulo}</Text>
            <Text style={styles.cultoDate}>{new Date(esboco.dataCulto).toLocaleDateString()}</Text>
           <Text style={styles.cultoOutline}>{esboco.key}</Text>

            <TouchableOpacity style={styles.viewOutlineButton} onPress={() => handleOpenModal(esboco.fileUrl)}>
              <Text style={styles.buttonText}>Baixar Esboço Completo</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal de Exibição */}
      <Modal isVisible={isModalVisible} onBackdropPress={handleCloseModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Esboço Completo</Text>
          <Text>{selectedEsboco}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => handleDownload(selectedEsboco!, "Esboco")}>
            <Text style={styles.modalButtonText}>Salvar no Dispositivo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal}>
            <Text style={styles.modalButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9fb',
    padding: 20,
  },
  cultoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cultoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cultoDate: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  cultoOutline: {
    fontSize: 16,
    color: '#555',
  },
  viewOutlineButton: {
    backgroundColor: '#7c4dff',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#7c4dff',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PalavrasScreen;
