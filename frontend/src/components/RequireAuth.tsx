import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { getMe, refresh } from '../api/auth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, accessToken, isLoading, setUser, setAccessToken, setLoading, setError } = useAuth()

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        // Try to refresh token first
        const refreshResult = await refresh()
        if (refreshResult.data?.accessToken) {
          setAccessToken(refreshResult.data.accessToken)
          const meResult = await getMe(refreshResult.data.accessToken)
          if (meResult.data) {
            setUser(meResult.data)
          }
        }
      } catch (err) {
        // Silently fail, user will be redirected to login
      } finally {
        setLoading(false)
      }
    }

    if (!user && !accessToken) {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-muted">Loading...</p>
      </main>
    )
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
