import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { CookieOptions } from 'hono/utils/cookie'
import { apiEnv } from '../env'

const scrypt = promisify(scryptCallback)

const SESSION_DURATION_HOURS = 12
const SESSION_DURATION_SECONDS = SESSION_DURATION_HOURS * 60 * 60
const PASSWORD_KEY_LENGTH = 64
const PASSWORD_HASH_SEPARATOR = ':'

// API 全体で使う認証 Cookie 名を一元管理する。
export const authSessionCookieName = apiEnv.AUTH_SESSION_COOKIE_NAME

const appendPepper = (password: string) => `${password}${apiEnv.AUTH_PASSWORD_PEPPER}`

export const createPasswordHash = async (password: string) => {
  // salt と pepper を併用して DB 流出時の耐性を上げる。
  const salt = randomBytes(16).toString('base64url')
  const derivedKey = (await scrypt(appendPepper(password), salt, PASSWORD_KEY_LENGTH)) as Buffer

  return ['scrypt', salt, derivedKey.toString('base64url')].join(PASSWORD_HASH_SEPARATOR)
}

export const verifyPasswordHash = async (password: string, storedHash: string) => {
  // 保存形式は `algorithm:salt:hash` に固定する。
  const [algorithm, salt, expectedHash] = storedHash.split(PASSWORD_HASH_SEPARATOR)

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false
  }

  const derivedKey = (await scrypt(appendPepper(password), salt, PASSWORD_KEY_LENGTH)) as Buffer
  const expectedBuffer = Buffer.from(expectedHash, 'base64url')

  if (derivedKey.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(derivedKey, expectedBuffer)
}

export const generateSessionToken = () => randomBytes(32).toString('base64url')

// DB には生のトークンではなくハッシュだけを保持する。
export const hashSessionToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export const createSessionExpiresAt = (baseDate = new Date()) =>
  new Date(baseDate.getTime() + SESSION_DURATION_SECONDS * 1000)

// ブラウザ側から読めない Cookie としてセッションを保持する。
export const createSessionCookieOptions = (expiresAt: Date): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
  expires: expiresAt,
  maxAge: SESSION_DURATION_SECONDS
})
