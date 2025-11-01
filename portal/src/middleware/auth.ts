import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/authService.js'

export interface AuthRequest extends Request {
  userId?: string
  token?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Try to get token from Authorization header or cookie
  let token = req.headers.authorization?.replace('Bearer ', '')

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Verify token
  const session = AuthService.getSession(token)
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.userId = session.user_id
  req.token = token
  next()
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  let token = req.headers.authorization?.replace('Bearer ', '')

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token
  }

  if (token) {
    const session = AuthService.getSession(token)
    if (session) {
      req.userId = session.user_id
      req.token = token
    }
  }

  next()
}
