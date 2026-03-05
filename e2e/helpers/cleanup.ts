import { createAdminClient } from './supabase-admin'
import { TEST_USER_EMAIL } from './test-data'

// Delete all test-generated content so E2E runs are repeatable.
// Deletes calendar entries first (FK), then content rows, by matching created_by user.
export async function cleanupTestContent() {
  const admin = createAdminClient()

  // Look up the test user
  const { data: users } = await admin.auth.admin.listUsers()
  const testUser = users?.users.find((u) => u.email === TEST_USER_EMAIL)
  if (!testUser) return

  // Delete calendar entries created by test user
  await admin.from('content_calendar').delete().eq('created_by', testUser.id)

  // Delete content rows created by test user (all three tables)
  for (const table of ['service_pages', 'location_pages', 'blog_posts'] as const) {
    await admin.from(table).delete().eq('created_by', testUser.id)
  }
}
