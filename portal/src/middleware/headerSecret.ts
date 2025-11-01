import { Request, Response, NextFunction } from 'express'

const PORTAL_SECRET = process.env.PORTAL_SECRET

export function headerSecretMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow requests without the header if PORTAL_SECRET is not set (dev mode)
  if (!PORTAL_SECRET) {
    next()
    return
  }

  const secret = req.headers['x-portal-secret']

  if (secret !== PORTAL_SECRET) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  next()
}
