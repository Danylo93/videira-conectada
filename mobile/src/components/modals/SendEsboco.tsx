import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Button, Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import Input from '../common/Input';
import { Container, Title } from '../common/Input/style';
import { addEvent, sendEsboco } from '../../services/eventService';


const validationSchema = Yup.object().shape({
  name: Yup.string().required('Nome do  Evento é obrigatório'),
  image: Yup.string().required('O evento precisa ter uma imagem'),
  startDate: Yup.string().required('Data de inicio do Evento é obrigatória'),
  endDate: Yup.string().required('Data de término do Evento é obrigatória'),
  formUrl: Yup.string().required('Link de Inscrição é obrigatório'),
  
});

const SendEsbocoPalavra = ({ modalVisible, closeModal }) => {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    try {
      await sendEsboco(data); // Passa os dados do formulário
      Alert.alert('Evento criado com sucesso');
      closeModal();
    } catch (error) {
      console.error('Erro ao criar evento:', error.response?.data || error.message);
      Alert.alert('Erro ao criar evento', error.response?.data?.message || 'Erro desconhecido');
    }
  };
  
  

  return (
    <View style={styles.modalContainer}>
      <ScrollView>
        <Container>
          <Title>Enviar Esboço da Palavra</Title>

          <Text style={styles.label}>Titulo da Palavra </Text>
          <Input control={control} name="titulo" placeholder="Titulo da Palavra" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Data do Culto</Text>
          <Input control={control} name="dataCulto" placeholder="Data do Culto" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Arquivo do Esboço</Text>
          <Input control={control} name="file" placeholder="Arquivo deve ser .txt ou .docx" keyboardType={undefined} secureTextEntry={undefined} />

          
          <View style={styles.buttonContainer}>
            <Button title="Enviar" onPress={handleSubmit(onSubmit)} />
            <Button title="Cancelar" onPress={closeModal} color="red" />
          </View>
        </Container>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
});

export default SendEsbocoPalavra;
