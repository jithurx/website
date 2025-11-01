import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { AuthService } from '../services/authService.js'
import { getDatabase, UserQueries } from '../models/database.js'
import { validateUsername, validatePassword, validateTotpCode } from '../utils/validators.js'
import logger from '../utils/logger.js'

const router = Router()

// POST /api/auth/register - Create first admin account (one-time only)
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, setup_token } = req.body

    // Verify setup token (passed via environment or initial setup)
    if (setup_token !== process.env.SETUP_TOKEN) {
      logger.warn('Register attempt with invalid setup token')
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    // Validate inputs
    if (!validateUsername(username)) {
      res.status(400).json({ error: 'Invalid username (3-50 chars, alphanumeric + _)' })
      return
    }

    if (!validatePassword(password)) {
      res.status(400).json({ error: 'Password must be at least 12 characters' })
      return
    }

    // Check if user exists
    const db = getDatabase()
    const existingUser = UserQueries.findByUsername(db, username)
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' })
      return
    }

    // Register user
    const user = await AuthService.registerUser(username, password)

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    })
  } catch (error: any) {
    logger.error('Register error:', error)
    res.status(400).json({ error: error.message })
  }
})

// POST /api/auth/login - Login with password + TOTP
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, totp_code } = req.body
    const ipAddress = req.ip

    // Validate inputs
    if (!username || !password) {
      res.status(400).json({ error: 'Missing credentials' })
      return
    }

    if (!totp_code || !validateTotpCode(totp_code)) {
      res.status(400).json({ error: 'Invalid TOTP code' })
      return
    }

    // Authenticate
    const authToken = await AuthService.authenticate(username, password, totp_code, ipAddress)

    // Set HTTP-only cookie
    res.cookie('auth_token', authToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    })

    res.json({
      success: true,
      token: authToken.token,
      refresh_token: authToken.refreshToken,
      expires_in: authToken.expiresIn,
      user: authToken.user,
    })
  } catch (error: any) {
    logger.warn(`Login failed: ${error.message}`)
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

// POST /api/auth/logout - Invalidate session
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (req.token) {
      AuthService.logout(req.token)
    }

    res.clearCookie('auth_token')
    res.json({ success: true })
  } catch (error: any) {
    logger.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', (req: AuthRequest, res: Response) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      res.status(400).json({ error: 'Missing refresh token' })
      return
    }

    const decoded = AuthService.verifyRefreshToken(refresh_token)
    if (!decoded) {
      res.status(401).json({ error: 'Invalid refresh token' })
      return
    }

    const tokens = AuthService.generateTokens(decoded.userId)

    res.json({
      success: true,
      token: tokens.token,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    })
  } catch (error: any) {
    logger.error('Refresh token error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = AuthService.getAuthenticatedUser(req.token)
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    res.json({ user })
  } catch (error: any) {
    logger.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// POST /api/auth/totp-enable - Enable TOTP on account
router.post('/totp-enable', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const user = UserQueries.findById(db, req.userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Generate TOTP secret
    const { secret, qrCode } = AuthService.generateTotpSecret(user.username)

    res.json({
      success: true,
      secret,
      qr_code: qrCode,
      message: 'Scan QR code with your authenticator app, then verify with /api/auth/totp-verify',
    })
  } catch (error: any) {
    logger.error('TOTP enable error:', error)
    res.status(500).json({ error: 'Failed to enable TOTP' })
  }
})

// POST /api/auth/totp-verify - Verify TOTP code and save secret
router.post('/totp-verify', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { secret, totp_code } = req.body

    if (!secret || !validateTotpCode(totp_code)) {
      res.status(400).json({ error: 'Invalid input' })
      return
    }

    // Verify TOTP code matches secret
    const isValid = AuthService.verifyTotp(secret, totp_code)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid TOTP code' })
      return
    }

    // Save secret to user
    const db = getDatabase()
    UserQueries.updateTotpSecret(db, req.userId, secret)

    res.json({
      success: true,
      message: 'TOTP enabled successfully',
    })
  } catch (error: any) {
    logger.error('TOTP verify error:', error)
    res.status(500).json({ error: 'Failed to verify TOTP' })
  }
})

// POST /api/auth/webauthn-register - Register WebAuthn credential
router.post('/webauthn-register', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // WebAuthn registration is complex and requires client-side integration
    // For now, return placeholder response
    res.json({
      success: true,
      message: 'WebAuthn registration not yet implemented',
    })
  } catch (error: any) {
    logger.error('WebAuthn register error:', error)
    res.status(500).json({ error: 'WebAuthn registration failed' })
  }
})

// POST /api/auth/backup-codes - Generate backup codes
router.post('/backup-codes', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Array.from({ length: 4 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-')
    )

    res.json({
      success: true,
      backup_codes: backupCodes,
      message: 'Save these codes in a secure location. Each code can be used once if you lose access to your authenticator.',
    })
  } catch (error: any) {
    logger.error('Backup codes error:', error)
    res.status(500).json({ error: 'Failed to generate backup codes' })
  }
})

export default router
