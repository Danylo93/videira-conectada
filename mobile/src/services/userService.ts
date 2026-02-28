import { api } from "./api";

export const getNotifications = async (userId: number) => {
  try {
    const response = await api.get(`/api/notifications/${userId}`);
    return response.data.notifications;
  } catch (error) {
    console.error('Erro ao buscar notificações', error);
    return [];
  }
};

export const markNotificationAsRead = async (userId: number, notificationId: string) => {
  try {
    const response = await api.patch(`/api/notifications/${userId}/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw new Error('Falha ao marcar notificação como lida');
  }
};

