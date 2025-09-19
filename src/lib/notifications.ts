import { createClient } from '@/lib/supabase/server'
import { getTenantFromRequest } from '@/lib/tenant'

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

export interface NotificationTemplate {
  type: 'billing_expiring' | 'report_overdue' | 'event_reminder' | 'member_birthday' | 'system_update'
  title: string
  message: string
  data?: any
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(
  userId: string,
  template: NotificationTemplate
): Promise<Notification | null> {
  const supabase = await createClient()
  const tenant = await getTenantFromRequest()
  
  if (!tenant) {
    return null
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      tenant_id: tenant.id,
      user_id: userId,
      type: template.type === 'billing_expiring' || template.type === 'report_overdue' ? 'warning' : 'info',
      title: template.title,
      message: template.message,
      data: template.data,
      read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return null
  }

  return data as Notification
}

/**
 * Create notifications for all users in a tenant
 */
export async function createTenantNotification(
  template: NotificationTemplate
): Promise<number> {
  const supabase = await createClient()
  const tenant = await getTenantFromRequest()
  
  if (!tenant) {
    return 0
  }

  // Get all users in the tenant
  const { data: users } = await supabase
    .from('profile_tenants')
    .select('profile_id')
    .eq('tenant_id', tenant.id)

  if (!users || users.length === 0) {
    return 0
  }

  // Create notifications for each user
  const notifications = users.map(user => ({
    tenant_id: tenant.id,
    user_id: user.profile_id,
    type: template.type === 'billing_expiring' || template.type === 'report_overdue' ? 'warning' : 'info',
    title: template.title,
    message: template.message,
    data: template.data,
    read: false,
  }))

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) {
    console.error('Error creating tenant notifications:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Get notifications for current user
 */
export async function getUserNotifications(limit: number = 50): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data as Notification[]
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<number> {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .select('id')

  if (error) {
    console.error('Error cleaning up old notifications:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  billing_expiring: {
    type: 'billing_expiring' as const,
    title: 'Assinatura Expirando',
    message: 'Sua assinatura expira em {days} dias. Renove para continuar usando o sistema.',
  },
  billing_expired: {
    type: 'billing_expiring' as const,
    title: 'Assinatura Expirada',
    message: 'Sua assinatura expirou. Renove para continuar usando o sistema.',
  },
  report_overdue: {
    type: 'report_overdue' as const,
    title: 'Relatório em Atraso',
    message: 'O relatório da célula {cellName} está em atraso. Envie o relatório o quanto antes.',
  },
  event_reminder: {
    type: 'event_reminder' as const,
    title: 'Lembrete de Evento',
    message: 'O evento "{eventName}" acontece em {time}. Não esqueça!',
  },
  member_birthday: {
    type: 'member_birthday' as const,
    title: 'Aniversário de Membro',
    message: 'Hoje é aniversário de {memberName}. Que tal enviar uma mensagem?',
  },
  system_update: {
    type: 'system_update' as const,
    title: 'Atualização do Sistema',
    message: 'O sistema foi atualizado com novas funcionalidades. Confira!',
  },
} as const

/**
 * Helper function to format notification message with data
 */
export function formatNotificationMessage(template: NotificationTemplate, data: Record<string, any>): string {
  let message = template.message
  
  Object.entries(data).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(value))
  })
  
  return message
}
