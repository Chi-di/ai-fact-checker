import { detectInputType, parsePendingCheck } from '@/lib/heroUtils'

describe('detectInputType', () => {
  it('returns url for https:// prefix', () => {
    expect(detectInputType('https://example.com/article')).toBe('url')
  })

  it('returns url for http:// prefix', () => {
    expect(detectInputType('http://example.com/article')).toBe('url')
  })

  it('returns text for plain prose', () => {
    expect(detectInputType('AI said the moon is made of cheese')).toBe('text')
  })

  it('returns text for empty string', () => {
    expect(detectInputType('')).toBe('text')
  })
})

describe('parsePendingCheck', () => {
  it('parses valid text entry', () => {
    const raw = JSON.stringify({ input: 'some text', inputType: 'text' })
    expect(parsePendingCheck(raw)).toEqual({ input: 'some text', inputType: 'text' })
  })

  it('parses valid url entry', () => {
    const raw = JSON.stringify({ input: 'https://example.com', inputType: 'url' })
    expect(parsePendingCheck(raw)).toEqual({ input: 'https://example.com', inputType: 'url' })
  })

  it('returns null for malformed JSON', () => {
    expect(parsePendingCheck('not-json')).toBeNull()
  })

  it('returns null when input field is empty string', () => {
    const raw = JSON.stringify({ input: '', inputType: 'text' })
    expect(parsePendingCheck(raw)).toBeNull()
  })

  it('returns null when input field is missing', () => {
    const raw = JSON.stringify({ inputType: 'text' })
    expect(parsePendingCheck(raw)).toBeNull()
  })
})
