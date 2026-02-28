import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 16px;
`;

export const StyledInput = styled.TextInput`
  height: 40px;
  border: 1px solid gray;
  margin-bottom: 12px;
  padding-horizontal: 8px;
  border-radius: 12px;
`;

export const SelectContainer = styled.View`
  height: 40px;
  border: 1px solid gray;
  margin-bottom: 12px;
  border-radius: 12px;
`;

export const ErrorText = styled.Text`
  color: red;
  margin-bottom: 12px;
`;

export const Title = styled.Text`
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
`;
