import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UserDocument {
  id: string; user_id: string; name: string; url: string | null
  documentType: string; size: string | null; isDefault: boolean; createdAt: string
}

export function useDocuments() {
  return useQuery<UserDocument[]>({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then((r) => r.data),
  })
}

export function useAddDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; documentType?: string; size?: string; url?: string }) =>
      api.post('/documents', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useSetDefaultDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/documents/${id}/default`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
