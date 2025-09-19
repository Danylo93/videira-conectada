// Development version of notifications that work without migrations
// This file provides mock implementations for local testing

export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

// Mock notifications for development
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'mock-notification-1',
    tenant_id: 'mock-tenant-id',
    user_id: 'mock-user-id',
    type: 'info',
    title: 'Bem-vindo ao sistema!',
    message: 'Seu sistema está configurado e funcionando perfeitamente.',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'mock-notification-2',
    tenant_id: 'mock-tenant-id',
    user_id: 'mock-user-id',
    type: 'success',
    title: 'Assinatura Ativa',
    message: 'Sua assinatura está ativa e funcionando normalmente.',
    read: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'mock-notification-3',
    tenant_id: 'mock-tenant-id',
    user_id: 'mock-user-id',
    type: 'warning',
    title: 'Relatório Pendente',
    message: 'O relatório da Célula Central está pendente há 3 dias.',
    read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
]

/**
 * Mock function to get notifications for current user
 */
export async function getUserNotifications(limit: number = 50): Promise<Notification[]> {
  if (process.env.NODE_ENV === 'development') {
    return MOCK_NOTIFICATIONS.slice(0, limit)
  }
  return []
}

/**
 * Mock function to get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  if (process.env.NODE_ENV === 'development') {
    return MOCK_NOTIFICATIONS.filter(n => !n.read).length
  }
  return 0
}

/**
 * Mock function to mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    // In a real implementation, this would update the database
    console.log(`Mock: Marking notification ${notificationId} as read`)
    return true
  }
  return false
}

/**
 * Mock function to mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Mock: Marking all notifications as read')
    return true
  }
  return false
}

/**
 * Mock function to create notification
 */
export async function createNotification(
  userId: string,
  template: any
): Promise<Notification | null> {
  if (process.env.NODE_ENV === 'development') {
    const notification: Notification = {
      id: `mock-notification-${Date.now()}`,
      tenant_id: 'mock-tenant-id',
      user_id: userId,
      type: template.type === 'billing_expiring' || template.type === 'report_overdue' ? 'warning' : 'info',
      title: template.title,
      message: template.message,
      data: template.data,
      read: false,
      created_at: new Date().toISOString(),
    }
    
    MOCK_NOTIFICATIONS.unshift(notification)
    return notification
  }
  return null
}

/**
 * Mock function to create tenant notification
 */
export async function createTenantNotification(template: any): Promise<number> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Mock: Creating tenant notification: ${template.title}`)
    return 1
  }
  return 0
}
