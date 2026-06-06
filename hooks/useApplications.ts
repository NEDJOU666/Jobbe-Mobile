import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type ApplicationStatus =
  | 'PENDING_REVIEW' | 'FORWARDED_TO_FIRM' | 'REVIEWING'
  | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'REJECTED'

export type InterviewStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
export type MeetingPlatform = 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS' | 'PHONE' | 'IN_PERSON' | 'OTHER'

export interface Interview {
  id: string
  application_id: string
  firm_id: string
  scheduled_at: string
  duration_min: number
  platform: MeetingPlatform
  meeting_link: string | null
  location: string | null
  agenda: string | null
  status: InterviewStatus
  createdAt: string
}

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
  interview: Interview | null
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

export function useCheckApplied(postId: string) {
  return useQuery<{ applied: boolean }>({
    queryKey: ['applied', postId],
    queryFn: () => api.get(`/applications/post/${postId}/check`).then((r) => r.data),
    enabled: !!postId,
  })
}
