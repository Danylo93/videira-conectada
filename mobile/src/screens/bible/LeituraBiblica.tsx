import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styled from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f9f9fb;
  padding: 20px;
`;

const Title = styled.Text`
  font-size: 26px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  text-align: center;
`;

const Versiculo = styled.Text`
  font-size: 20px;
  color: #4a4a4a;
  font-style: italic;
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 5px;
`;

const DevocionalText = styled.Text`
  font-size: 18px;
  color: #333;
  line-height: 24px;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f0f0f0;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 30px;
`;

const Button = styled.TouchableOpacity`
  background-color: #7c4dff;
  padding: 12px 20px;
  border-radius: 5px;
  width: 45%;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

const MarkAsReadButton = styled.TouchableOpacity`
  background-color: #4caf50;
  padding: 12px 20px;
  border-radius: 5px;
  margin-top: 20px;
  align-self: center;
  width: 80%;
`;

const MarkAsReadButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

const ErrorText = styled.Text`
  color: #f44336;
  font-size: 16px;
  text-align: center;
  margin-top: 20px;
`;

const SelectBookContainer = styled.View`
  margin-bottom: 20px;
`;

const SelectBookLabel = styled.Text`
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
`;

const BookPicker = styled(Picker)`
  background-color: white;
  padding: 10px;
  border-radius: 5px;
`;

const LeituraBiblica: React.FC = () => {
  const [devocionais, setDevocionais] = useState<any[]>([]); // Lista de devocionais
  const [currentChapter, setCurrentChapter] = useState<number>(1); // Capítulo atual
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0); // Índice do versículo atual
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [readStatus, setReadStatus] = useState<boolean>(false); // Status de "lido"
  const [selectedBook, setSelectedBook] = useState<string>('João'); // Livro selecionado

  const books = [
    'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes', 'Rute',
    '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias',
    'Ester', 'Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cânticos', 'Isaías', 'Jeremias',
    'Lamentações', 'Ezequiel', 'Daniel', 'Oséias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miquéias',
    'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias', 'Mateus', 'Marcos', 'Lucas',
    'João', 'Atos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses',
    'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito',
    'Filemon', 'Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas', 'Apocalipse'
  ];

  const fetchVerses = async (book: string, chapter: number) => {
    try {
      setLoading(true);
      setError(null);

      // Usando a Bible API para buscar os versículos de um capítulo
      const response = await axios.get(
        `https://bible-api.com/${book}+${chapter}?translation=almeida`
      );

      setDevocionais(response.data.verses);
    } catch (error) {
      setError('Erro ao carregar os versículos. Tente novamente mais tarde.');
      console.error('Erro ao buscar versículos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBook) {
      fetchVerses(selectedBook, currentChapter);
    }
  }, [selectedBook, currentChapter]);

  useEffect(() => {
    const checkReadStatus = async () => {
      const status = await AsyncStorage.getItem(`devocional_${selectedBook}_${currentChapter}_${currentVerseIndex}_read`);
      setReadStatus(status === 'true');
    };

    checkReadStatus();
  }, [selectedBook, currentChapter, currentVerseIndex]);

  const handleMarkAsRead = async () => {
    setReadStatus(true);
    await AsyncStorage.setItem(`devocional_${selectedBook}_${currentChapter}_${currentVerseIndex}_read`, 'true');
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < devocionais.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    }
  };

  const handlePreviousVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
    }
  };

  const handleNextChapter = () => {
    setCurrentChapter(currentChapter + 1);
    setCurrentVerseIndex(0); // Volta para o primeiro versículo do próximo capítulo
  };

  const handlePreviousChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
      setCurrentVerseIndex(0); // Volta para o primeiro versículo do capítulo anterior
    }
  };

  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#7c4dff" />
      </Container>
    );
  }

  const currentDevocional = devocionais[currentVerseIndex];

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SelectBookContainer>
          <BookPicker
            selectedValue={selectedBook}
            onValueChange={(itemValue) => setSelectedBook(itemValue)}
          >
            {books.map((book, index) => (
              <Picker.Item key={index} label={book} value={book} />
            ))}
          </BookPicker>
        </SelectBookContainer>

        {error ? (
          <ErrorText>{error}</ErrorText>
        ) : currentDevocional ? (
          <>
            <Title>{selectedBook} - Capítulo {currentChapter}</Title>
            <Versiculo style={readStatus ? styles.versiculoLido : null}>
              {currentDevocional.book_name} {currentDevocional.chapter}:{currentDevocional.verse}
            </Versiculo>
            <DevocionalText>{currentDevocional.text}</DevocionalText>

            {!readStatus && (
              <MarkAsReadButton onPress={handleMarkAsRead}>
                <MarkAsReadButtonText>Marcar como Lido</MarkAsReadButtonText>
              </MarkAsReadButton>
            )}

            <ButtonContainer>
              <Button onPress={handlePreviousVerse}>
                <ButtonText>Versículo Anterior</ButtonText>
              </Button>
              <Button onPress={handleNextVerse}>
                <ButtonText>Próximo Versículo</ButtonText>
              </Button>
            </ButtonContainer>

            <ButtonContainer>
              <Button onPress={handlePreviousChapter}>
                <ButtonText>Capítulo Anterior</ButtonText>
              </Button>
              <Button onPress={handleNextChapter}>
                <ButtonText>Próximo Capítulo</ButtonText>
              </Button>
            </ButtonContainer>
          </>
        ) : (
          <ErrorText>Ocorreu um erro ao carregar os devocionais.</ErrorText>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  versiculoLido: {
    backgroundColor: '#d3ffd3',
  },
});

export default LeituraBiblica;