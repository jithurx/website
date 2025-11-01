import 'dotenv/config'
import express, { Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { initDatabase } from './models/database.js'
import logger from './utils/logger.js'
import { headerSecretMiddleware } from './middleware/headerSecret.js'
import authRoutes from './routes/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: Express = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'
const DB_PATH = process.env.DATABASE_PATH || '/data/portal.db'

// Initialize database
try {
  initDatabase(DB_PATH)
  logger.info('✅ Database initialized')
} catch (error) {
  logger.error('❌ Database initialization failed:', error)
  process.exit(1)
}

// Create required directories
const directories = [
  path.dirname(DB_PATH),
  path.join(path.dirname(DB_PATH), 'uploads'),
  path.join(path.dirname(DB_PATH), 'logs'),
]

for (const dir of directories) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))

// Compression
app.use(compression())

// Body parsing
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))

// Portal secret header validation
app.use('/api', headerSecretMiddleware)

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
  })
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
  })

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// Start server
app.listen(PORT, HOST as any, () => {
  logger.info(`🚀 Portal running on http://${HOST}:${PORT}`)
  logger.info(`📊 Logs: ${process.env.LOG_FILE || '/data/logs/portal.log'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down...')
  process.exit(0)
})

export default app
