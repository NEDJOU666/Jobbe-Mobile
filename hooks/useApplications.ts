import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type ApplicationStatus =
  | 'PENDING_REVIEW' | 'FORWARDED_TO_FIRM' | 'REVIEWING'
  | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'REJECTED'

export interface Application {
  id: string
  post_id: string; user_id: string; firm_id: string
  coverLetter: string | null; documents: any
  status: ApplicationStatus[]
  statusUpdatedAt: string; creditSpent: number
  createdAt: string; updatedAt: string
  post: {
    id: string; title: string; location: string; locationType: string
    employmentType: string; applicationDeadline: string | null
    applyType: string; properties: any
  }
  firm: { id: string; name: string; logo: string | null; city: string; country: string }
}

export function useApplications() {
  return useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications/me').then((r) => r.data),
  })
}

export function useApply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { postId: string; coverLetter?: string; resumeName?: string }) =>
      api.post(`/applications/post/${payload.postId}`, {
        coverLetter: payload.coverLetter,
        resumeName: payload.resumeName,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useWithdraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/applications/${id}/withdraw`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
