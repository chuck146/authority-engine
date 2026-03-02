import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth()
  const supabase = await createClient()

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', auth.organizationId)
    .single()

  if (!organization) {
    redirect('/login?error=no_organization')
  }

  return (
    <DashboardShell organization={organization} userRole={auth.role}>
      {children}
    </DashboardShell>
  )
}
