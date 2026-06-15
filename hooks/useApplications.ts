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
  feedback?: string | null
  rating?: number | null
  createdAt: string
}

export interface JobOffer {
  id: string
  salary: number
  startDate: string
  notes?: string | null
  deadline?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export interface Application {
  id: string
  post_id: string; user_id: string; firm_id: string
  coverLetter: string | null; documents: { name: string; url: string }[] | null
  salaryExpectation?: number | null
  status: ApplicationStatus[]
  statusUpdatedAt: string; creditSpent: number
  createdAt: string; updatedAt: string
  post: {
    id: string; title: string; location: string; locationType: string
    employmentType: string; applicationDeadline: string | null
    applyType: string; source: string | null; properties: any
  }
  firm: { id: string; name: string; logo: string | null; city: string; country: string }
  interview: Interview | null
  offer?: JobOffer | null
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
    mutationFn: (payload: {
      postId: string;
      coverLetter?: string;
      resumeName?: string;
      documents?: { name: string; url: string }[];
      salaryExpectation?: number;
    }) =>
      api.post(`/applications/post/${payload.postId}`, {
        coverLetter: payload.coverLetter,
        resumeName: payload.resumeName,
        documents: payload.documents,
        ...(payload.salaryExpectation ? { salaryExpectation: payload.salaryExpectation } : {}),
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

export function useApplicationDetail(id: string) {
  return useQuery<Application>({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/my/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useConfirmInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (interviewId: string) =>
      api.patch(`/interviews/my/${interviewId}/confirm`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useCancelInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (interviewId: string) =>
      api.patch(`/interviews/my/${interviewId}/cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useRespondOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, action }: { applicationId: string; action: 'accept' | 'decline' }) =>
      api.patch(`/applications/my/${applicationId}/offer/${action}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
