import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type NotificationType =
  | 'APPLICATION_SUBMITTED' | 'APPLICATION_STATUS_CHANGED'
  | 'FIRM_VERIFIED' | 'FIRM_REJECTED' | 'CREDIT_PURCHASED'
  | 'INVITATION_RECEIVED' | 'INVITATION_RESPONSE' | 'GENERAL'

export interface Notification {
  id: string; user_id: string; type: NotificationType
  title: string; message: string; isRead: boolean
  link: string | null; createdAt: string
}

export function useNotifications() {
  return useQuery<{ data: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
