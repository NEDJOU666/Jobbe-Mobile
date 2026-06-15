import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface JobFirm {
  id: string; name: string; logo: string | null; city: string; country: string
  domain_role: string; size: string | null; status: string
}

export interface Job {
  id: string; title: string; description: string
  postType: 'JOB' | 'INTERNSHIP'; employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'; locationType: 'REMOTE' | 'ONSITE' | 'HYBRID'; location: string
  isPaid: boolean; creditCost: number; applicationDeadline: string | null
  applyType: 'INTERNAL' | 'EXTERNAL'; applyUrl: string | null; status: string; viewCount: number
  source: string | null; sourceUrl: string | null
  properties: {
    experienceLevel?: string; salaryMin?: number; salaryMax?: number
    currency?: string; skills?: string[]; requirements?: string[]
    benefits?: string[]; scrapedCompany?: string; applyEmail?: string
    education?: string; experience?: string
  }
  firm: JobFirm; _count: { applications: number }
  createdAt: string; updatedAt: string
}

export type JobsResponse = { data: Job[]; total: number; skip: number; take: number }

const PAGE_SIZE = 20

/** Infinite-scroll feed — use in the main jobs list. */
export function useJobsFeed(params?: { search?: string; emp?: string; loc?: string }) {
  return useInfiniteQuery<JobsResponse>({
    queryKey: ['jobs-feed', params],
    queryFn: ({ pageParam }) =>
      api.get('/jobs', { params: { skip: pageParam, take: PAGE_SIZE, ...params } }).then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.skip + lastPage.take;
      return next < lastPage.total ? next : undefined;
    },
  })
}

/** Single-page query — kept for screens that don't need infinite scroll. */
export function useJobs(params?: { search?: string; type?: string; emp?: string; take?: number }) {
  return useQuery<JobsResponse>({
    queryKey: ['jobs', params],
    queryFn: () =>
      api.get('/jobs', { params: { take: 20, ...params } }).then((r) => r.data),
  })
}

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useJobSaved(id: string) {
  return useQuery<{ saved: boolean }>({
    queryKey: ['job-saved', id],
    queryFn: () => api.get(`/jobs/${id}/saved`).then((r) => r.data),
    enabled: !!id,
  })
}
