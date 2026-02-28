import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Button, Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Container, Title } from '../../components/common/Input/style';
import { api } from '../../services/api';
import AuthContext from '../../context/UserContext';
import LoadingScreen from '../../components/common/LoadingScreen';

const validationSchema = Yup.object().shape({
  discipuladorId: Yup.string().required('Discipulador é obrigatório'),
  obreiroId: Yup.string().required('Obreiro é obrigatório'),
  leaderId: Yup.string().required('Líder é obrigatório'),
  quantityMembers: Yup.number().required('Quantidade de membros é obrigatória'),
  quantityAttendees: Yup.number().required('Quantidade de participantes é obrigatória'),
  address: Yup.string().required('Endereço é obrigatório'),
  phone: Yup.string().required('Telefone é obrigatório'),
  pastorId: Yup.string().required('Pastor é obrigatório'),
  cellPhase: Yup.string().required('Fase da célula é obrigatória'),
  multiplicationDate: Yup.date().required('Data de multiplicação é obrigatória'),
});

const EditCellScreen = ({ route, navigation }) => {
  const { cellId } = route.params; // Recebe o id da célula a ser editada
  const { user} = useContext(AuthContext)
  const { control, setValue } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const [cellData, setCellData] = useState(null);


  useEffect(() => {
    const fetchOptions = async () => {
      try {
        
        // Carregar dados da célula
        const  {data}   = await api.get(`/api/reports/leader/${user?.id}`);
        setCellData(data);
        //Preencher os campos com os dados da célula
        if (data) {
          
          setValue('quantityMembers', data?.quantityMembers || 0);
          setValue('quantityAttendees', data?.quantityAttendees || 0);
          setValue('address', data?.address || '');
          setValue('phone', data?.phone || '');
          setValue('pastorId', data?.pastorId || '');
          setValue('cellPhase', data?.cellPhase || '');
          setValue('multiplicationDate', data?.multiplicationDate || '');
        }
        
      } catch (error) {
        console.error('Failed to fetch info celula', error);
      }
    };

    fetchOptions();
  }, [cellId]);

  // const onSubmit = async data => {
  //   try {
  //     await updateCell(cellId, data); // Atualizar célula
  //     Alert.alert('Célula atualizada com sucesso');
  //     navigation.goBack();
  //   } catch (error) {
  //     console.error('Erro ao atualizar célula', error);
  //     Alert.alert('Erro ao atualizar célula');
  //   }
  // };

  if (!cellData) {
        <LoadingScreen />;
  }

  return (
    <View style={styles.modalContainer}>
      <ScrollView>
        <Container>
          <Title>Editar Célula</Title>


          <Text style={styles.label}>Quantidade de Membros</Text>
          <Input control={control} name="quantityMembers" placeholder="Quantidade de Membros" keyboardType="numeric" secureTextEntry={undefined} />

          <Text style={styles.label}>Quantidade de Participantes</Text>
          <Input control={control} name="quantityAttendees" placeholder="Quantidade de Participantes" keyboardType="numeric" secureTextEntry={undefined} />

          <Text style={styles.label}>Endereço</Text>
          <Input control={control} name="address" placeholder="Endereço" keyboardType={undefined} secureTextEntry={undefined} />

          <Text style={styles.label}>Telefone</Text>
          <Input control={control} name="phone" placeholder="Telefone" keyboardType="numeric" secureTextEntry={undefined} />

          <Text style={styles.label}>Fase da Célula</Text>
          <Select control={control} name="cellPhase" options={[{ label: 'Início', value: 'Início' }, { label: 'Crescimento', value: 'Crescimento' }, { label: 'Multiplicação', value: 'Multiplicação' }]} placeholder="Fase" isDisabled={false} />

          <Text style={styles.label}>Data de Multiplicação</Text>
          <Input control={control} name="multiplicationDate" placeholder="Data de Multiplicação" keyboardType="default" secureTextEntry={undefined} />

          <View style={styles.buttonContainer}>
            {/* <Button title="Salvar" onPress={handleSubmit(onSubmit)} /> */}
            <Button title="Cancelar" onPress={() => navigation.goBack()} color="red" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditCellScreen;
