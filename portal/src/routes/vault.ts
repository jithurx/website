import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { getDatabase, VaultQueries } from '../models/database.js'
import { EncryptionService } from '../services/encryptionService.js'
import logger from '../utils/logger.js'

const router = Router()

// GET /api/vault - List encrypted secrets (metadata only, no secrets)
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const vaults = VaultQueries.findByUserId(db, req.userId)

    res.json({
      success: true,
      data: vaults.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        updated_at: v.updated_at,
      })),
    })
  } catch (error: any) {
    logger.error('List vault error:', error)
    res.status(500).json({ error: 'Failed to list vault entries' })
  }
})

// GET /api/vault/:id - Retrieve and decrypt secret
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const vault = VaultQueries.findById(db, req.params.id)

    if (!vault || vault.user_id !== req.userId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    // Decrypt secret
    const authTag = vault.secret_encrypted.slice(-16) // Last 16 bytes
    const ciphertext = vault.secret_encrypted.slice(0, -16)
    const secret = EncryptionService.decrypt(ciphertext, vault.encryption_iv, authTag)

    res.json({
      success: true,
      data: {
        id: vault.id,
        name: vault.name,
        secret,
        category: vault.category,
        updated_at: vault.updated_at,
      },
    })
  } catch (error: any) {
    logger.error('Get vault error:', error)
    res.status(500).json({ error: 'Failed to retrieve secret' })
  }
})

// POST /api/vault - Add new secret
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { name, secret, category } = req.body

    if (!name || !secret) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    // Encrypt secret
    const { ciphertext, iv, authTag } = EncryptionService.encrypt(secret)
    const encryptedData = Buffer.concat([ciphertext, authTag])

    // Store in vault
    const db = getDatabase()
    const vaultId = uuidv4()

    VaultQueries.create(db, {
      id: vaultId,
      user_id: req.userId,
      name,
      secret_encrypted: encryptedData,
      encryption_iv: iv,
      category: category || 'general',
    })

    logger.info(`Vault entry created: ${vaultId}`)

    res.status(201).json({
      success: true,
      data: {
        id: vaultId,
        name,
        category: category || 'general',
      },
    })
  } catch (error: any) {
    logger.error('Create vault error:', error)
    res.status(500).json({ error: 'Failed to create vault entry' })
  }
})

// PUT /api/vault/:id - Update secret
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const vault = VaultQueries.findById(db, req.params.id)

    if (!vault || vault.user_id !== req.userId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const { name, secret, category } = req.body
    const updateData: any = {}

    if (name) updateData.name = name
    if (category) updateData.category = category

    if (secret) {
      const { ciphertext, iv, authTag } = EncryptionService.encrypt(secret)
      updateData.secret_encrypted = Buffer.concat([ciphertext, authTag])
      updateData.encryption_iv = iv
    }

    VaultQueries.update(db, req.params.id, updateData)

    logger.info(`Vault entry updated: ${req.params.id}`)

    res.json({
      success: true,
      data: { id: req.params.id, ...updateData },
    })
  } catch (error: any) {
    logger.error('Update vault error:', error)
    res.status(500).json({ error: 'Failed to update vault entry' })
  }
})

// DELETE /api/vault/:id - Delete secret
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const db = getDatabase()
    const vault = VaultQueries.findById(db, req.params.id)

    if (!vault || vault.user_id !== req.userId) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    VaultQueries.deleteById(db, req.params.id)

    logger.info(`Vault entry deleted: ${req.params.id}`)

    res.json({ success: true })
  } catch (error: any) {
    logger.error('Delete vault error:', error)
    res.status(500).json({ error: 'Failed to delete vault entry' })
  }
})

export default router
