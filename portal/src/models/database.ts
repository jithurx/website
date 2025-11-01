import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null

export function initDatabase(dbPath: string = '/data/portal.db'): Database.Database {
  if (db) return db

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// User queries
export const UserQueries = {
  findById: (db: Database.Database, id: string) =>
    db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any,

  findByUsername: (db: Database.Database, username: string) =>
    db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any,

  create: (db: Database.Database, user: {
    id: string
    username: string
    password_hash: string
  }) => {
    const stmt = db.prepare(
      'INSERT INTO users (id, username, password_hash, created_at, is_active) VALUES (?, ?, ?, ?, 1)'
    )
    stmt.run(user.id, user.username, user.password_hash, Date.now())
  },

  updateTotpSecret: (db: Database.Database, userId: string, secret: string) => {
    const stmt = db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?')
    stmt.run(secret, userId)
  },

  updateLastLogin: (db: Database.Database, userId: string) => {
    const stmt = db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
    stmt.run(Date.now(), userId)
  },
}

// Session queries
export const SessionQueries = {
  findByToken: (db: Database.Database, token: string) =>
    db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any,

  create: (db: Database.Database, session: {
    id: string
    user_id: string
    token: string
    refresh_token: string
    expires_at: number
  }) => {
    const stmt = db.prepare(
      'INSERT INTO sessions (id, user_id, token, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    stmt.run(session.id, session.user_id, session.token, session.refresh_token, session.expires_at, Date.now())
  },

  deleteByUserId: (db: Database.Database, userId: string) => {
    const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?')
    stmt.run(userId)
  },

  deleteExpired: (db: Database.Database) => {
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at < ?')
    stmt.run(Date.now())
  },
}

// Vault queries
export const VaultQueries = {
  findByUserId: (db: Database.Database, userId: string) =>
    db.prepare('SELECT id, user_id, name, category, updated_at FROM vault WHERE user_id = ?').all(userId) as any[],

  findById: (db: Database.Database, id: string) =>
    db.prepare('SELECT * FROM vault WHERE id = ?').get(id) as any,

  create: (db: Database.Database, vault: {
    id: string
    user_id: string
    name: string
    secret_encrypted: Buffer
    encryption_iv: Buffer
    category?: string
  }) => {
    const stmt = db.prepare(
      'INSERT INTO vault (id, user_id, name, secret_encrypted, encryption_iv, category, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(vault.id, vault.user_id, vault.name, vault.secret_encrypted, vault.encryption_iv, vault.category || 'general', Date.now())
  },

  update: (db: Database.Database, id: string, data: {
    name?: string
    secret_encrypted?: Buffer
    encryption_iv?: Buffer
    category?: string
  }) => {
    const updates: string[] = []
    const values: any[] = []

    if (data.name) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.secret_encrypted) {
      updates.push('secret_encrypted = ?')
      values.push(data.secret_encrypted)
    }
    if (data.encryption_iv) {
      updates.push('encryption_iv = ?')
      values.push(data.encryption_iv)
    }
    if (data.category) {
      updates.push('category = ?')
      values.push(data.category)
    }

    updates.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    const stmt = db.prepare(`UPDATE vault SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...values)
  },

  deleteById: (db: Database.Database, id: string) => {
    const stmt = db.prepare('DELETE FROM vault WHERE id = ?')
    stmt.run(id)
  },
}

// Files queries
export const FileQueries = {
  findByUserId: (db: Database.Database, userId: string) =>
    db.prepare('SELECT id, user_id, filename, size_bytes, mime_type, uploaded_at FROM files WHERE user_id = ?').all(userId) as any[],

  findById: (db: Database.Database, id: string) =>
    db.prepare('SELECT * FROM files WHERE id = ?').get(id) as any,

  create: (db: Database.Database, file: {
    id: string
    user_id: string
    filename: string
    size_bytes: number
    mime_type: string
    file_path: string
    encryption_iv: Buffer
  }) => {
    const stmt = db.prepare(
      'INSERT INTO files (id, user_id, filename, size_bytes, mime_type, file_path, encryption_iv, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(file.id, file.user_id, file.filename, file.size_bytes, file.mime_type, file.file_path, file.encryption_iv, Date.now())
  },

  deleteById: (db: Database.Database, id: string) => {
    const stmt = db.prepare('DELETE FROM files WHERE id = ?')
    stmt.run(id)
  },
}

// Audit log queries
export const AuditLogQueries = {
  create: (db: Database.Database, log: {
    id: string
    user_id?: string
    event_type: string
    description?: string
    ip_address?: string
  }) => {
    const stmt = db.prepare(
      'INSERT INTO audit_log (id, user_id, event_type, description, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    )
    stmt.run(log.id, log.user_id || null, log.event_type, log.description || null, log.ip_address || null, Date.now())
  },

  findRecent: (db: Database.Database, limit: number = 100) =>
    db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?').all(limit) as any[],

  findByUserId: (db: Database.Database, userId: string, limit: number = 100) =>
    db.prepare('SELECT * FROM audit_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit) as any[],
}
