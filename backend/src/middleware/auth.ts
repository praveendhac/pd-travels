import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth'

export function verifyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid auth header' } })
    }

    const token = authHeader.slice(7)
    const { userId } = verifyAccessToken(token)
    ;(req as any).userId = userId
    next()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: msg } })
  }
}
