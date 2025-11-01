export function validateUsername(username: string): boolean {
  // 3-50 characters, alphanumeric + underscore
  return /^[a-zA-Z0-9_]{3,50}$/.test(username)
}

export function validatePassword(password: string): boolean {
  // At least 12 characters
  return password.length >= 12
}

export function validateTotpCode(code: string): boolean {
  // 6 digits
  return /^\d{6}$/.test(code)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateFilename(filename: string): boolean {
  // No path traversal, max 255 chars
  return (
    filename.length > 0 &&
    filename.length <= 255 &&
    !filename.includes('/') &&
    !filename.includes('\\') &&
    !filename.includes('..')
  )
}

export function sanitizeFilename(filename: string): string {
  // Remove any dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .substring(0, 255)
}
