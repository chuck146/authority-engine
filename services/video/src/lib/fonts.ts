import { loadFont as loadDmSans } from '@remotion/google-fonts/DMSans'
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat'
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay'
import { loadFont as loadCormorantGaramond } from '@remotion/google-fonts/CormorantGaramond'
import { loadFont as loadPacifico } from '@remotion/google-fonts/Pacifico'
import { loadFont as loadSatisfy } from '@remotion/google-fonts/Satisfy'
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton'
import { loadFont as loadBebasNeue } from '@remotion/google-fonts/BebasNeue'
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald'
import { loadFont as loadBarlowCondensed } from '@remotion/google-fonts/BarlowCondensed'
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono'
import { loadFont as loadItaliana } from '@remotion/google-fonts/Italiana'

export type FontCategory = 'sans' | 'serif' | 'script' | 'display' | 'mono'

export type FontInfo = {
  id: string
  name: string
  family: string
  category: FontCategory
}

const FONT_LOADERS: Record<string, () => void> = {
  DMSans: loadDmSans,
  Montserrat: loadMontserrat,
  PlayfairDisplay: loadPlayfairDisplay,
  CormorantGaramond: loadCormorantGaramond,
  Pacifico: loadPacifico,
  Satisfy: loadSatisfy,
  Anton: loadAnton,
  BebasNeue: loadBebasNeue,
  Oswald: loadOswald,
  BarlowCondensed: loadBarlowCondensed,
  SpaceMono: loadSpaceMono,
  Italiana: loadItaliana,
}

const FONT_FAMILIES: Record<string, string> = {
  DMSans: 'DM Sans',
  Montserrat: 'Montserrat',
  PlayfairDisplay: 'Playfair Display',
  CormorantGaramond: 'Cormorant Garamond',
  Pacifico: 'Pacifico',
  Satisfy: 'Satisfy',
  Anton: 'Anton',
  BebasNeue: 'Bebas Neue',
  Oswald: 'Oswald',
  BarlowCondensed: 'Barlow Condensed',
  SpaceMono: 'Space Mono',
  Italiana: 'Italiana',
}

export const AVAILABLE_FONTS: FontInfo[] = [
  { id: 'DMSans', name: 'DM Sans', family: 'DM Sans', category: 'sans' },
  { id: 'Montserrat', name: 'Montserrat', family: 'Montserrat', category: 'sans' },
  {
    id: 'PlayfairDisplay',
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'serif',
  },
  {
    id: 'CormorantGaramond',
    name: 'Cormorant Garamond',
    family: 'Cormorant Garamond',
    category: 'serif',
  },
  { id: 'Italiana', name: 'Italiana', family: 'Italiana', category: 'serif' },
  { id: 'Pacifico', name: 'Pacifico', family: 'Pacifico', category: 'script' },
  { id: 'Satisfy', name: 'Satisfy', family: 'Satisfy', category: 'script' },
  { id: 'Anton', name: 'Anton', family: 'Anton', category: 'display' },
  { id: 'BebasNeue', name: 'Bebas Neue', family: 'Bebas Neue', category: 'display' },
  { id: 'Oswald', name: 'Oswald', family: 'Oswald', category: 'display' },
  {
    id: 'BarlowCondensed',
    name: 'Barlow Condensed',
    family: 'Barlow Condensed',
    category: 'display',
  },
  { id: 'SpaceMono', name: 'Space Mono', family: 'Space Mono', category: 'mono' },
]

const loadedFonts = new Set<string>()

/**
 * Load a specific font by ID. Safe to call multiple times — each font only loads once.
 */
export function loadFont(fontId: string): void {
  if (loadedFonts.has(fontId)) return
  const loader = FONT_LOADERS[fontId]
  if (loader) {
    loader()
    loadedFonts.add(fontId)
  }
}

/**
 * Load a font and return its CSS font-family string.
 * Falls back to DM Sans if the font ID is unknown.
 */
export function getFontFamily(fontId: string): string {
  const family = FONT_FAMILIES[fontId]
  if (!family) {
    loadFont('DMSans')
    return 'DM Sans'
  }
  loadFont(fontId)
  return family
}

/**
 * Legacy helper — loads DM Sans + Montserrat and returns their family strings.
 * @deprecated Use getFontFamily() instead for brand-driven font loading.
 */
export function ensureFontsLoaded(): { dmSans: string; montserrat: string } {
  loadFont('DMSans')
  loadFont('Montserrat')
  return {
    dmSans: 'DM Sans',
    montserrat: 'Montserrat',
  }
}
