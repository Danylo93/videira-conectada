import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } from '@env';
import styles from './styles';

const MAX_RESULTS = 6;
const CACHE_KEY = 'videos_live';

type YoutubeItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    thumbnails?: {
      medium?: { url?: string };
    };
  };
};

async function fetchYoutubeVideos(params: Record<string, string | number | undefined>) {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params,
  });

  return (response.data?.items || []) as YoutubeItem[];
}

const VideoCarousel = () => {
  const [videos, setVideos] = useState<YoutubeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  const canLoadYoutube = useMemo(() => {
    return Boolean(YOUTUBE_API_KEY && YOUTUBE_CHANNEL_ID);
  }, []);

  const handleVideoPress = (videoId: string) => {
    setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
    setModalVisible(true);
  };

  const fetchVideos = async () => {
    setLoading(true);

    try {
      if (!canLoadYoutube) {
        const cachedVideos = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedVideos) {
          setVideos(JSON.parse(cachedVideos));
        } else {
          setVideos([]);
        }
        return;
      }

      const baseParams = {
        key: YOUTUBE_API_KEY,
        channelId: YOUTUBE_CHANNEL_ID,
        part: 'snippet',
        maxResults: MAX_RESULTS,
        type: 'video',
      };

      const liveItems = await fetchYoutubeVideos({
        ...baseParams,
        eventType: 'live',
        order: 'date',
      });

      const parsedLive = liveItems.filter((item) => item?.id?.videoId);
      if (parsedLive.length > 0) {
        setVideos(parsedLive);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsedLive));
        return;
      }

      const latestItems = await fetchYoutubeVideos({
        ...baseParams,
        order: 'date',
      });

      const parsedLatest = latestItems.filter((item) => item?.id?.videoId);
      setVideos(parsedLatest);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsedLatest));
    } catch (error) {
      const cachedVideos = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedVideos) {
        setVideos(JSON.parse(cachedVideos));
      } else {
        setVideos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#5B21B6" />;
  }

  return (
    <View style={styles.slidesContainer}>
      <Text style={styles.sectionTitle}>Videos ao vivo e ultimos cultos</Text>

      {!canLoadYoutube && videos.length === 0 && (
        <View style={styles.videoEmptyState}>
          <Text style={styles.videoEmptyTitle}>Canal de video nao configurado</Text>
          <Text style={styles.videoEmptyText}>
            Configure `YOUTUBE_API_KEY` e `YOUTUBE_CHANNEL_ID` no arquivo `.env` do mobile.
          </Text>
        </View>
      )}

      {videos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slidesContent}>
          {videos.map((video, index) => {
            const rawVideoId = video?.id?.videoId;
            const videoId = rawVideoId || `video-${index}`;
            const thumbnail = video?.snippet?.thumbnails?.medium?.url;
            const title = video?.snippet?.title || 'Video';

            return (
              <View key={videoId} style={styles.videoCard}>
                <Image
                  source={{
                    uri:
                      thumbnail ||
                      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=60',
                  }}
                  style={styles.videoThumbnail}
                />
                <Text style={styles.videoTitle}>{title}</Text>
                {!!rawVideoId && (
                  <TouchableOpacity style={styles.watchButton} onPress={() => handleVideoPress(rawVideoId)}>
                    <Text style={styles.watchButtonText}>Assistir</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {isModalVisible && (
        <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.webviewContainer}>
              <WebView source={{ uri: videoUrl }} style={styles.webview} />
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default VideoCarousel;
