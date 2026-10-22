import { revalidatePath } from 'next/cache'

// Published content feeds more than its own page: hub pages, header/footer
// links, related-content blocks, and the sitemap. Marketing pages are ISR-cached,
// so purge everything under the root layout whenever public content changes.
export function revalidateMarketingSite(): void {
  revalidatePath('/', 'layout')
}
