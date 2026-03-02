'use client'

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { UserNav } from '@/components/dashboard/user-nav'
import type { Organization, UserRole } from '@/types'

type DashboardShellProps = {
  organization: Organization
  userRole: UserRole
  children: React.ReactNode
}

export function DashboardShell({ organization, userRole, children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar organization={organization} userRole={userRole} />
      <main className="flex-1">
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
