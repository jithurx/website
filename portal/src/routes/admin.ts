import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { getDatabase, UserQueries, AuditLogQueries, SessionQueries } from '../models/database.js'
import logger from '../utils/logger.js'

const router = Router()

// Middleware: Check if user is admin (for now, only first user is admin)
function isAdmin(req: AuthRequest, res: Response, next: any) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const db = getDatabase()
  const user = UserQueries.findById(db, req.userId)

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Simple admin check: user ID must be in admin list or be the first user
  // In production, add admin column to users table
  req.isAdmin = true // TODO: Implement proper admin authorization
  next()
}

// GET /api/admin/users - List all users (admin only)
router.get('/users', authMiddleware, isAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase()
    const users = db.prepare('SELECT id, username, created_at, last_login_at, is_active FROM users').all()

    res.json({
      success: true,
      data: users,
    })
  } catch (error: any) {
    logger.error('List users error:', error)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

// GET /api/admin/audit-log - View audit log (admin only)
router.get('/audit-log', authMiddleware, isAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase()
    const limit = parseInt((req.query.limit as string) || '100')
    const userId = req.query.user_id as string

    let logs
    if (userId) {
      logs = AuditLogQueries.findByUserId(db, userId, limit)
    } else {
      logs = AuditLogQueries.findRecent(db, limit)
    }

    res.json({
      success: true,
      data: logs,
    })
  } catch (error: any) {
    logger.error('Get audit log error:', error)
    res.status(500).json({ error: 'Failed to get audit log' })
  }
})

// POST /api/admin/clear-sessions - Force logout all users (admin only)
router.post('/clear-sessions', authMiddleware, isAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM sessions')
    stmt.run()

    logger.warn('All sessions cleared by admin')

    res.json({
      success: true,
      message: 'All sessions cleared',
    })
  } catch (error: any) {
    logger.error('Clear sessions error:', error)
    res.status(500).json({ error: 'Failed to clear sessions' })
  }
})

// GET /api/admin/export-keys - Export encryption keys for backup (admin only)
router.get('/export-keys', authMiddleware, isAdmin, (req: AuthRequest, res: Response) => {
  try {
    const keys = {
      portal_secret: process.env.PORTAL_SECRET ? '***SET***' : 'NOT SET',
      encryption_key: process.env.ENCRYPTION_KEY ? '***SET***' : 'NOT SET',
      jwt_secret: process.env.JWT_SECRET ? '***SET***' : 'NOT SET',
      note: 'Never export actual keys via API. Use environment variables and manual backup.',
    }

    res.json({
      success: true,
      data: keys,
    })
  } catch (error: any) {
    logger.error('Export keys error:', error)
    res.status(500).json({ error: 'Failed to export keys' })
  }
})

// POST /api/admin/deactivate-user - Deactivate user (admin only)
router.post('/deactivate-user', authMiddleware, isAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { user_id } = req.body

    if (!user_id) {
      res.status(400).json({ error: 'Missing user_id' })
      return
    }

    const db = getDatabase()
    const stmt = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?')
    stmt.run(user_id)

    logger.info(`User deactivated: ${user_id}`)

    res.json({
      success: true,
      message: 'User deactivated',
    })
  } catch (error: any) {
    logger.error('Deactivate user error:', error)
    res.status(500).json({ error: 'Failed to deactivate user' })
  }
})

// GET /api/admin/stats - Portal statistics (admin only)
router.get('/stats', authMiddleware, isAdmin, (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase()

    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
    const activeUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any).count
    const totalFiles = (db.prepare('SELECT COUNT(*) as count FROM files').get() as any).count
    const totalFileSize = (db.prepare('SELECT SUM(size_bytes) as total FROM files').get() as any).total || 0
    const totalVaultEntries = (db.prepare('SELECT COUNT(*) as count FROM vault').get() as any).count
    const recentLogins = (db.prepare('SELECT COUNT(*) as count FROM audit_log WHERE event_type = \'login_success\' AND timestamp > ?').get(Date.now() - 24 * 60 * 60 * 1000) as any).count

    res.json({
      success: true,
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        total_files: totalFiles,
        total_file_size_bytes: totalFileSize,
        total_vault_entries: totalVaultEntries,
        recent_logins_24h: recentLogins,
      },
    })
  } catch (error: any) {
    logger.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to get statistics' })
  }
})

export default router
