import styled from 'styled-components/native';

export const StyledInput = styled.TextInput`
  height: 40px;
  border: 1px solid ${props => (props.isFocused ? '#0056b3' : 'gray')};
  background-color: #ffffff; /* Fundo branco */
  margin-bottom: 12px;
  padding-horizontal: 8px;
  border-radius: 12px;
  font-size: 16px; 
  color: #000000;
`;

export const ErrorText = styled.Text`
  color: red;
  margin-bottom: 12px;
`;

export const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 16px;
`;

export const Title = styled.Text`
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
`;
