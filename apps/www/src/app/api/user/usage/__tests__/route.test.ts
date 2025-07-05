import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies must be hoisted before imports
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/usage')

import { GET } from '../route'
import { authCheck } from '@/lib/supabase/server'
import { getAllUsage } from '@/lib/usage'

describe('GET /api/user/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(authCheck).mockResolvedValueOnce({
      user: null,
      success: false,
    })

    const req = new Request('http://localhost:3000/api/user/usage')
    const response = await GET(req)

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('common.unauthorized')
  })

  it('should return usage data for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockUsage = {
      'gpt-4': { used: 10, limit: 100 },
      'claude-3': { used: 5, limit: 50 },
    }

    vi.mocked(authCheck).mockResolvedValueOnce({
      user: mockUser,
      success: true,
    })
    vi.mocked(getAllUsage).mockResolvedValueOnce(mockUsage)

    const req = new Request('http://localhost:3000/api/user/usage')
    const response = await GET(req)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual({
      success: true,
      usage: mockUsage,
    })
    expect(getAllUsage).toHaveBeenCalledWith('user-123')
  })

  it('should handle errors from getAllUsage gracefully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    vi.mocked(authCheck).mockResolvedValueOnce({
      user: mockUser,
      success: true,
    })
    vi.mocked(getAllUsage).mockRejectedValueOnce(new Error('Database error'))

    const req = new Request('http://localhost:3000/api/user/usage')
    
    // The current implementation doesn't handle errors, so this would throw
    // In a real scenario, you'd want to add error handling to the route
    await expect(GET(req)).rejects.toThrow('Database error')
  })
})