import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CreditTransaction {
  id: string; user_id: string; amount: number
  type: 'PURCHASE' | 'SPEND' | 'REFUND' | 'BONUS' | 'ADJUSTMENT'
  referenceId: string | null; description: string | null; createdAt: string
}

export interface CreditsData {
  balance: number
  transactions: CreditTransaction[]
}

export function useCredits() {
  return useQuery<CreditsData>({
    queryKey: ['credits'],
    queryFn: () => api.get('/credits').then((r) => r.data),
  })
}
