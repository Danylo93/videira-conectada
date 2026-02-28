import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AuthContext from '../../context/UserContext';
import Toast from 'react-native-toast-message';
import Select from '../../components/common/Select';
import { api } from '../../services/api';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import Input from '../../components/common/Input';
import { createCells } from '../../services/cellService';

const validationSchema = Yup.object().shape({
  whatsapp: Yup.string().required('WhatsApp e obrigatorio'),
  address: Yup.string().required('Endereco e obrigatorio'),
  schedule: Yup.string().required('Horario e obrigatorio'),
  obreiroId: Yup.string().required('Obreiro e obrigatorio'),
  pastorId: Yup.string().required('Pastor e obrigatorio'),
  leaderId: Yup.string().required('Lider e obrigatorio'),
});

const CadastrarCelula = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [pastorOptions, setPastorOptions] = useState([]);
  const [obreiroOptions, setObreiroOptions] = useState([]);
  const [lideresOptions, setLideresOptions] = useState([]);

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: pastores } = await api.get('/api/find/users-role?role=Pastor');
        setPastorOptions(pastores?.map((p) => ({ label: p.name, value: p.id })) || []);

        const { data: obreiros } = await api.get('/api/find/users-role?role=Obreiro');
        setObreiroOptions(obreiros?.map((o) => ({ label: o.name, value: o.id })) || []);

        const { data: lideres } = await api.get('/api/find/users-role?role=Lider');
        setLideresOptions(lideres?.map((d) => ({ label: d.name, value: d.id })) || []);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };

    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        disciplerId: user?.id,
        leaderId: Number(data.leaderId),
        obreiroId: Number(data.obreiroId),
        pastorId: Number(data.pastorId),
      };

      await createCells(formData);
      reset();
      navigation.navigate('Main', {
        screen: 'Perfil',
        params: { toastMessage: 'Celula criada com sucesso!' },
      });
    } catch (error) {
      console.error('Failed to create cell', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Nao foi possivel cadastrar a celula.',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50,
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastrar Celula</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Selecione o Lider</Text>
        <Select control={control} name="leaderId" options={lideresOptions} placeholder="Lider" />

        <Text style={styles.label}>Selecione o Obreiro</Text>
        <Select control={control} name="obreiroId" options={obreiroOptions} placeholder="Obreiro" />

        <Text style={styles.label}>Selecione o Pastor</Text>
        <Select control={control} name="pastorId" options={pastorOptions} placeholder="Pastor" />

        <Input control={control} name="whatsapp" placeholder="WhatsApp" />
        <Input control={control} name="address" placeholder="Endereco" />
        <Input control={control} name="schedule" placeholder="Horario" />

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Criar Celula</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#d9534f',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CadastrarCelula;
