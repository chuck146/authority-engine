import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext, UserRole } from '@/types'

export async function requireAuth(): Promise<AuthContext> {
  // Dev bypass: return hardcoded Cleanest Painting context
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return {
      userId: '00000000-0000-0000-0000-000000000002',
      organizationId: '00000000-0000-0000-0000-000000000001',
      role: 'owner' as UserRole,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Query user_organizations directly instead of relying on app_metadata.
  // The custom_access_token_hook injects organization_id into JWT claims
  // (used by RLS), but getUser() returns raw_app_meta_data from auth.users
  // which doesn't have it.
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single<{ organization_id: string; role: string }>()

  if (!membership) {
    redirect('/login?error=no_organization')
  }

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    role: (membership.role ?? 'viewer') as UserRole,
  }
}

export async function requireRole(minimumRole: UserRole): Promise<AuthContext> {
  const context = await requireAuth()
  const hierarchy: UserRole[] = ['viewer', 'editor', 'admin', 'owner']
  const userLevel = hierarchy.indexOf(context.role)
  const requiredLevel = hierarchy.indexOf(minimumRole)

  if (userLevel < requiredLevel) {
    redirect('/dashboard?error=insufficient_permissions')
  }

  return context
}
