import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
  FlatList,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';

import LoadingScreen from '../../components/common/LoadingScreen';
import theme from '../../styles/theme';
import { api } from '../../services/api';
import AuthContext from '../../context/UserContext';
import AddMemberModal from './AddMemberModal';
import CreateUserModal from '../../components/modals/CreateUserModal';
import EditUserProfileModal from '../../components/modals/EditUserProfileModal';
import CreateEvent from '../../components/modals/CreateEvent';
import SendEsbocoPalavra from '../../components/modals/SendEsboco';
import Toast from 'react-native-toast-message';
import { normalizeRole, roleLabel } from '../../utils/role';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState(false);
  const [sendEsbocoPalavraVisible, setSendEsbocoPalavraVisible] = useState(false);


  const [createUserModalVisible, setCreateUserModalVisible] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { user , logoutUser} = useContext(AuthContext);
  const userRole = normalizeRole(user?.role);
  const profileRole = normalizeRole(userData?.role);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, permission] = await Promise.all([
          api.get(`/api/users/${user?.id}/details`),
          ImagePicker.requestMediaLibraryPermissionsAsync(),
        ]);
  
        if (permission.status !== 'granted') {
          Alert.alert('PermissÃµes', 'Precisamos de permissÃµes para acessar a galeria!');
        }
  
        setUserData(userResponse.data);
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'NÃ£o foi possÃ­vel carregar os dados do usuÃ¡rio.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    if (route.params?.toastMessage) {
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: route.params.toastMessage,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50,
      });
    }
  }, [route.params?.toastMessage]);
  

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('PermissÃµes', 'Precisamos de permissÃµes para acessar a galeria!');
      }
    };
    requestPermission();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  // Definir foto do usuÃ¡rio
  const userPhoto = userData?.photo || 'https://via.placeholder.com/150';

  // Handlers
  const handleLogout = () => {
    Alert.alert('Deslogar', 'VocÃª tem certeza que deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: logoutUser},
    ]);
  };

