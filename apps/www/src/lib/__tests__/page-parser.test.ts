import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PageParser, parseUrl } from '../page-parser'

// Mock fetch globally
global.fetch = vi.fn()

describe('PageParser', () => {
  const parser = new PageParser()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseUrl', () => {
    it('should reject invalid URL protocols', async () => {
      await expect(parser.parseUrl('ftp://example.com')).rejects.toThrow(
        'Invalid URL protocol. Only HTTP and HTTPS are supported.'
      )
    })

    it('should parse valid HTML content', async () => {
      const mockHtml = `
        <html>
          <body>
            <article>
              <h1>Test Article</h1>
              <p>This is a test paragraph with some content.</p>
              <p>Another paragraph here.</p>
            </article>
          </body>
        </html>
      `

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
        headers: new Headers({ 'content-type': 'text/html' }),
      })

      const result = await parser.parseUrl('https://example.com')

      expect(result).toMatchObject({
        url: 'https://example.com',
        content: expect.stringContaining('Test Article'),
        wordCount: expect.any(Number),
      })
      expect(result.wordCount).toBeGreaterThan(0)
    })

    it('should handle fetch errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(parser.parseUrl('https://example.com')).rejects.toThrow(
        'Failed to parse URL: Network error'
      )
    })

    it('should respect maxContentLength option', async () => {
      const longContent = 'a'.repeat(1000)
      const mockHtml = `<html><body><p>${longContent}</p></body></html>`

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
        headers: new Headers({ 'content-type': 'text/html' }),
      })

      const result = await parser.parseUrl('https://example.com', {
        maxContentLength: 100,
      })

      // Allow for some margin as the truncation might include ellipsis
      expect(result.content.length).toBeLessThanOrEqual(105)
    })
  })

  describe('parseUrl utility function', () => {
    it('should work as a standalone function', async () => {
      const mockHtml = '<html><body><h1>Test</h1></body></html>'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
        headers: new Headers({ 'content-type': 'text/html' }),
      })

      const result = await parseUrl('https://example.com')

      expect(result).toMatchObject({
        url: 'https://example.com',
        content: expect.stringContaining('Test'),
        wordCount: 1,
      })
    })
  })
})