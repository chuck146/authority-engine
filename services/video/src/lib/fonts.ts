import { loadFont as loadDmSans } from '@remotion/google-fonts/DMSans'
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat'

let fontsLoaded = false

export function ensureFontsLoaded(): { dmSans: string; montserrat: string } {
  if (!fontsLoaded) {
    loadDmSans()
    loadMontserrat()
    fontsLoaded = true
  }

  return {
    dmSans: 'DM Sans',
    montserrat: 'Montserrat',
  }
}
