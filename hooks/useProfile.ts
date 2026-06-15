import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UserProfileData {
  id: string; name: string; email: string; phone: string | null;
  avatar: string | null; profile_image: string | null
  role: string; isEmailVerified: boolean; createdAt: string
  profile: {
    headline: string | null; bio: string | null; location: string | null
    website: string | null; linkedin: string | null
    github: string | null; skills: string[]; languages: string[]
    experience: any; education: any
    openToWork: boolean; profileVisible: boolean; showSalary: boolean
    profileCompleted: boolean; emailAlerts: boolean
  } | null
}

export function useProfile() {
  return useQuery<UserProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<{
      name: string; headline: string; bio: string; location: string
      phone: string; website: string; linkedin: string; github: string
      skills: string[]; languages: string[]; experience: any; education: any
      openToWork: boolean; profileVisible: boolean; showSalary: boolean
      emailAlerts: boolean; avatar: string;
    }>) => api.patch('/profile', data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data)
    },
  })
}
