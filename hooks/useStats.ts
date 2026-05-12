import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StatsData {
  applied: number; interviews: number; offers: number
  saved: number; profileViews: number; interviewRate: number
  statusCounts: Record<string, number>
  recentActivity: Array<{ status: string; date: string }>
}

export function useStats() {
  return useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then((r) => r.data),
  })
}
