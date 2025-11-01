import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || '/data/portal.db'
const initSqlPath = path.join(__dirname, '../../db/init.sql')

console.log(`Initializing database at: ${dbPath}`)

try {
  const db = new Database(dbPath)
  const sql = fs.readFileSync(initSqlPath, 'utf-8')

  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(stmt => stmt.trim())

  for (const statement of statements) {
    db.exec(statement)
  }

  db.close()
  console.log('✅ Database initialized successfully')
} catch (error) {
  console.error('❌ Database initialization failed:', error)
  process.exit(1)
}
