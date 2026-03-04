import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt } from '../token-manager'

// 32 bytes = 64 hex chars
const TEST_KEY = 'a'.repeat(64)

beforeEach(() => {
  vi.stubEnv('GSC_ENCRYPTION_KEY', TEST_KEY)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('encrypt/decrypt', () => {
  it('round-trips a string through AES-256-GCM', () => {
    const original = 'ya29.test-access-token-12345'
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertext for same input (random IV)', () => {
    const original = 'same-input'
    const a = encrypt(original)
    const b = encrypt(original)
    expect(a).not.toBe(b)
    // But both decrypt to the same thing
    expect(decrypt(a)).toBe(original)
    expect(decrypt(b)).toBe(original)
  })

  it('encrypted format has 3 colon-separated parts', () => {
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
  })

  it('throws on invalid encrypted format', () => {
    expect(() => decrypt('invalid')).toThrow('Invalid encrypted token format')
  })

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')
    // Flip a character in the ciphertext
    const tampered = parts[0] + ':' + parts[1] + ':' + 'AAAA' + parts[2]!.slice(4)
    expect(() => decrypt(tampered)).toThrow()
  })

  it('throws if encryption key is wrong length', () => {
    vi.stubEnv('GSC_ENCRYPTION_KEY', 'too-short')
    expect(() => encrypt('test')).toThrow('64-character hex string')
  })

  it('handles empty string', () => {
    const encrypted = encrypt('')
    expect(decrypt(encrypted)).toBe('')
  })

  it('handles long tokens', () => {
    const longToken = 'ya29.' + 'x'.repeat(2000)
    const encrypted = encrypt(longToken)
    expect(decrypt(encrypted)).toBe(longToken)
  })
})
