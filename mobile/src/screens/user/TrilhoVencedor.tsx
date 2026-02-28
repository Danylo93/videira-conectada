import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { api } from 'src/services/api';

const TrilhoVencedor: React.FC = () => {
  const [courses, setCourses] = useState<{ id: string; name: string; description: string }[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/api/courses'); // Substitua pela URL completa, se necessário.
        setCourses(response.data);
        console.log(response.data); // Assuma que a API retorna uma lista de objetos de curso.
      } catch (error) {
        console.error('Erro ao buscar os cursos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os cursos.');
      }
    };

    const fetchEnrolledCourses = async () => {
      try {
        const response = await api.get('/api/enrolled-courses'); // Supondo que essa rota retorne os cursos nos quais o usuário está inscrito.
        setEnrolledCourses(response.data.map((course: { name: string }) => course.name));
        console.log(response.data); // Assuma que a API retorna uma lista de objetos de curso.
      } catch (error) {
        console.error('Erro ao buscar os cursos inscritos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os cursos inscritos.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    fetchEnrolledCourses();
  }, []);

  const handleSubscribe = (courseName: string) => {
    Alert.alert('Inscrição', `Você se inscreveu com sucesso no curso ${courseName}!`);
    setEnrolledCourses([...enrolledCourses, courseName]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2d3748" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Trilho Vencedor</Text>
      <ScrollView style={styles.scrollView}>
        {courses.filter(course => !enrolledCourses.includes(course.name)).map((course) => (
          <View key={course.id} style={styles.courseContainer}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>
            {enrolledCourses.includes(course.name) ? (
              <TouchableOpacity style={styles.enrolledButton}>
                <Text style={styles.enrolledButtonText}>Você já está matriculado</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.subscribeButton} onPress={() => handleSubscribe(course.name)}>
                <Text style={styles.subscribeButtonText}>Inscrever-se</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    marginBottom: 60, // Espaço para o botão de inscrição
  },
  courseContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  courseDescription: {
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 10,
  },
  subscribeButton: {
    backgroundColor: '#2d3748',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  enrolledButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrolledButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TrilhoVencedor;