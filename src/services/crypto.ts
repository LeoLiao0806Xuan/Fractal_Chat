const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 100000

async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  )
  // Cast salt to satisfy TS strict ArrayBuffer type
  const pbkdf2Params: Pbkdf2Params = { name: 'PBKDF2', salt: salt as Uint8Array<ArrayBuffer>, iterations: ITERATIONS, hash: 'SHA-256' }
  return crypto.subtle.deriveKey(
    pbkdf2Params,
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, ['encrypt', 'decrypt']
  )
}

export async function encryptAPIKey(apiKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getKey(password, salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv }, key, new TextEncoder().encode(apiKey)
  )
  const encArray = new Uint8Array(encrypted)
  const combined = new Uint8Array(salt.length + iv.length + encArray.length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(encArray, salt.length + iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptAPIKey(encryptedData: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const data = combined.slice(28)
  const key = await getKey(password, salt)
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)
  return new TextDecoder().decode(decrypted)
}

// ── Session key store (raw keys kept in memory only) ──
const sessionKeyStore = new Map<string, string>()

export function storeSessionKey(modelId: string, rawKey: string) {
  sessionKeyStore.set(modelId, rawKey)
}

export function getSessionKey(modelId: string): string | undefined {
  return sessionKeyStore.get(modelId)
}

// Session password (used to encrypt new keys)
let sessionPassword: string | null = null

export function setSessionPassword(pw: string) {
  sessionPassword = pw
}

export function getSessionPassword(): string | null {
  return sessionPassword
}