const selectPhoto = async () => {
  // Abre a galeria para selecionar uma imagem
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  // Se o usuÃ¡rio selecionou uma foto
  if (!result.canceled && result.assets && result.assets.length > 0) {
    const newPhotoUri = result.assets[0].uri;

    try {
      const formData = new FormData();

      // FormData precisa de uma estrutura especÃ­fica para o arquivo
      formData.append('photo', {
        uri: newPhotoUri,
        type: 'image/jpeg', // Ajuste conforme o tipo da sua imagem
        name: 'profile.jpg', // Nome do arquivo
      });

      // Envia o FormData para a API (no backend)
      const response = await api.put(
        `/api/users/${user?.id}/photo`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Informa que estamos enviando um arquivo
          },
        }
      );

      // A URL da nova foto retornada pela API apÃ³s o upload no S3
      const updatedPhotoUrl = response.data.url;

      // Atualiza o estado do usuÃ¡rio com a nova URL da foto
      setUserData((prevUser) => ({ ...prevUser, photo: updatedPhotoUrl }));

      Toast.show({
        type: 'success',
        text1: 'Foto de Perfil',
        text2: 'Foto atualizada com sucesso.',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50,
      });
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao atualizar foto',
        text2: 'NÃ£o foi possÃ­vel atualizar a foto de perfil.',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 50,
      });
    }
  }
};


  const handleNavigateToReport = (route: string) => navigation.navigate(route);

  // RenderizaÃ§Ã£o Condicional
  const renderRoleSpecificData = () => {
    if (userRole === 'lider') {
      return (
        <>

         {/* Dados BÃ¡sicos */}
         

          <Text style={styles.network}>Pastor: {userData?.pastor?.name || 'NÃ£o disponÃ­vel'}</Text>
          <Text style={styles.network}>Obreiro: {userData?.obreiro?.name || 'NÃ£o disponÃ­vel'}</Text>
          <Text style={styles.network}>Discipulador: {userData?.discipulador?.name || 'NÃ£o disponÃ­vel'}</Text>
        </>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
      contentContainerStyle={styles.container}
  data={[]}
  ListHeaderComponent={
    <>
      {/* Foto do UsuÃ¡rio */}
      <TouchableOpacity style={styles.photoContainer} onPress={selectPhoto}>
        <Image source={{ uri: userPhoto }} style={styles.photo} />
        <Text style={styles.changePhotoText}>Alterar Foto</Text>
      </TouchableOpacity>

      <Text style={styles.userName}>
        {userRole === 'pastor' ? `Pr. ${user.name}` : user.name || 'Nome nÃ£o disponÃ­vel'}
      </Text>
      <Text style={styles.role}>{roleLabel(user?.role)}</Text>
      <Text style={styles.network}>EndereÃ§o: {userData?.address || 'NÃ£o disponÃ­vel'}</Text>
      <Text style={styles.network}>Email: {user?.email || 'NÃ£o disponÃ­vel'}</Text>
      <Text style={styles.network}>Whatsapp: {userData?.phone || 'NÃ£o disponÃ­vel'}</Text>

      {userRole === 'obreiro' ? (
        <Text style={styles.network}>
          Pastor: {userData?.pastor?.name || 'NÃ£o disponÃ­vel'}
        </Text>
      ) : null}

      {renderRoleSpecificData()}
    </>
  }
  ListFooterComponent={
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={() => setEditModalVisible(true)}>
        <Text style={styles.buttonText}>Editar UsuÃ¡rio</Text>
      </TouchableOpacity>

      {profileRole === 'lider' && (
        <TouchableOpacity style={styles.button} onPress={() => handleNavigateToReport('CreateReport')}>
          <Text style={styles.buttonText}>Entregar RelatÃ³rio de CÃ©lula</Text>
        </TouchableOpacity>
      )}

      {profileRole === 'lider' && (
        <TouchableOpacity style={styles.button2} onPress={() => setAddMemberModalVisible(true)}>
          <Text style={styles.buttonText}>Adicionar Membro</Text>
        </TouchableOpacity>
      )}

      {profileRole === 'pastor' && (
        <TouchableOpacity style={styles.button2} onPress={() => setCreateEventModalVisible(true)}>
          <Text style={styles.buttonText}>Criar Evento</Text>
        </TouchableOpacity>
      )}

      {profileRole === 'pastor' && (
        <TouchableOpacity style={styles.button2} onPress={() => setSendEsbocoPalavraVisible(true)}>
          <Text style={styles.buttonText}>Enviar EsboÃ§o da Palavra</Text>
        </TouchableOpacity>
      )}

      {userRole === 'discipulador' && (
        <TouchableOpacity style={styles.button} onPress={() => handleNavigateToReport('CadastrarCelula')}>
          <Text style={styles.buttonText}>Cadastrar uma CÃ©lula no Mapa</Text>
        </TouchableOpacity>
      )}

      {/* {user.role !== 'LÃ­der' && 'membro' && (
        <TouchableOpacity style={styles.button} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.buttonText}>Criar UsuÃ¡rio</Text>
        </TouchableOpacity>
      )} */}

      <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  }
  keyExtractor={(item, index) => index.toString()} // Apenas para evitar erros no FlatList
  renderItem={() => null}
/>

      {/* Modais */}
<Modal visible={createUserModalVisible} transparent={true} animationType="slide" onRequestClose={() => setCreateUserModalVisible(false)}>
  <View style={styles.modalContainer}>
    <CreateUserModal modalVisible={createUserModalVisible} closeModal={() => setCreateUserModalVisible(false)} />
  </View>
</Modal>

<Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
  <View style={styles.modalContainer}>
    <EditUserProfileModal modalVisible={editModalVisible} closeModal={() => setEditModalVisible(false)} />
  </View>
</Modal>

<Modal visible={addMemberModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAddMemberModalVisible(false)}>
  <View style={styles.modalContainer}>
    <AddMemberModal modalVisible={addMemberModalVisible} closeModal={() => setAddMemberModalVisible(false)} />
  </View>
</Modal>

<Modal visible={createEventModalVisible} transparent={true} animationType="slide" onRequestClose={() => setCreateEventModalVisible(false)}>
  <View style={styles.modalContainer}>
    <CreateEvent modalVisible={createEventModalVisible} closeModal={() => setCreateEventModalVisible(false)} />
  </View>
</Modal>

<Modal visible={sendEsbocoPalavraVisible} transparent={true} animationType="slide" onRequestClose={() => setSendEsbocoPalavraVisible(false)}>
  <View style={styles.modalContainer}>
    <SendEsbocoPalavra modalVisible={sendEsbocoPalavraVisible} closeModal={() => setSendEsbocoPalavraVisible(false)} />
  </View>
</Modal>



    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 20 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#ccc' },
  changePhotoText: { marginTop: 10, color: '#007bff', fontSize: 16 },
  userName: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  role: { fontSize: 18, textAlign: 'center', color: '#888', marginBottom: 10 },
  network: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 5 },
  buttonContainer: { marginTop: 20 },
  button: {
    backgroundColor: theme.COLORS.PURPLEDARK1,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  button2: {
    backgroundColor: theme.COLORS.PURPLE,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semitransparente
  },
  buttonLogout: { backgroundColor: 'red', paddingVertical: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;





