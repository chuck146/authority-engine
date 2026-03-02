import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext, UserRole } from '@/types'

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const organizationId = user.app_metadata?.organization_id as string | undefined

  if (!organizationId) {
    redirect('/login?error=no_organization')
  }

  const { data: membership } = await supabase
    .from('user_organizations')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single<{ role: string }>()

  return {
    userId: user.id,
    organizationId,
    role: (membership?.role ?? 'viewer') as UserRole,
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
