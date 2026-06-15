import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { secureStorage } from '@/utils/secureStorage'

export type NotificationType =
  | 'APPLICATION_SUBMITTED' | 'APPLICATION_STATUS_CHANGED'
  | 'FIRM_VERIFIED' | 'FIRM_REJECTED' | 'CREDIT_PURCHASED'
  | 'INVITATION_RECEIVED' | 'INVITATION_RESPONSE' | 'GENERAL'

export type NotificationContext = 'FIRM' | 'WORKSPACE'

export interface Notification {
  id: string; user_id: string; type: NotificationType
  context: NotificationContext | null
  title: string; message: string; isRead: boolean
  link: string | null; createdAt: string
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3004/api';

export function useNotifications() {
  return useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    // Fallback polling at 2 minutes — SSE hook below handles real-time delivery
    refetchInterval: 120_000,
  })
}

export function useNotificationStream() {
  const qc = useQueryClient();

  useEffect(() => {
    let xhr: XMLHttpRequest | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;
    let processedLength = 0;

    const connect = async (retryDelay = 0) => {
      if (unmounted) return;

      if (retryDelay > 0) {
        reconnectTimer = setTimeout(() => connect(0), retryDelay);
        return;
      }

      const token = await secureStorage.getAccessToken();
      if (!token || unmounted) return;

      processedLength = 0;
      xhr = new XMLHttpRequest();
      xhr.open('GET', `${API_BASE}/notifications/stream`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      xhr.onreadystatechange = () => {
        if (xhr!.readyState < 3) return;

        // Parse any new data that arrived
        const newText = xhr!.responseText.slice(processedLength);
        processedLength = xhr!.responseText.length;

        for (const line of newText.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data && data !== 'ping') {
              qc.invalidateQueries({ queryKey: ['notifications'] });
            }
          }
        }

        // Connection closed — reconnect after 5 seconds
        if (xhr!.readyState === XMLHttpRequest.DONE) {
          connect(5000);
        }
      };

      xhr.onerror = () => {
        if (!unmounted) connect(5000);
      };

      xhr.send();
    };

    connect();

    return () => {
      unmounted = true;
      xhr?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [qc]);
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
    mutationFn: (context?: NotificationContext) =>
      api.patch('/notifications/read-all', null, {
        params: context ? { context } : undefined,
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
