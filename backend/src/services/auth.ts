import { hash, verify } from 'argon2'
import { sign, verify as verifyJwt, JwtPayload } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret-change-in-production'

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  user: AuthUser
}

// Lazy load Prisma to avoid connection issues during initialization
async function getPrisma() {
  const { PrismaClient } = await import('../generated/prisma/client')
  return new (PrismaClient as any)()
}

export async function signup(email: string, password: string, name: string): Promise<AuthTokens> {
  const prisma = await getPrisma()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already registered')

  const password_hash = await hash(password)
  const user = await prisma.user.create({
    data: { email, password_hash, name },
  })

  const accessToken = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '30d' })

  await prisma.$disconnect()
  return {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at.toISOString() },
  }
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const prisma = await getPrisma()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Incorrect email or password')

  const valid = await verify(user.password_hash, password)
  if (!valid) throw new Error('Incorrect email or password')

  const accessToken = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '30d' })

  await prisma.$disconnect()
  return {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at.toISOString() },
  }
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const decoded = verifyJwt(refreshToken, REFRESH_SECRET) as JwtPayload
    const prisma = await getPrisma()
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) throw new Error('User not found')

    const accessToken = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' })
    await prisma.$disconnect()
    return { accessToken }
  } catch (e) {
    throw new Error('Invalid refresh token')
  }
}

export async function getUser(userId: string): Promise<AuthUser> {
  const prisma = await getPrisma()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')
  await prisma.$disconnect()
  return { id: user.id, email: user.email, name: user.name, createdAt: user.created_at.toISOString() }
}

export function verifyAccessToken(token: string): { userId: string; email: string } {
  try {
    return verifyJwt(token, JWT_SECRET) as { userId: string; email: string }
  } catch (e) {
    throw new Error('Invalid or expired token')
  }
}

export function generateRefreshToken(userId: string): string {
  return sign({ userId }, REFRESH_SECRET, { expiresIn: '30d' })
}
