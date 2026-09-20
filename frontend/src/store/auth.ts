import { create } from 'zustand'
import type { AuthUser } from '../api/auth'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  error: string | null

  setUser: (user: AuthUser | null) => void
  setAccessToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, accessToken: null, error: null }),
}))
