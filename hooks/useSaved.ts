import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Job } from './useJobs'

export function useSaved() {
  return useQuery<Job[]>({
    queryKey: ['saved'],
    queryFn: () => api.get('/saved').then((r) => r.data),
  })
}

export function useToggleSave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) =>
      api.post(`/saved/${postId}`).then((r) => r.data as { saved: boolean }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
