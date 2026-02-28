import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AuthContext from '../context/UserContext';
import DataContext from '../context/DataContext';

const EditCellModal = ({ modalVisible, closeModal }) => {
  // const { cellReport } = useContext(DataContext);
  // const [formData, setFormData] = useState({
  //   cellName: cellReport?.cellName || '',
  // });

  // console.log('Dados do modal', formData)

  // const handleChange = (field, value) => {
  //   setFormData({ ...formData, [field]: value });
  // };

  // const handleUpdate = async () => {
  //   await updateUser(user?.id, formData);
  //   closeModal();
  // }

  return (
    <View style={styles.modal}>
      <Text style={styles.title}>Editar Usuário</Text>
      {/* <TextInput
        style={styles.input}
        value={formData.cellName}
        onChangeText={(text) => handleChange('name', text)}
        placeholder="Nome"
      /> */}
      {/* <TextInput
        style={styles.disabledInput}
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        placeholder="Email"
        editable={false} // Desabilita o campo
      /> */}
      {/* <TextInput
        style={styles.input}
        value={formData.obreiroNetwork}
        onChangeText={(text) => handleChange('obreiroNetwork', text)}
        placeholder="Rede de Obreiro"
      />
      <TextInput
        style={styles.input}
        value={formData.discipuladorNetwork}
        onChangeText={(text) => handleChange('discipuladorNetwork', text)}
        placeholder="Rede de Discipulador"
      /> */}
      {/* <TextInput
        style={styles.input}
        value={formData.cellName}
        onChangeText={(text) => handleChange('cellName', text)}
        placeholder="Nome da Célula"
      /> */}
      {/* <TextInput
        style={styles.input}
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
        placeholder="Endereço"
      />
      <TextInput
        style={styles.input}
        value={formData.phone}
        onChangeText={(text) => handleChange('phone', text)}
        placeholder="Whatsapp"
      /> */}
      {/* <Button title="Salvar" onPress={handleUpdate} /> */}
      <Button title="Cancelar" onPress={closeModal} color="red" />
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  disabledInput: {
    backgroundColor: '#e0e0e0', // Cor cinza para indicar desabilitado
    color: '#a0a0a0', // Texto com menos contraste
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default EditCellModal;