const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthResponse {
  data: { accessToken: string; user: AuthUser } | null
  error: { code: string; message: string } | null
}

export async function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  return res.json()
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function refresh(): Promise<{ data: { accessToken: string } | null; error: { code: string; message: string } | null }> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function getMe(token: string): Promise<{ data: AuthUser | null; error: { code: string; message: string } | null }> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}
