import { vi } from 'vitest'

type MockChain = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  returns: ReturnType<typeof vi.fn>
  from: ReturnType<typeof vi.fn>
  auth: { getUser: ReturnType<typeof vi.fn> }
}

export function createMockSupabaseClient() {
  const chain: MockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    returns: vi.fn(),
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  }

  // Wire up chainable methods — each returns the chain object
  chain.from.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.insert.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.returns.mockReturnValue(chain)
  chain.single.mockResolvedValue({ data: null, error: null })

  return chain
}
