import { useAuth } from '../store/auth'
import { logout } from '../api/auth'

export function Home() {
  const { user, setUser, setAccessToken } = useAuth()

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setAccessToken(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="bg-surface border-b border-surface-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">pd-travels</h1>
          <div className="flex items-center gap-4">
            <span className="text-text">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        <section className="py-8">
          <h2 className="text-3xl font-bold text-text mb-8">Welcome, {user?.name}!</h2>

          <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
            <p className="text-text-muted mb-4">Slice 1 (Auth) complete! ✓</p>
            <p className="text-text mb-4">Ready for Slice 2 (Trips) next</p>
            <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium">
              Create Your First Trip
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
