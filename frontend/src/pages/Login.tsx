import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../store/auth'

export function Login() {
  const navigate = useNavigate()
  const { setUser, setAccessToken, setError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError('')

    try {
      const result = await login(email, password)
      if (result.error) {
        setLocalError(result.error.message)
      } else if (result.data) {
        setUser(result.data.user)
        setAccessToken(result.data.accessToken)
        navigate('/')
      }
    } catch (err) {
      setLocalError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-surface-border bg-surface p-8 shadow-md">
        <h1 className="text-2xl font-semibold text-text mb-2">Sign In</h1>
        <p className="text-text-muted mb-6">to pd-travels</p>

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block text-text font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-text font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-text-muted text-sm mt-4 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  )
}
