import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import styled from 'styled-components/native';
import theme from '../../styles/theme';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.COLORS.PURPLE} ;
  padding: 20px;
  
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: ${theme.COLORS.WHITE};
  margin-bottom: 30px;
  text-align: center;
`;

const Grid = styled.View`
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 10px;
`;

const ButtonWrapper = styled.TouchableOpacity`
  width: 48%;
  height: 150px;
  margin-bottom: 15px;
  border-radius: 10px;
  overflow: hidden;
`;

const BackgroundImage = styled.ImageBackground`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ContainerCourse = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${theme.COLORS.PURPLE_CARD};
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
`;

const RL: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <Container>

      <Grid>
        
        <ButtonWrapper onPress={() => navigation.navigate('BibleReading')}>
          <BackgroundImage source={require('../../../assets/radnews.jpg')} resizeMode="cover">
          </BackgroundImage>
        </ButtonWrapper>

        

      

        

       
      </Grid>
    </Container>
  );
};

export default RL;

