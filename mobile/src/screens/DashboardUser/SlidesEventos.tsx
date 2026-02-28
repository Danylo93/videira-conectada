import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import styles from './styles';

const { width: screenWidth } = Dimensions.get('window');

function getStartDate(evento: any): string {
  return evento?.startDate || evento?.eventDate || evento?.event_date || '';
}

function getEndDate(evento: any): string {
  return evento?.endDate || evento?.eventDate || evento?.event_date || getStartDate(evento);
}

const SlidesEventos = ({ eventos }: { eventos: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [eventUrl, setEventUrl] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const currentDate = new Date();

  const visibleEvents = (eventos || [])
    .filter((evento) => {
      const endDate = new Date(getEndDate(evento));
      return !Number.isNaN(endDate.getTime()) && endDate >= currentDate;
    })
    .sort((a, b) => new Date(getStartDate(a)).getTime() - new Date(getStartDate(b)).getTime());

  const handleScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(offsetX / screenWidth));
  };

  const handleSubscribe = (url: string) => {
    if (!url) return;
    setEventUrl(url);
    setModalVisible(true);
  };

  if (visibleEvents.length === 0) {
    return (
      <View style={styles.slidesContainer}>
        <Text style={styles.sectionTitle}>Eventos</Text>
        <View style={[styles.eventCard, { width: screenWidth - 24 }]}> 
          <Text style={styles.eventTitle}>Sem eventos ativos no momento.</Text>
          <Text style={styles.eventDate}>Puxe para baixo para atualizar.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.slidesContainer}>
      <Text style={styles.sectionTitle}>Eventos</Text>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={handleScroll}
        contentContainerStyle={styles.slidesContent}
      >
        {visibleEvents.map((evento) => {
          const timeZone = 'America/Sao_Paulo';
          const inicioEvent = fromZonedTime(new Date(getStartDate(evento)), timeZone);
          const endEvent = fromZonedTime(new Date(getEndDate(evento)), timeZone);
          const formattedDateInicio = format(inicioEvent, 'dd/MM/yyyy');
          const formattedDateFim = format(endEvent, 'dd/MM/yyyy');

          return (
            <View key={evento.id} style={[styles.eventCard, { width: screenWidth }]}> 
              <Image
                source={{
                  uri:
                    evento.image ||
                    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=60',
                }}
                style={styles.eventImage}
              />
              <Text style={styles.eventTitle}>{evento.name}</Text>
              <Text style={styles.eventDate}>De: {formattedDateInicio} a {formattedDateFim}</Text>
              {!!evento.location && <Text style={styles.eventDate}>Local: {evento.location}</Text>}

              {!!evento.formUrl && (
                <TouchableOpacity style={styles.subscribeButton} onPress={() => handleSubscribe(evento.formUrl)}>
                  <Text style={styles.subscribeButtonText}>Inscreva-se</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.pagination}>
        {visibleEvents.map((_, index) => (
          <View key={index} style={[styles.paginationDot, currentIndex === index && styles.activeDot]} />
        ))}
      </View>

      <Modal visible={isModalVisible} transparent={false} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: eventUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color="#0000ff"
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              />
            )}
          />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={{ position: 'absolute', top: 20, right: 20 }}>
            <Text style={{ color: '#0000ff' }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default SlidesEventos;
