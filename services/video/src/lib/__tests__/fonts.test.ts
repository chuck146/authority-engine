import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all @remotion/google-fonts imports
const mockLoaders: Record<string, ReturnType<typeof vi.fn>> = {
  DMSans: vi.fn(),
  Montserrat: vi.fn(),
  PlayfairDisplay: vi.fn(),
  CormorantGaramond: vi.fn(),
  Pacifico: vi.fn(),
  Satisfy: vi.fn(),
  Anton: vi.fn(),
  BebasNeue: vi.fn(),
  Oswald: vi.fn(),
  BarlowCondensed: vi.fn(),
  SpaceMono: vi.fn(),
  Italiana: vi.fn(),
}

vi.mock('@remotion/google-fonts/DMSans', () => ({ loadFont: mockLoaders.DMSans }))
vi.mock('@remotion/google-fonts/Montserrat', () => ({ loadFont: mockLoaders.Montserrat }))
vi.mock('@remotion/google-fonts/PlayfairDisplay', () => ({
  loadFont: mockLoaders.PlayfairDisplay,
}))
vi.mock('@remotion/google-fonts/CormorantGaramond', () => ({
  loadFont: mockLoaders.CormorantGaramond,
}))
vi.mock('@remotion/google-fonts/Pacifico', () => ({ loadFont: mockLoaders.Pacifico }))
vi.mock('@remotion/google-fonts/Satisfy', () => ({ loadFont: mockLoaders.Satisfy }))
vi.mock('@remotion/google-fonts/Anton', () => ({ loadFont: mockLoaders.Anton }))
vi.mock('@remotion/google-fonts/BebasNeue', () => ({ loadFont: mockLoaders.BebasNeue }))
vi.mock('@remotion/google-fonts/Oswald', () => ({ loadFont: mockLoaders.Oswald }))
vi.mock('@remotion/google-fonts/BarlowCondensed', () => ({
  loadFont: mockLoaders.BarlowCondensed,
}))
vi.mock('@remotion/google-fonts/SpaceMono', () => ({ loadFont: mockLoaders.SpaceMono }))
vi.mock('@remotion/google-fonts/Italiana', () => ({ loadFont: mockLoaders.Italiana }))

// Must re-import after mocks to get fresh module per test
let fontsModule: typeof import('@/services/video/src/lib/fonts')

beforeEach(async () => {
  vi.clearAllMocks()
  // Reset the module to clear the loadedFonts Set
  vi.resetModules()

  // Re-mock after resetModules
  vi.doMock('@remotion/google-fonts/DMSans', () => ({ loadFont: mockLoaders.DMSans }))
  vi.doMock('@remotion/google-fonts/Montserrat', () => ({ loadFont: mockLoaders.Montserrat }))
  vi.doMock('@remotion/google-fonts/PlayfairDisplay', () => ({
    loadFont: mockLoaders.PlayfairDisplay,
  }))
  vi.doMock('@remotion/google-fonts/CormorantGaramond', () => ({
    loadFont: mockLoaders.CormorantGaramond,
  }))
  vi.doMock('@remotion/google-fonts/Pacifico', () => ({ loadFont: mockLoaders.Pacifico }))
  vi.doMock('@remotion/google-fonts/Satisfy', () => ({ loadFont: mockLoaders.Satisfy }))
  vi.doMock('@remotion/google-fonts/Anton', () => ({ loadFont: mockLoaders.Anton }))
  vi.doMock('@remotion/google-fonts/BebasNeue', () => ({ loadFont: mockLoaders.BebasNeue }))
  vi.doMock('@remotion/google-fonts/Oswald', () => ({ loadFont: mockLoaders.Oswald }))
  vi.doMock('@remotion/google-fonts/BarlowCondensed', () => ({
    loadFont: mockLoaders.BarlowCondensed,
  }))
  vi.doMock('@remotion/google-fonts/SpaceMono', () => ({ loadFont: mockLoaders.SpaceMono }))
  vi.doMock('@remotion/google-fonts/Italiana', () => ({ loadFont: mockLoaders.Italiana }))

  fontsModule = await import('@/services/video/src/lib/fonts')
})

