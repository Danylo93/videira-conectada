import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import moment from 'moment'; // Para manipulação de datas
import Select from '../../components/common/Select';
import AuthContext from '../../context/UserContext';
import { api } from '../../services/api';

const SendReportScreen: React.FC = () => {
  const [obreiroOptions, setObreiroOptions] = useState<{ label: string, value: number }[]>([]);
  const [pastorOptions, setPastorOptions] = useState<{ label: string, value: number }[]>([]);
  const { user } = useContext(AuthContext);

  const validationSchema = Yup.object().shape({
    obreiroId: Yup.number().required('Selecione um Obreiro'),
    pastorId: Yup.number().required('Selecione um Pastor'),
  });

  const { control, handleSubmit, watch } = useForm({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/api/pastores');
        setPastorOptions(data.map(p => ({ label: p.name, value: p.id })));

        const { data: obreiros } = await api.get('/api/obreiros');
        setObreiroOptions(obreiros.map(o => ({ label: o.name, value: o.id })));
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSendReport = async (formData: { obreiroId: number, pastorId: number }) => {
    try {
      const response = await api.post('/api/send-report', {
        discipuladorId: user?.user?.id,
        obreiroId: formData.obreiroId,
        pastorId: formData.pastorId,
        date: moment().format('YYYY-MM-DDTHH:mm:ss.sssZ'), // Data atual no formato ISO
      });

      if (response.status === 400) {
        Alert.alert('Atenção você ja enviou o Relatório nos últimos 7 dias', response.data.message); // Exibe a mensagem se o relatório não puder ser enviado
        return;
      }

      Alert.alert('Sucesso', response.data.message); // Mensagem de sucesso
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar o relatório');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Enviar Relatório para Obreiro</Text>

      <Text style={styles.label}>Selecione o Obreiro</Text>
      <Select control={control} name="obreiroId" options={obreiroOptions} placeholder="Obreiro" />

      <Text style={styles.label}>Selecione o Pastor</Text>
      <Select control={control} name="pastorId" options={pastorOptions} placeholder="Pastor" />

      <Button title="Enviar Relatório" onPress={handleSubmit(handleSendReport)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
});

export default SendReportScreen;
