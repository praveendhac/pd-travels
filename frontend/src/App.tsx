import { useQuery } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

interface HealthResponse {
  data: { status: string } | null
  error: { code: string; message: string } | null
}

function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<HealthResponse> => {
      const res = await fetch(`${API_BASE_URL}/health`)
      if (!res.ok) throw new Error(`Backend responded with ${res.status}`)
      return res.json()
    },
  })
}

function App() {
  const { data, isLoading, isError, error } = useHealthCheck()

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-xl border border-surface-border bg-surface p-8 text-center shadow-md">
        <h1 className="text-2xl font-semibold text-text mb-2">pd-travels</h1>
        <p className="text-text-muted mb-6">Trip Planner — Slice 0</p>

        {isLoading && <p className="text-text-muted">Checking backend…</p>}

        {isError && (
          <p className="text-error">
            Backend unreachable: {error instanceof Error ? error.message : 'unknown error'}
          </p>
        )}

        {data?.data && (
          <p className="text-success font-medium">
            Backend status: {data.data.status} ✓
          </p>
        )}

        <p className="mt-6 text-xs text-text-muted break-all">API: {API_BASE_URL}</p>
      </div>
    </main>
  )
}

export default App
