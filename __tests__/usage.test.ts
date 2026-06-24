// __tests__/usage.test.ts
import { getFingerprint, checkAndIncrementUsage } from '@/lib/usage'

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn()
}))

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

beforeEach(() => {
  jest.resetAllMocks()
  const { createAdminClient } = require('@/lib/supabase/server')
  createAdminClient.mockReturnValue(mockSupabase)
})

describe('getFingerprint', () => {
  it('returns a 32-char hex string', () => {
    const fp = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    expect(fp).toHaveLength(32)
    expect(fp).toMatch(/^[a-f0-9]+$/)
  })

  it('returns the same fingerprint for same inputs', () => {
    const a = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    const b = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    expect(a).toBe(b)
  })

  it('returns different fingerprints for different IPs', () => {
    const a = getFingerprint('1.2.3.4', 'Mozilla/5.0')
    const b = getFingerprint('5.6.7.8', 'Mozilla/5.0')
    expect(a).not.toBe(b)
  })
})

describe('checkAndIncrementUsage', () => {
  it('returns allowed: true and no limit for team plan', async () => {
    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'team')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns allowed: true and no limit for lifetime plan', async () => {
    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'lifetime')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('blocks free user who has used 3 checks today', async () => {
    const mockSelect = jest.fn().mockReturnThis()
    const mockMatch = jest.fn().mockReturnThis()
    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: 'row-1', check_count: 3 }
    })
    mockFrom.mockReturnValue({ select: mockSelect, match: mockMatch, single: mockSingle })

    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'free')
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(3)
  })

  it('increments count and allows free user with 2 checks used', async () => {
    // Chainable builder for the atomic update path: .update().eq().lt().select().single()
    const updateSingle = jest.fn().mockResolvedValue({ data: { check_count: 3 }, error: null })
    const updateSelect = jest.fn().mockReturnValue({ single: updateSingle })
    const updateLt = jest.fn().mockReturnValue({ select: updateSelect })
    const updateEq = jest.fn().mockReturnValue({ lt: updateLt })
    const mockUpdate = jest.fn().mockReturnValue({ eq: updateEq })

    // Chainable builder for the initial read path: .select().match().single()
    const readSingle = jest.fn().mockResolvedValue({
      data: { id: 'row-1', check_count: 2 }
    })
    const mockMatch = jest.fn().mockReturnValue({ single: readSingle })
    const mockSelect = jest.fn().mockReturnValue({ match: mockMatch })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    const result = await checkAndIncrementUsage('user-1', 'fp-1', 'free')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(3)
  })

  it('allows free guest user with no existing usage and inserts row', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null })
    const mockSelect = jest.fn().mockReturnThis()
    const mockMatch = jest.fn().mockReturnThis()
    const mockSingle = jest.fn().mockResolvedValue({ data: null })
    mockFrom.mockReturnValue({
      select: mockSelect,
      match: mockMatch,
      single: mockSingle,
      insert: mockInsert
    })

    const result = await checkAndIncrementUsage(null, 'fp-guest', 'free')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(1)
    expect(result.limit).toBe(3)
  })

  it('allows pro user within monthly limit', async () => {
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockGte = jest.fn().mockResolvedValue({ count: 50, error: null })
    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte
    })

    const result = await checkAndIncrementUsage('user-pro', 'fp-pro', 'pro')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(50)
    expect(result.limit).toBe(200)
  })

  it('blocks pro user who has hit monthly limit of 200', async () => {
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockGte = jest.fn().mockResolvedValue({ count: 200, error: null })
    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte
    })

    const result = await checkAndIncrementUsage('user-pro', 'fp-pro', 'pro')
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(200)
    expect(result.limit).toBe(200)
  })
})
