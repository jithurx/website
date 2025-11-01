import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export class EncryptionService {
  private static getKey(): Buffer {
    const keyBase64 = process.env.ENCRYPTION_KEY
    if (!keyBase64) {
      throw new Error('ENCRYPTION_KEY environment variable not set')
    }
    const key = Buffer.from(keyBase64, 'base64')
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)')
    }
    return key
  }

  static generateIV(): Buffer {
    return crypto.randomBytes(IV_LENGTH)
  }

  static encrypt(plaintext: string | Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
    const key = EncryptionService.getKey()
    const iv = EncryptionService.generateIV()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, typeof plaintext === 'string' ? 'utf-8' : undefined)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    const authTag = cipher.getAuthTag()

    return {
      ciphertext: encrypted,
      iv,
      authTag,
    }
  }

  static decrypt(ciphertext: Buffer, iv: Buffer, authTag: Buffer): string {
    const key = EncryptionService.getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf-8')
  }

  static encryptFile(filePath: string, encryptedPath: string): { iv: Buffer; authTag: Buffer } {
    const key = EncryptionService.getKey()
    const iv = EncryptionService.generateIV()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const input = require('fs').createReadStream(filePath)
    const output = require('fs').createWriteStream(encryptedPath)

    input.pipe(cipher).pipe(output)

    return {
      iv,
      authTag: cipher.getAuthTag(),
    }
  }

  static decryptFile(encryptedPath: string, iv: Buffer, authTag: Buffer, outputPath: string): void {
    const key = EncryptionService.getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const input = require('fs').createReadStream(encryptedPath)
    const output = require('fs').createWriteStream(outputPath)

    input.pipe(decipher).pipe(output)
  }

  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  static generateRandomSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64')
  }
}