describe('AVAILABLE_FONTS', () => {
  it('has exactly 12 entries', () => {
    expect(fontsModule.AVAILABLE_FONTS).toHaveLength(12)
  })

  it('each entry has id, name, family, and category', () => {
    for (const font of fontsModule.AVAILABLE_FONTS) {
      expect(font).toHaveProperty('id')
      expect(font).toHaveProperty('name')
      expect(font).toHaveProperty('family')
      expect(font).toHaveProperty('category')
    }
  })

  it('IDs match the frontend FONT_CATALOG IDs', async () => {
    const { FONT_CATALOG } = await import('@/lib/video/fonts')
    const catalogIds = FONT_CATALOG.map((f) => f.id).sort()
    const availableIds = fontsModule.AVAILABLE_FONTS.map((f) => f.id).sort()
    expect(availableIds).toEqual(catalogIds)
  })
})

describe('getFontFamily', () => {
  it('returns "DM Sans" for DMSans', () => {
    expect(fontsModule.getFontFamily('DMSans')).toBe('DM Sans')
  })

  it('returns "Montserrat" for Montserrat', () => {
    expect(fontsModule.getFontFamily('Montserrat')).toBe('Montserrat')
  })

  it('returns "Playfair Display" for PlayfairDisplay', () => {
    expect(fontsModule.getFontFamily('PlayfairDisplay')).toBe('Playfair Display')
  })

  it('returns "Cormorant Garamond" for CormorantGaramond', () => {
    expect(fontsModule.getFontFamily('CormorantGaramond')).toBe('Cormorant Garamond')
  })

  it('returns "Bebas Neue" for BebasNeue', () => {
    expect(fontsModule.getFontFamily('BebasNeue')).toBe('Bebas Neue')
  })

  it('returns "Space Mono" for SpaceMono', () => {
    expect(fontsModule.getFontFamily('SpaceMono')).toBe('Space Mono')
  })

  it('falls back to "DM Sans" for unknown font ID', () => {
    expect(fontsModule.getFontFamily('UnknownFont')).toBe('DM Sans')
  })

  it('loads the requested font via its loader', () => {
    fontsModule.getFontFamily('Anton')
    expect(mockLoaders.Anton).toHaveBeenCalledOnce()
  })

  it('loads DMSans as fallback when unknown font requested', () => {
    fontsModule.getFontFamily('UnknownFont')
    expect(mockLoaders.DMSans).toHaveBeenCalledOnce()
  })
})

describe('loadFont', () => {
  it('calls the loader function for a known font', () => {
    fontsModule.loadFont('Pacifico')
    expect(mockLoaders.Pacifico).toHaveBeenCalledOnce()
  })

  it('is idempotent — second call does not re-invoke loader', () => {
    fontsModule.loadFont('Oswald')
    fontsModule.loadFont('Oswald')
    expect(mockLoaders.Oswald).toHaveBeenCalledOnce()
  })

  it('silently ignores unknown font IDs', () => {
    expect(() => fontsModule.loadFont('NonExistentFont')).not.toThrow()
  })
})

describe('ensureFontsLoaded', () => {
  it('returns dmSans and montserrat family strings', () => {
    const result = fontsModule.ensureFontsLoaded()
    expect(result).toEqual({
      dmSans: 'DM Sans',
      montserrat: 'Montserrat',
    })
  })

  it('loads both DM Sans and Montserrat fonts', () => {
    fontsModule.ensureFontsLoaded()
    expect(mockLoaders.DMSans).toHaveBeenCalledOnce()
    expect(mockLoaders.Montserrat).toHaveBeenCalledOnce()
  })
})
