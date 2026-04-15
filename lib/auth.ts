import crypto from 'crypto'
import { cookies } from 'next/headers'

const AUTH_SECRET = process.env.AUTH_SECRET || 'art-core-dev-secret-key-change-in-production'
const TOKEN_COOKIE = 'art_core_token'
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey))
    })
  })
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url')
}

export function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + TOKEN_MAX_AGE * 1000 })
  ).toString('base64url')
  return `${payload}.${signPayload(payload)}`
}

export function verifyToken(token: string): { userId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  if (signPayload(payload) !== signature) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.exp < Date.now()) return null
    return { userId: data.userId }
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export { TOKEN_COOKIE, TOKEN_MAX_AGE }
