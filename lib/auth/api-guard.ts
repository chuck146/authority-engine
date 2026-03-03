import { createClient } from '@/lib/supabase/server'
import type { AuthContext, UserRole } from '@/types'

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireApiAuth(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Unauthorized', 401)
  }

  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single<{ organization_id: string; role: string }>()

  if (!membership) {
    throw new AuthError('No organization found', 403)
  }

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    role: (membership.role ?? 'viewer') as UserRole,
  }
}

export async function requireApiRole(minimumRole: UserRole): Promise<AuthContext> {
  const context = await requireApiAuth()
  const hierarchy: UserRole[] = ['viewer', 'editor', 'admin', 'owner']
  const userLevel = hierarchy.indexOf(context.role)
  const requiredLevel = hierarchy.indexOf(minimumRole)

  if (userLevel < requiredLevel) {
    throw new AuthError('Insufficient permissions', 403)
  }

  return context
}
