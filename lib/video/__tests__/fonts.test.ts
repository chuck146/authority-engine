import { describe, it, expect } from 'vitest'
import {
  FONT_CATALOG,
  FONT_CATEGORY_LABELS,
  getFontsByCategory,
  type FontCategory,
} from '@/lib/video/fonts'

describe('FONT_CATALOG', () => {
  it('has exactly 12 entries', () => {
    expect(FONT_CATALOG).toHaveLength(12)
  })

  it('each entry has id, name, category, and googleFamily', () => {
    for (const font of FONT_CATALOG) {
      expect(font).toHaveProperty('id')
      expect(font).toHaveProperty('name')
      expect(font).toHaveProperty('category')
      expect(font).toHaveProperty('googleFamily')
      expect(typeof font.id).toBe('string')
      expect(typeof font.name).toBe('string')
      expect(typeof font.googleFamily).toBe('string')
    }
  })

  it('has correct category distribution: sans=2, serif=3, script=2, display=4, mono=1', () => {
    const counts: Record<string, number> = {}
    for (const font of FONT_CATALOG) {
      counts[font.category] = (counts[font.category] ?? 0) + 1
    }
    expect(counts).toEqual({
      sans: 2,
      serif: 3,
      script: 2,
      display: 4,
      mono: 1,
    })
  })

  it('all font IDs are unique', () => {
    const ids = FONT_CATALOG.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('multi-word googleFamily names use + separator', () => {
    const multiWord = FONT_CATALOG.filter((f) => f.name.includes(' '))
    for (const font of multiWord) {
      expect(font.googleFamily).toContain('+')
      expect(font.googleFamily).not.toContain(' ')
    }
  })

  it('single-word googleFamily names have no +', () => {
    const singleWord = FONT_CATALOG.filter((f) => !f.name.includes(' '))
    for (const font of singleWord) {
      expect(font.googleFamily).not.toContain('+')
    }
  })
})

describe('FONT_CATEGORY_LABELS', () => {
  it('maps all 5 categories to display names', () => {
    const categories: FontCategory[] = ['sans', 'serif', 'script', 'display', 'mono']
    for (const cat of categories) {
      expect(FONT_CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof FONT_CATEGORY_LABELS[cat]).toBe('string')
    }
  })

  it('has expected label values', () => {
    expect(FONT_CATEGORY_LABELS.sans).toBe('Sans-Serif')
    expect(FONT_CATEGORY_LABELS.serif).toBe('Serif')
    expect(FONT_CATEGORY_LABELS.script).toBe('Script')
    expect(FONT_CATEGORY_LABELS.display).toBe('Display')
    expect(FONT_CATEGORY_LABELS.mono).toBe('Monospace')
  })
})

describe('getFontsByCategory', () => {
  it('returns all 5 category keys', () => {
    const grouped = getFontsByCategory()
    expect(Object.keys(grouped).sort()).toEqual(['display', 'mono', 'sans', 'script', 'serif'])
  })

  it('groups sans fonts correctly', () => {
    const grouped = getFontsByCategory()
    const ids = grouped.sans.map((f) => f.id)
    expect(ids).toEqual(['DMSans', 'Montserrat'])
  })

  it('groups serif fonts correctly', () => {
    const grouped = getFontsByCategory()
    const ids = grouped.serif.map((f) => f.id)
    expect(ids).toEqual(['PlayfairDisplay', 'CormorantGaramond', 'Italiana'])
  })

  it('groups script fonts correctly', () => {
    const grouped = getFontsByCategory()
    const ids = grouped.script.map((f) => f.id)
    expect(ids).toEqual(['Pacifico', 'Satisfy'])
  })

  it('groups display fonts correctly', () => {
    const grouped = getFontsByCategory()
    const ids = grouped.display.map((f) => f.id)
    expect(ids).toEqual(['Anton', 'BebasNeue', 'Oswald', 'BarlowCondensed'])
  })

  it('groups mono fonts correctly', () => {
    const grouped = getFontsByCategory()
    const ids = grouped.mono.map((f) => f.id)
    expect(ids).toEqual(['SpaceMono'])
  })
})
