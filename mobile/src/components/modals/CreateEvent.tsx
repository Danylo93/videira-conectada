import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Button, Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import Input from '../common/Input';
import { Container, Title } from '../common/Input/style';
import { addEvent } from '../../services/eventService';


const validationSchema = Yup.object().shape({
  name: Yup.string().required('Nome do  Evento é obrigatório'),
  image: Yup.string().required('O evento precisa ter uma imagem'),
  startDate: Yup.string().required('Data de inicio do Evento é obrigatória'),
  endDate: Yup.string().required('Data de término do Evento é obrigatória'),
  formUrl: Yup.string().required('Link de Inscrição é obrigatório'),
  
});

const CreateEvent = ({ modalVisible, closeModal }) => {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    try {
      await addEvent(data); // Passa os dados do formulário
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
          <Title>Criar Evento</Title>

          <Text style={styles.label}>Nome </Text>
          <Input control={control} name="name" placeholder="Nome do Evento" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Descrição</Text>
          <Input control={control} name="description" placeholder="Descrição do Evento" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Imagem</Text>
          <Input control={control} name="image" placeholder="Imagem do Evento" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Começa em:</Text>
          <Input control={control} name="startDate" placeholder="Inicio do Evento" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Término:</Text>
          <Input control={control} name="endDate" placeholder="Fim do Evento" keyboardType={undefined} secureTextEntry={undefined} />
          
          <Text style={styles.label}>Link para Inscrição</Text>
          <Input control={control} name="formUrl" placeholder="Link de Inscrição" keyboardType={undefined} secureTextEntry={undefined} />
          
          <View style={styles.buttonContainer}>
            <Button title="Criar" onPress={handleSubmit(onSubmit)} />
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

export default CreateEvent;
