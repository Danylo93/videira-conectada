// src/components/LoadingScreen.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import theme from '../../styles/theme';  
const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${theme.COLORS.PURPLEDARK1};
  `;

const Message = styled.Text`
  margin-top: 20px;
  font-size: 18px;
  color: ${theme.COLORS.PURPLE2};  
`;

const LoadingScreen: React.FC = () => {
  return (
    <Container>
      <ActivityIndicator size="large" color={theme.COLORS.PURPLE2} />
      <Message>Carregando...</Message>
    </Container>
  );
};

export default LoadingScreen;
