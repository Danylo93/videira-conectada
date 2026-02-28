// 📁 src/screens/DashboardUser/TithesAndOfferings.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
//import Clipboard from '@react-native-clipboard/clipboard';
import styles from './styles';

const TithesAndOfferings = () => {
  const [isModalVisible, setModalVisible] = useState(false);

  const pixKey = '03403328/0008-13';
  const pixName = 'Videira Itaquera';
  const pixDescription = 'Dados Bancários da';

//   const handleCopyPixKey = () => {
//     Clipboard.setString(pixKey);
//     Toast.show({
//       type: 'success',
//       text1: 'Copiado',
//       text2: 'A chave Pix foi copiada para a área de transferência.',
//       position: 'top',
//       visibilityTime: 3000,
//       autoHide: true,
//       topOffset: 50,
//     });
//   };

  return (
    <View style={styles.tithesContainer}>
      <Text style={styles.tithesTitle}>Dízimos e Ofertas</Text>
      <Text style={styles.tithesText}>
        No Ano da Restituição seja generoso nas sua Oferta das Primícias. Participe desse mover!
      </Text>
      <TouchableOpacity style={styles.offerButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.offerButtonText}>Ofertar</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.pixDataText}>{pixDescription}</Text>
            <Text style={styles.pixDataText}>{pixName}:</Text>
            <Text style={styles.pixData}>{pixKey}</Text>
            {/* <TouchableOpacity style={styles.copyButton} onPress={handleCopyPixKey}>
              <Text style={styles.copyButtonText}>Copiar Chave Pix</Text>
            </TouchableOpacity> */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TithesAndOfferings;
