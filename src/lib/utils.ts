let counter = 0
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateId(): string {
  const ts = Date.now().toString(36)
  const rand = Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  counter++
  return `${ts}-${rand}-${counter}`
}

export function getTimestamp(): string {
  return new Date().toISOString()
}
