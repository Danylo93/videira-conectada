// src/context/NotificationsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthContext from './UserContext';
import { getNotifications, markNotificationAsRead } from '../services/userService';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
}

interface NotificationsContextData {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  loadNotifications: (userId: number) => void; // Função para carregar notificações
}

const NotificationsContext = createContext<NotificationsContextData>({} as NotificationsContextData);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useContext(AuthContext);


  // Função para carregar notificações do backend
  const loadNotifications = async (userId: number) => {
    try {
      const fetchedNotifications = await getNotifications(userId);
      setNotifications((prev) => {
        // Evitar duplicatas ao adicionar novas notificações
        const existingIds = new Set(prev.map((notif) => notif.id));
        const newNotifications = fetchedNotifications.filter(
          (notif: Notification) => !existingIds.has(notif.id)
        );
        return [...prev, ...newNotifications];
      });
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  // Função para adicionar uma notificação manualmente
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  // Função para marcar uma notificação como lida
  const markAsRead = async (id: string) => {
    try {
      if (user && user?.id) {
        await markNotificationAsRead(user?.id, id);

        setNotifications((prev) =>
          prev.map((notif) => {
            if (notif.id === id) {
              return { ...notif, read: true };
            }
            return notif;
          })
        );

      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };
  

  // Função para limpar todas as notificações
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Carregar notificações assim que o componente for montado (exemplo de uso de userId)
  useEffect(() => {
    if (user && user?.id) {
      loadNotifications(user?.id);
    }
  }, [user]); // Recarrega notificações quando o "user" muda
  

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, markAsRead, clearNotifications, loadNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
