import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import AuthContext from '../../context/UserContext';
import { api } from '../../services/api';
import moment from 'moment';
import Select from '../../components/common/Select';
import CalendarInput from '../../components/common/Calendar';
import { useNavigation } from '@react-navigation/native';
import MultiSelect from 'react-native-multiple-select'; // Importe o componente


const ReportScreen: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [disciplerOptions, setDisciplerOptions] = useState([]);
  const [obreiroOptions, setObreiroOptions] = useState([]);
  const [pastorOptions, setPastorOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [membersOptions, setMembersOptions] = useState([]);
  const [attendeesOptions, setAttendeesOptions] = useState([]);
  const [fetchAttendeesTriggered, setFetchAttendeesTriggered] = useState(false); // Variável de controle

  const navigation = useNavigation<any>();

 

  const cellPhaseOptions = [
    { label: 'Comunhão', value: 'Comunhão' },
    { label: 'Edificação', value: 'Edificação' },
    { label: 'Evangelismo', value: 'Evangelismo' },
    { label: 'Multiplicação', value: 'Multiplicação' },
  ];

  const validationSchema = Yup.object().shape({
    meetingDate: Yup.date().required('Selecione a data da reunião').nullable(),
    cellName: Yup.string().required('O nome da célula é obrigatório'),
    cellPhase: Yup.string().required('A fase da célula é obrigatória'),
    membersPresent: Yup.array().min(1, 'Deve haver pelo menos 1 membro presente'),
    attendees: Yup.array().min(0, 'Deve haver pelo menos 0 frequentador'),
    visitors: Yup.number().required('Informe a quantidade de visitantes'),
    multiplicationDate: Yup.date().nullable(),
    additionalInfo: Yup.string(),
    disciplerId: Yup.number().required('Selecione um discipulador'),
    workerId: Yup.number().required('Selecione um obreiro'),
    pastorId: Yup.number().required('Selecione um pastor'),
  });
  

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      meetingDate: new Date(),
      cellName: '',
      cellPhase: '',
      membersPresent: [],
      attendees: [],
      visitors: 0,
      multiplicationDate: new Date(),
      additionalInfo: '',
      disciplerId: 0,
      workerId: 0,
      pastorId: 5,
    },
  });

  const fetchDataMembers = async () => {
    try {
      const membersResponse = await api.get(`/api/members/${user?.id}`);
      const membersData = await membersResponse.data;
      // Verifique se a resposta da API é um array, como no exemplo de dados
      const members = membersData.map((member: any) => ({
        id: member.id.toString(),  // Certifique-se de que o ID é uma string
        name: member.name,
      }));

      setMembersOptions(members);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    }
  };

  const fetchDataFrequentadores = async () => {
    try {
      const frequentadorResponse = await api.get(`/api/attendees/${user?.id}`);
      const frequenData = await frequentadorResponse.data;
      const frequentador = frequenData.map((frequen: any) => ({
        id: frequen.id.toString(),
        name: frequen.name,
      }));

      setAttendeesOptions(frequentador);
    } catch (error) {
      console.error('Erro ao buscar frequentadores:', error);
    }
  };

  useEffect(() => {
    fetchDataMembers();
    // O fetch de frequentadores será chamado apenas quando fetchAttendeesTriggered for true
    if (fetchAttendeesTriggered) {
      fetchDataFrequentadores();
    }
  }, [fetchAttendeesTriggered]); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pastoresResponse, obreirosResponse, disciplerResponse] = await Promise.all([
          api.get('/api/find/users-role?role=Pastor'),
          api.get('/api/find/users-role?role=Obreiro'),
          api.get('/api/find/users-role?role=Discipulador'),
        ]);
        setDisciplerOptions(disciplerResponse.data.map((o: any) => ({ label: o.name, value: o.id })));
        setPastorOptions(pastoresResponse.data.map((p: any) => ({ label: p.name, value: p.id })));
        setObreiroOptions(obreirosResponse.data.map((o: any) => ({ label: o.name, value: o.id })));
      } catch (error) {
        Alert.alert('Erro', 'Falha ao carregar dados');
        console.error('Error fetching options:', error);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (formData: any) => {
    setLoading(true);
    try {
      // Prepara o payload
      const payload = {
        meetingDate: moment(formData.meetingDate).toISOString(),
        membersPresent: formData.membersPresent.length > 0 
          ? formData.membersPresent.map(Number) // Converte os valores para números
          : [],
        attendees: formData.attendees.length > 0 
          ? formData.attendees.map(Number) // Caso necessário, converte attendees também
          : [],
        visitors: formData.visitors,
        additionalInfo: formData.additionalInfo,
        cellName: formData.cellName,
        multiplicationDate: formData.multiplicationDate 
          ? moment(formData.multiplicationDate).toISOString() 
          : null,
        cellPhase: formData.cellPhase,
        leaderId: user?.id, // Inclui automaticamente o líder logado
        disciplerId: formData.disciplerId,
        workerId: formData.workerId,
        pastorId: formData.pastorId,
      };
  
  
      // Envia o payload para a API
      const response = await api.post('/api/reports/create', payload);
  
      // Verifica o status da resposta
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Sucesso', 'Relatório enviado com sucesso!');
        reset(); // Limpa o formulário após sucesso
        navigation.navigate('Main', { screen: 'Inicio' });
        setLoading(true);
        await atualizarGrafico(); // Atualiza o gráfico
        setLoading(false);
      } else {
        Alert.alert('Erro', response.data.message || 'Falha ao enviar o relatório');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
      console.error('Erro ao enviar o relatório:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const atualizarGrafico = async () => {
    // Simula um delay ou chamada de API para recarregar dados
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Data da Reunião</Text>
      <CalendarInput control={control} name="meetingDate" />
      {errors.meetingDate && <Text style={styles.errorText}>{errors.meetingDate.message}</Text>}

      <Text style={styles.label}>Nome da Célula</Text>
      <Controller
        control={control}
        name="cellName"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, errors.cellName && styles.errorInput]}
            placeholder="Digite o nome da célula"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.cellName && <Text style={styles.errorText}>{errors.cellName.message}</Text>}

      <Text style={styles.label}>Fase da Célula</Text>
      <Select control={control} name="cellPhase" options={cellPhaseOptions} placeholder="Selecione a fase da célula" />
      {errors.cellPhase && <Text style={styles.errorText}>{errors.cellPhase.message}</Text>}

      <Text style={styles.label}>Membros Presentes</Text>
      <Controller
        control={control}
        name="membersPresent"
        render={({ field: { onChange, value } }) => (
          <MultiSelect
  items={membersOptions}
  uniqueKey="id"
  displayKey="name"
  onSelectedItemsChange={onChange}

  // onSelectedItemsChange={(selectedItems) => {
  //   // Converte todos os ids para número (caso seja string)
  //   const ids = selectedItems.map((item) => Number(item));
  //   onChange(ids); // Passa os ids convertidos para o onChange
  // }}
  selectedItems={value || []}
  selectText="Selecione os membros"
  searchInputPlaceholderText="Pesquisar membros"
  tagRemoveIconColor="red"
  tagBorderColor="#ccc"
  tagTextColor="#333"
  selectedItemTextColor="#000"
  selectedItemIconColor="#333"
  submitButtonColor="#5eab6e"
  submitButtonText="Confirmar"
  
  
/>


        )}
      />
      {errors.membersPresent && <Text style={styles.errorText}>{errors.membersPresent.message}</Text>}

      <Text style={styles.label}>Frequentadores</Text>
      <Controller
        control={control}
        name="attendees"
        render={({ field: { onChange, value } }) => (
          <MultiSelect
            items={attendeesOptions}
            uniqueKey="id"
            displayKey="name"
            onSelectedItemsChange={onChange}
            selectedItems={value || []}
            selectText="Selecione os frequentadores"
            searchInputPlaceholderText="Pesquisar frequentadores"
            tagRemoveIconColor="red"
            tagBorderColor="#ccc"
            tagTextColor="#333"
            selectedItemTextColor="#333"
            selectedItemIconColor="#333"
            submitButtonColor="#5eab6e"
            submitButtonText="Confirmar"
          />
        )}
      />
      {errors.attendees && <Text style={styles.errorText}>{errors.attendees.message}</Text>}

      <Text style={styles.label}>Visitantes</Text>
      <Controller
        control={control}
        name="visitors"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, errors.visitors && styles.errorInput]}
            placeholder="Digite a quantidade de visitantes"
            keyboardType="numeric"
            value={String(value)}
            onChangeText={(text) => onChange(Number(text))}
          />
        )}
      />
      {errors.visitors && <Text style={styles.errorText}>{errors.visitors.message}</Text>}

      <Text style={styles.label}>Data de Multiplicação</Text>
      <CalendarInput control={control} name="multiplicationDate" />
      {errors.multiplicationDate && <Text style={styles.errorText}>{errors.multiplicationDate.message}</Text>}

      <Text style={styles.label}>Discipulador</Text>
      <Select control={control} name="disciplerId" options={disciplerOptions} placeholder="Selecione um discipulador" />

      <Text style={styles.label}>Obreiro</Text>
      <Select control={control} name="workerId" options={obreiroOptions} placeholder="Selecione um obreiro" />

      <Text style={styles.label}>Pastor</Text>
      <Select control={control} name="pastorId" options={pastorOptions} placeholder="Selecione um pastor" />

      <Button title={loading ? 'Enviando...' : 'Enviar Relatório'} onPress={handleSubmit(onSubmit)} disabled={loading} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  errorInput: {
    borderColor: '#f00',
  },
  errorText: {
    color: '#f00',
    marginBottom: 16,
  },
});

export default ReportScreen;
