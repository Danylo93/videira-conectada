import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationsContext';
import theme from '../../styles/theme';
import Toast from 'react-native-toast-message';

interface HeaderProps {
  userName?: string;
  userPhoto?: string;
  onPress?: () => void;
  onPressNotifications?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, userPhoto, onPress, onPressNotifications }) => {
  const { notifications } = useNotifications();
  const unreadCount = notifications?.filter((notif) => !notif.read).length;
  const [isConnected, setIsConnected] = useState(true);

  const toggleStatus = () => {
    const newStatus = !isConnected;
    setIsConnected(newStatus);
    Toast.show({
      type: newStatus ? 'success' : 'error',
      text1: newStatus ? 'Online' : 'Offline',
      text2: `Voce esta ${newStatus ? 'online' : 'offline'} agora.`,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>Bem Vindo, {userName || 'Membro'}</Text>
      </View>

      <View style={styles.userPhotoContainer}>
        <Image source={{ uri: userPhoto || 'https://i.pravatar.cc/120' }} style={styles.photo} />
        <TouchableOpacity
          style={[styles.statusIndicator, { backgroundColor: isConnected ? 'green' : 'red' }]}
          onPress={toggleStatus}
        />
      </View>

      <View style={styles.iconsContainer}>
        {onPressNotifications ? (
          <TouchableOpacity onPress={onPressNotifications} style={styles.notificationsButton}>
            <Text style={styles.notificationsIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={onPress} style={styles.iconButton}>
          <Feather name="log-out" size={20} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: 30,
    backgroundColor: theme.COLORS.PURPLE_CARD,
  },
  userInfo: {
    flex: 1,
  },
  userPhotoContainer: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: 30,
    height: 30,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.COLORS.PURPLE_CARD,
  },
  notificationsButton: { position: 'relative' },
  notificationsIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 8, paddingHorizontal: 4 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
  },
});

export default Header;
