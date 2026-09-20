import { Router, Request, Response } from 'express'
import { z } from 'zod'
import * as AuthService from '../services/auth'
import { verifyAuth } from '../middleware/auth'

const router = Router()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body)
    const { accessToken, user } = await AuthService.signup(email, password, name)
    const refreshToken = AuthService.generateRefreshToken(user.id)

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
      .json({ data: { accessToken, user }, error: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    const code = msg.includes('already') ? 'CONFLICT' : 'VALIDATION_ERROR'
    const status = code === 'CONFLICT' ? 409 : 400
    res.status(status).json({ data: null, error: { code, message: msg } })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const { accessToken, user } = await AuthService.login(email, password)
    const refreshToken = AuthService.generateRefreshToken(user.id)

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({ data: { accessToken, user }, error: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: msg } })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) throw new Error('No refresh token')

    const { accessToken } = await AuthService.refresh(refreshToken)
    res.json({ data: { accessToken }, error: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: msg } })
  }
})

router.post('/logout', verifyAuth, (req: Request, res: Response) => {
  res.clearCookie('refreshToken').json({ data: { success: true }, error: null })
})

router.get('/me', verifyAuth, async (req: Request, res: Response) => {
  try {
    const user = await AuthService.getUser((req as any).userId)
    res.json({ data: user, error: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: msg } })
  }
})

export default router
