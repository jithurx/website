import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { getDatabase, FileQueries } from '../models/database.js'
import { EncryptionService } from '../services/encryptionService.js'
import { sanitizeFilename } from '../utils/validators.js'
import logger from '../utils/logger.js'

const router = Router()

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '500') * 1024 * 1024)

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
})

// GET /api/files - List user's files
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const files = FileQueries.findByUserId(db, req.userId)

    res.json({
      success: true,
      data: files.map(f => ({
        id: f.id,
        filename: f.filename,
        size_bytes: f.size_bytes,
        mime_type: f.mime_type,
        uploaded_at: f.uploaded_at,
      })),
    })
  } catch (error: any) {
    logger.error('List files error:', error)
    res.status(500).json({ error: 'Failed to list files' })
  }
})

// GET /api/files/:id - Download file
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const file = FileQueries.findById(db, req.params.id)

    if (!file || file.user_id !== req.userId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    // Read encrypted file
    if (!fs.existsSync(file.file_path)) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const encryptedData = fs.readFileSync(file.file_path)

    // Decrypt (last 16 bytes are auth tag)
    const authTag = encryptedData.slice(-16)
    const ciphertext = encryptedData.slice(0, -16)
    const decrypted = EncryptionService.decrypt(ciphertext, file.encryption_iv, authTag)

    // Set response headers
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
    res.setHeader('Content-Length', decrypted.length)

    res.send(decrypted)

    logger.info(`File downloaded: ${file.id} (${file.filename})`)
  } catch (error: any) {
    logger.error('Download file error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// POST /api/files/upload - Upload encrypted file
router.post('/upload', authMiddleware, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const originalFilename = sanitizeFilename(req.file.originalname || 'unnamed')
    const fileId = uuidv4()
    const filePath = path.join(UPLOAD_DIR, fileId)

    // Encrypt file
    const { ciphertext, iv, authTag } = EncryptionService.encrypt(req.file.buffer)
    const encryptedData = Buffer.concat([ciphertext, authTag])

    // Save encrypted file
    fs.writeFileSync(filePath, encryptedData)

    // Store metadata in database
    const db = getDatabase()
    FileQueries.create(db, {
      id: fileId,
      user_id: req.userId,
      filename: originalFilename,
      size_bytes: req.file.size,
      mime_type: req.file.mimetype,
      file_path: filePath,
      encryption_iv: iv,
    })

    logger.info(`File uploaded: ${fileId} (${originalFilename}, ${req.file.size} bytes)`)

    res.status(201).json({
      success: true,
      data: {
        id: fileId,
        filename: originalFilename,
        size_bytes: req.file.size,
      },
    })
  } catch (error: any) {
    logger.error('Upload file error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// DELETE /api/files/:id - Delete file
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const file = FileQueries.findById(db, req.params.id)

    if (!file || file.user_id !== req.userId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    // Delete file from disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path)
    }

    // Delete metadata from database
    FileQueries.deleteById(db, req.params.id)

    logger.info(`File deleted: ${req.params.id}`)

    res.json({ success: true })
  } catch (error: any) {
    logger.error('Delete file error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// GET /api/files/:id/info - Get file metadata
router.get('/:id/info', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const file = FileQueries.findById(db, req.params.id)

    if (!file || file.user_id !== req.userId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.json({
      success: true,
      data: {
        id: file.id,
        filename: file.filename,
        size_bytes: file.size_bytes,
        mime_type: file.mime_type,
        uploaded_at: file.uploaded_at,
      },
    })
  } catch (error: any) {
    logger.error('Get file info error:', error)
    res.status(500).json({ error: 'Failed to get file info' })
  }
})

export default router
