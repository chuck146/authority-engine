import { test, expect } from '@playwright/test'
import { SERVICE_PAGE_INPUT, EDIT_PAYLOAD } from '../helpers/test-data'
import { cleanupTestContent } from '../helpers/cleanup'

// Direct publish path: generate → verify in dashboard → fetch detail → edit → approve → publish → verify SSR
test.describe('Content Lifecycle — Direct Publish', () => {
  let contentId: string
  let contentSlug: string

  test.afterAll(async () => {
    await cleanupTestContent()
  })

  test('1. Generate service page via API', async ({ request }) => {
    const response = await request.post('/api/v1/content/generate', {
      data: SERVICE_PAGE_INPUT,
    })

    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body.id).toBeTruthy()
    expect(body.contentType).toBe('service_page')
    expect(body.status).toBe('review')
    expect(body.slug).toBeTruthy()
    expect(body.content.headline).toBeTruthy()
    expect(body.content.sections.length).toBeGreaterThan(0)

    contentId = body.id
    contentSlug = body.slug
  })

  test('2. Verify content appears in dashboard', async ({ page }) => {
    await page.goto('/content')
    await page.waitForLoadState('networkidle')

    // The content table should show the generated page
    const row = page.locator('tr', { hasText: SERVICE_PAGE_INPUT.serviceName }).first()
    await expect(row).toBeVisible({ timeout: 10_000 })

    // Status badge should show "review"
    await expect(row.getByText('review', { exact: false })).toBeVisible()
  })

  test('3. Fetch content detail via API', async ({ request }) => {
    const response = await request.get(`/api/v1/content/service_page/${contentId}`)

    expect(response.status()).toBe(200)

    const detail = await response.json()
    expect(detail.id).toBe(contentId)
    expect(detail.type).toBe('service_page')
    expect(detail.status).toBe('review')
    expect(detail.content.headline).toBeTruthy()
    expect(detail.content.meta_title).toBeTruthy()
  })

  test('4. Edit meta_title via API', async ({ request }) => {
    const response = await request.put(`/api/v1/content/service_page/${contentId}`, {
      data: EDIT_PAYLOAD,
    })

    expect(response.status()).toBe(200)

    const updated = await response.json()
    expect(updated.metaTitle).toBe(EDIT_PAYLOAD.metaTitle)
    expect(updated.status).toBe('review') // Status unchanged
  })

  test('5. Approve content', async ({ request }) => {
    const response = await request.patch(`/api/v1/content/service_page/${contentId}/status`, {
      data: { action: 'approve' },
    })

    expect(response.status()).toBe(200)

    const result = await response.json()
    expect(result.status).toBe('approved')
    expect(result.action).toBe('approve')
  })

  test('6. Publish content', async ({ request }) => {
    const response = await request.patch(`/api/v1/content/service_page/${contentId}/status`, {
      data: { action: 'publish' },
    })

    expect(response.status()).toBe(200)

    const result = await response.json()
    expect(result.status).toBe('published')
    expect(result.action).toBe('publish')
  })

  test('7. Verify dashboard shows published status', async ({ page }) => {
    await page.goto('/content')
    await page.waitForLoadState('networkidle')

    const row = page.locator('tr', { hasText: SERVICE_PAGE_INPUT.serviceName }).first()
    await expect(row).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText('published', { exact: false })).toBeVisible()
  })

  test('8. Verify SSR page renders', async ({ page }) => {
    await page.goto(`/services/${contentSlug}`)

    // Page should render (not 404)
    await expect(page).not.toHaveURL(/.*404.*/)

    // Headline from generated content should be visible
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 10_000 })
    await expect(h1).not.toBeEmpty()

    // Edited meta_title should be in <title> tag
    const title = await page.title()
    expect(title).toContain(EDIT_PAYLOAD.metaTitle)

    // Content sections should be rendered
    const sections = page.locator('section, article, [data-section]')
    await expect(sections.first()).toBeVisible()
  })
})
