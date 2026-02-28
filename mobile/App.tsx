import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, Platform } from 'react-native';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from './src/context/UserContext';
import { DataProvider } from './src/context/DataContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import theme from './src/styles/theme';
import AppNavigator from './src/routes/AppNavigator';
import Toast from 'react-native-toast-message';

const App = () => {
  return (
    <><ThemeProvider theme={theme}>
      <AuthProvider>
        <NotificationsProvider>
          <DataProvider>
            <NavigationContainer>
              <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
                hidden={Platform.OS === 'ios'} />
              <AppNavigator />
            </NavigationContainer>
          </DataProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
    <Toast />
    </> 
  );
};

export default App;
