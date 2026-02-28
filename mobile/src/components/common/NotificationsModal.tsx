import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNotifications } from '../../context/NotificationsContext';

const NotificationsModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { notifications, markAsRead, clearNotifications } = useNotifications();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Notificações</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => markAsRead(item.id)}
              >
                <Text style={[styles.notificationTitle, item.read && styles.read]}>
                  {item.title}
                </Text>
                <Text>{item.message}</Text>
              </TouchableOpacity>
            )}
          />
          {/* <TouchableOpacity onPress={clearNotifications} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpar Todas</Text>
          </TouchableOpacity> */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 8, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  notificationItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  notificationTitle: { fontSize: 16, fontWeight: 'bold' },
  read: { color: 'gray', textDecorationLine: 'line-through' },
  clearButton: { marginTop: 16, alignSelf: 'center' },
  clearButtonText: { color: 'red' },
  closeButton: { marginTop: 16, alignSelf: 'center' },
  closeButtonText: { fontWeight: 'bold' },
});

export default NotificationsModal;
