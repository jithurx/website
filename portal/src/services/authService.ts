import * as argon2 from 'argon2'
import speakeasy from 'speakeasy'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { getDatabase, UserQueries, SessionQueries, AuditLogQueries } from '../models/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const TOTP_WINDOW = parseInt(process.env.TOTP_WINDOW || '2')

export interface AuthUser {
  id: string
  username: string
  totp_enabled: boolean
  webauthn_enabled: boolean
}

export interface AuthToken {
  token: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

export class AuthService {
  // Password hashing and verification
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // ~19MB
      timeCost: 2,
      parallelism: 1,
    })
  }

  static async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password)
    } catch {
      return false
    }
  }

  // TOTP (Time-based One-Time Password)
  static generateTotpSecret(username: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `Portal (${username})`,
      length: 32,
    })

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
    }
  }

  static verifyTotp(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: TOTP_WINDOW,
      })
    } catch {
      return false
    }
  }

  // Session and JWT token management
  static generateTokens(userId: string): Omit<AuthToken, 'user'> {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
    const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY })

    return {
      token,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    }
  }

  static verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
      return decoded
    } catch {
      return null
    }
  }

  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string }
      if (decoded.type !== 'refresh') return null
      return { userId: decoded.userId }
    } catch {
      return null
    }
  }

  // Session creation
  static createSession(userId: string): { id: string; token: string; refreshToken: string; expiresAt: number } {
    const db = getDatabase()
    const sessionId = uuidv4()
    const tokens = AuthService.generateTokens(userId)
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    SessionQueries.create(db, {
      id: sessionId,
      user_id: userId,
      token: tokens.token,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
    })

    return {
      id: sessionId,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresAt,
    }
  }

  // Session validation
  static getSession(token: string) {
    const db = getDatabase()
    const decoded = AuthService.verifyToken(token)

    if (!decoded) return null

    const session = SessionQueries.findByToken(db, token)
    if (!session || session.expires_at < Date.now()) return null

    return session
  }

  // User registration (one-time admin setup)
  static async registerUser(username: string, password: string): Promise<{ id: string; username: string }> {
    const db = getDatabase()

    // Check if user already exists
    if (UserQueries.findByUsername(db, username)) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password)
    const userId = uuidv4()

    // Create user
    UserQueries.create(db, {
      id: userId,
      username,
      password_hash: passwordHash,
    })

    // Log event
    AuditLogQueries.create(db, {
      id: uuidv4(),
      user_id: userId,
      event_type: 'user_created',
      description: `User ${username} created`,
    })

    return { id: userId, username }
  }

  // User authentication
  static async authenticate(
    username: string,
    password: string,
    totpCode: string,
    ipAddress?: string
  ): Promise<AuthToken> {
    const db = getDatabase()

    // Find user
    const user = UserQueries.findByUsername(db, username)
    if (!user) {
      AuditLogQueries.create(db, {
        id: uuidv4(),
        event_type: 'login_failed',
        description: 'Invalid username',
        ip_address: ipAddress,
      })
      throw new Error('Invalid credentials')
    }

    // Verify password
    const passwordValid = await AuthService.verifyPassword(user.password_hash, password)
    if (!passwordValid) {
      AuditLogQueries.create(db, {
        id: uuidv4(),
        user_id: user.id,
        event_type: 'login_failed',
        description: 'Invalid password',
        ip_address: ipAddress,
      })
      throw new Error('Invalid credentials')
    }

    // Verify TOTP if enabled
    if (user.totp_secret) {
      const totpValid = AuthService.verifyTotp(user.totp_secret, totpCode)
      if (!totpValid) {
        AuditLogQueries.create(db, {
          id: uuidv4(),
          user_id: user.id,
          event_type: 'login_failed',
          description: 'Invalid TOTP code',
          ip_address: ipAddress,
        })
        throw new Error('Invalid 2FA code')
      }
    }

    // Update last login
    UserQueries.updateLastLogin(db, user.id)

    // Create session
    const tokens = AuthService.generateTokens(user.id)

    // Create database session
    SessionQueries.create(db, {
      id: uuidv4(),
      user_id: user.id,
      token: tokens.token,
      refresh_token: tokens.refreshToken,
      expires_at: Date.now() + 15 * 60 * 1000,
    })

    // Log successful login
    AuditLogQueries.create(db, {
      id: uuidv4(),
      user_id: user.id,
      event_type: 'login_success',
      description: `User ${username} logged in`,
      ip_address: ipAddress,
    })

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        username: user.username,
        totp_enabled: !!user.totp_secret,
        webauthn_enabled: !!user.webauthn_credentialid,
      },
    }
  }

  // Get user with authentication
  static getAuthenticatedUser(token: string): AuthUser | null {
    const session = AuthService.getSession(token)
    if (!session) return null

    const db = getDatabase()
    const user = UserQueries.findById(db, session.user_id)
    if (!user) return null

    return {
      id: user.id,
      username: user.username,
      totp_enabled: !!user.totp_secret,
      webauthn_enabled: !!user.webauthn_credentialid,
    }
  }

  // Logout
  static logout(token: string): void {
    const db = getDatabase()
    const session = SessionQueries.findByToken(db, token)
    if (session) {
      AuditLogQueries.create(db, {
        id: uuidv4(),
        user_id: session.user_id,
        event_type: 'logout',
        description: 'User logged out',
      })
    }
  }
}
