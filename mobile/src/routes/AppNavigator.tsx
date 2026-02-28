import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthContext from '../context/UserContext';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EditCellScreen from '../screens/cell/EditCellScreen';
import CellDetailsScreen from '../screens/cell/CellDetailsScreen';
import ReportScreen from '../screens/reports/ReportScreen';
import PalavraScreen from '../screens/bible/PalavrasScreen';
import TrilhoVencedor from '../screens/user/TrilhoVencedor';
import LeituraBiblica from '../screens/bible/LeituraBiblica';
import SendReportScreen from '../screens/reports/SendReportScreen';
import DK from '../screens/user/DK';
import ScreenQRCodeScanner from '../screens/user/ScreenQRCodeScanner';
import RL from '../screens/user/RL';
import CellGroupMap from '../screens/user/MapaDasCelulas';
import CadastrarCelula from '../screens/user/CadastrarCelula';
import FinancialManagementScreen from '../screens/management/FinancialManagementScreen';
import SchedulesManagementScreen from '../screens/management/SchedulesManagementScreen';
import BaptismManagementScreen from '../screens/management/BaptismManagementScreen';
import EncounterEventsManagementScreen from '../screens/management/EncounterEventsManagementScreen';
import DizimistasManagementScreen from '../screens/management/DizimistasManagementScreen';
import AgendaManagementScreen from '../screens/management/AgendaManagementScreen';
import theme from '../styles/theme';
import { normalizeRole } from '../utils/role';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const isMember = role === 'membro' || role === null;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          {!isMember && (
            <>
              <Stack.Screen
                name="EditCellScreen"
                component={EditCellScreen}
                options={{ title: 'Editar Relatorio' }}
              />
              <Stack.Screen
                name="CellDetailsScreen"
                component={CellDetailsScreen}
                options={{
                  title: 'Detalhes da Celula',
                  headerBackTitleVisible: true,
                  headerTintColor: theme.COLORS.PURPLEDARK1,
                }}
              />
              <Stack.Screen name="CreateReport" component={ReportScreen} options={{ title: 'Criar Relatorio' }} />
              <Stack.Screen name="SendReport" component={SendReportScreen} options={{ title: 'Enviar Relatorio' }} />
              <Stack.Screen name="Palavras" component={PalavraScreen} options={{ title: 'Palavras' }} />
              <Stack.Screen
                name="TrilhoVencedor"
                component={TrilhoVencedor}
                options={{ title: 'Confira o nosso Trilho do Vencedor' }}
              />
              <Stack.Screen name="BibleReading" component={LeituraBiblica} options={{ title: 'Leitura Biblica' }} />
              <Stack.Screen name="DK" component={DK} options={{ title: 'Domingo Kids' }} />
              <Stack.Screen name="RL" component={RL} options={{ title: 'Radicais Livres Itaquera' }} />
              <Stack.Screen name="CellGroupMap" component={CellGroupMap} options={{ title: 'Mapa das Celulas' }} />
              <Stack.Screen name="CadastrarCelula" component={CadastrarCelula} options={{ title: 'Cadastrar Celula' }} />
              <Stack.Screen
                name="FinancialManagement"
                component={FinancialManagementScreen}
                options={{ title: 'Financeiro' }}
              />
              <Stack.Screen
                name="SchedulesManagement"
                component={SchedulesManagementScreen}
                options={{ title: 'Escalas' }}
              />
              <Stack.Screen
                name="BaptismManagement"
                component={BaptismManagementScreen}
                options={{ title: 'Batismo' }}
              />
              <Stack.Screen
                name="EncounterEventsManagement"
                component={EncounterEventsManagementScreen}
                options={{ title: 'Encontro com Deus' }}
              />
              <Stack.Screen
                name="DizimistasManagement"
                component={DizimistasManagementScreen}
                options={{ title: 'Dizimistas' }}
              />
              <Stack.Screen
                name="AgendaManagement"
                component={AgendaManagementScreen}
                options={{ title: 'Agenda' }}
              />
              <Stack.Screen
                name="Retirada Kids"
                component={ScreenQRCodeScanner}
                options={{ title: 'Domingo Kids' }}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: 'Cadastro',
              headerTintColor: theme.COLORS.PURPLEDARK1,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
