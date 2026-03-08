/**
 * Shared font catalog for video generation UI.
 * This file is safe to import from Next.js client components —
 * it does NOT import any @remotion/* packages.
 */

export type FontCategory = 'sans' | 'serif' | 'script' | 'display' | 'mono'

export type FontCatalogEntry = {
  id: string
  name: string
  category: FontCategory
  /** Google Fonts family name for CSS @import previews */
  googleFamily: string
}

export const FONT_CATALOG: FontCatalogEntry[] = [
  // Sans
  { id: 'DMSans', name: 'DM Sans', category: 'sans', googleFamily: 'DM+Sans' },
  { id: 'Montserrat', name: 'Montserrat', category: 'sans', googleFamily: 'Montserrat' },
  // Serif
  {
    id: 'PlayfairDisplay',
    name: 'Playfair Display',
    category: 'serif',
    googleFamily: 'Playfair+Display',
  },
  {
    id: 'CormorantGaramond',
    name: 'Cormorant Garamond',
    category: 'serif',
    googleFamily: 'Cormorant+Garamond',
  },
  { id: 'Italiana', name: 'Italiana', category: 'serif', googleFamily: 'Italiana' },
  // Script
  { id: 'Pacifico', name: 'Pacifico', category: 'script', googleFamily: 'Pacifico' },
  { id: 'Satisfy', name: 'Satisfy', category: 'script', googleFamily: 'Satisfy' },
  // Display
  { id: 'Anton', name: 'Anton', category: 'display', googleFamily: 'Anton' },
  { id: 'BebasNeue', name: 'Bebas Neue', category: 'display', googleFamily: 'Bebas+Neue' },
  { id: 'Oswald', name: 'Oswald', category: 'display', googleFamily: 'Oswald' },
  {
    id: 'BarlowCondensed',
    name: 'Barlow Condensed',
    category: 'display',
    googleFamily: 'Barlow+Condensed',
  },
  // Mono
  { id: 'SpaceMono', name: 'Space Mono', category: 'mono', googleFamily: 'Space+Mono' },
]

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: 'Sans-Serif',
  serif: 'Serif',
  script: 'Script',
  display: 'Display',
  mono: 'Monospace',
}

/** Get fonts grouped by category for select dropdown rendering */
export function getFontsByCategory(): Record<FontCategory, FontCatalogEntry[]> {
  const grouped: Record<FontCategory, FontCatalogEntry[]> = {
    sans: [],
    serif: [],
    script: [],
    display: [],
    mono: [],
  }
  for (const font of FONT_CATALOG) {
    grouped[font.category].push(font)
  }
  return grouped
}
