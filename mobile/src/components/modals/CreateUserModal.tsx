import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Button, Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import AuthContext from '../../context/UserContext';
import { api } from '../../services/api';
import Input from '../common/Input';
import { Container, Title } from '../common/Input/style';
import Select from '../common/Select';


const validationSchema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  email: Yup.string().email('Email inválido').required('Email é obrigatório'),
  password: Yup.string().required('Senha é obrigatória'),
  role: Yup.string().required('Cargo é obrigatório'),
  address: Yup.string().required('Endereço é obrigatório'),
  phone: Yup.string().required('Telefone é obrigatório'),
  discipuladorId: Yup.string().when('role', {
    is: 'Líder',
    then: Yup.string().required('Discipulador é obrigatório'),
  }),
  obreiroId: Yup.string().when('role', {
    is: 'Líder',
    then: Yup.string().required('Obreiro é obrigatório'),
  }),
  pastorId: Yup.string().when('role', {
    is: 'Líder',
    then: Yup.string().required('Pastor é obrigatório'),
  }),
});

const CreateUserModal = ({ modalVisible, closeModal }) => {
  const { control, handleSubmit, watch } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      role: 'Líder',  // Set a default role if it's undefined
    }
  });

  const [pastorOptions, setPastorOptions] = useState([]);
  const [obreiroOptions, setObreiroOptions] = useState([]);
  const [discipuladorOptions, setDiscipuladorOptions] = useState([]);
  const { createUser } = useContext(AuthContext);

  const role = watch('role');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/api/find/users-role?role=Pastor');
        setPastorOptions(data?.map(p => ({ label: p.name, value: p.id })) || []);
  
        const { data: obreiros } = await api.get('/api/find/users-role?role=Obreiro');
        setObreiroOptions(obreiros?.map(o => ({ label: o.name, value: o.id })) || []);
  
        const { data: discipuladores } = await api.get('/api/find/users-role?role=Discipulador');
        setDiscipuladorOptions(discipuladores?.map(d => ({ label: d.name, value: d.id })) || []);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
  
    fetchUsers();
  }, []);
  

  const onSubmit = async data => {
    try {
      await createUser(data);
      Alert.alert('Usuário criado com sucesso');
      closeModal();
    } catch (error) {
      console.error('Failed to create user', error);
      Alert.alert('Erro ao criar usuário');
    }
  };

  return (
    <View style={styles.modalContainer}>
      <ScrollView>
        <Container>
          <Title>Criar Usuário</Title>

          <Text style={styles.label}>Nome </Text>
          <Input control={control} name="name" placeholder="Nome" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Email</Text>
          <Input control={control} name="email" placeholder="Email" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Senha</Text>
          <Input control={control} name="password" placeholder="Senha" secureTextEntry keyboardType={undefined} />

          <Text style={styles.label}>Endereço</Text>
          <Input control={control} name="address" placeholder="Endereço" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Telefone</Text>
          <Input control={control} name="phone" placeholder="Telefone" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Cargo</Text>
          <Select
            control={control}
            name="role"
            options={[
              { label: 'Líder', value: 'Líder' },
              { label: 'Discipulador', value: 'Discipulador' },
              { label: 'Obreiro', value: 'Obreiro' },
              { label: 'Pastor', value: 'Pastor' },
            ]}
            placeholder="Cargo" isDisabled={undefined}          />

          {role === 'Líder' && (
            <>
              <Text style={styles.label}>Selecione o Discipulador</Text>
              <Select control={control} name="discipuladorId" options={discipuladorOptions} placeholder="Discipulador" isDisabled={undefined} />

              <Text style={styles.label}>Selecione o Obreiro</Text>
              <Select control={control} name="obreiroId" options={obreiroOptions} placeholder="Obreiro" isDisabled={undefined} />

              <Text style={styles.label}>Selecione o Pastor</Text>
              <Select control={control} name="pastorId" options={pastorOptions} placeholder="Pastor" isDisabled={undefined} />
            </>
          )}

          {role === 'Discipulador' && (
            <>
              <Text style={styles.label}>Selecione o Obreiro</Text>
              <Select control={control} name="obreiroId" options={obreiroOptions} placeholder="Obreiro" isDisabled={undefined} />

              <Text style={styles.label}>Selecione o Pastor</Text>
              <Select control={control} name="pastorId" options={pastorOptions} placeholder="Pastor" isDisabled={undefined} />
            </>
          )}

          {role === 'Obreiro' && (
            <>
              <Text style={styles.label}>Selecione o Pastor</Text>
              <Select control={control} name="pastorId" options={pastorOptions} placeholder="Pastor" isDisabled={undefined} />
            </>
          )}

          <View style={styles.buttonContainer}>
            <Button title="Criar Usuário" onPress={handleSubmit(onSubmit)} />
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

export default CreateUserModal;
