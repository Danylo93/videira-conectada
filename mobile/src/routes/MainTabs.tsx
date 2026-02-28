import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import AuthContext from '../context/UserContext';
import theme from '../styles/theme';
import { normalizeRole } from '../utils/role';

import HomeScreen from '../screens/user/HomeScreen';
import HomeDiscipuladorScreen from '../screens/user/HomeDiscipuladorScreen';
import HomeObreiroScreen from '../screens/user/HomeObreiroScreen';
import HomePastorScreen from '../screens/user/HomePastorScreen';
import DashboardUser from '../screens/DashboardUser';

import ReportsLeaderListScreen from '../screens/reports/ReportsLeaderListScreen';
import { ReportsListDiscScreen } from '../screens/reports/ReportsListDiscScreen';
import { ReportsListObreirocScreen } from '../screens/reports/ReportsListObreirocScreen';
import ReportsListPastorScreen from '../screens/reports/ReportsListPastorScreen';

import EdificacaoScreen from '../screens/user/EdificacaoScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import ManagementHubScreen from '../screens/management/ManagementHubScreen';

const Tab = createBottomTabNavigator();

const tabIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home-outline',
  Gestao: 'grid-outline',
  Relatorios: 'document-text-outline',
  Edificacao: 'book-outline',
  Perfil: 'person-outline',
};

const MainTabs = () => {
  const { user } = useContext(AuthContext);
  const role = normalizeRole(user?.role);
  const isMember = role === 'membro' || role === null;

  const HomeComponent =
    role === 'pastor'
      ? HomePastorScreen
      : role === 'obreiro'
      ? HomeObreiroScreen
      : role === 'discipulador'
      ? HomeDiscipuladorScreen
      : role === 'lider'
      ? HomeScreen
      : DashboardUser;

  const ReportsComponent =
    role === 'pastor'
      ? ReportsListPastorScreen
      : role === 'obreiro'
      ? ReportsListObreirocScreen
      : role === 'discipulador'
      ? ReportsListDiscScreen
      : ReportsLeaderListScreen;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: true,
        tabBarInactiveTintColor: theme.COLORS.PURPLEDARK1,
        tabBarActiveTintColor: theme.COLORS.PURPLE2,
        tabBarLabelStyle: {
          fontSize: 11,
          color: theme.COLORS.PURPLEDARK1,
        },
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 7,
          backgroundColor: theme.COLORS.GRAY6,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIconMap[route.name] || 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeComponent} options={{ headerShown: false }} />
      {!isMember && (
        <Tab.Screen name="Gestao" component={ManagementHubScreen} options={{ headerShown: false }} />
      )}
      {!isMember && (
        <Tab.Screen name="Relatorios" component={ReportsComponent} options={{ headerShown: false }} />
      )}
      {!isMember && (
        <Tab.Screen name="Edificacao" component={EdificacaoScreen} options={{ headerShown: false }} />
      )}
      {!isMember && (
        <Tab.Screen name="Perfil" component={ProfileScreen} options={{ headerShown: false }} />
      )}
    </Tab.Navigator>
  );
};

export default MainTabs;
