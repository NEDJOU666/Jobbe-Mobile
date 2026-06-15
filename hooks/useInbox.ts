import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InboxThread {
  threadId: string
  applicationId: string
  firm: { id: string; name: string; logo: string | null }
  postTitle: string
  lastMessage: {
    id: string; body: string; senderId: string; createdAt: string; readAt: string | null
  } | null
  unreadCount: number
}

export interface InboxMessage {
  id: string
  threadId: string
  body: string
  sender: { id: string; name: string; profile_image: string | null }
  createdAt: string
  readAt: string | null
}

// GET /messages/my-inbox — correct backend endpoint for candidate thread list
export function useInboxThreads() {
  return useQuery<InboxThread[]>({
    queryKey: ['inbox'],
    queryFn: () => api.get('/messages/my-inbox').then((r) => r.data),
    refetchInterval: 15000,
  })
}

// GET /messages/application/:applicationId — fetches messages AND marks them as read
export function useThreadMessages(applicationId: string | null) {
  return useQuery<{ threadId: string; applicationId: string; messages: InboxMessage[] }>({
    queryKey: ['inbox-messages', applicationId],
    queryFn: () => api.get(`/messages/application/${applicationId}`).then((r) => r.data),
    enabled: !!applicationId,
    refetchInterval: 6000,
  })
}

// POST /messages/application/:applicationId — send message, creates thread if none exists
export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, body }: { applicationId: string; body: string }) =>
      api.post(`/messages/application/${applicationId}`, { body }).then((r) => r.data),
    onSuccess: (_, { applicationId }) => {
      qc.invalidateQueries({ queryKey: ['inbox-messages', applicationId] })
      qc.invalidateQueries({ queryKey: ['inbox'] })
    },
  })
}

// Alias kept so application/[id].tsx reschedule modal doesn't need changes
export const useSendApplicationMessage = useSendMessage
