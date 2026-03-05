'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  ImageIcon,
  Search,
  Share2,
  Star,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { Organization, UserRole } from '@/types'
import type { OrgBranding } from '@/types'

const navItems = [
  { title: 'Dashboard', href: '/dashboard' as const, icon: LayoutDashboard },
  { title: 'Content', href: '/content' as const, icon: FileText },
  { title: 'Calendar', href: '/calendar' as const, icon: CalendarDays },
  { title: 'Media', href: '/media' as const, icon: ImageIcon },
  { title: 'Social & GBP', href: '/social' as const, icon: Share2 },
  { title: 'SEO', href: '/seo' as const, icon: Search },
  { title: 'Reviews', href: '/reviews' as const, icon: Star },
  { title: 'Community', href: '/community' as const, icon: Users },
  { title: 'Analytics', href: '/analytics' as const, icon: BarChart3 },
]

type AppSidebarProps = {
  organization: Organization
  userRole: UserRole
}

export function AppSidebar({ organization, userRole }: AppSidebarProps) {
  const pathname = usePathname()
  const branding = organization.branding as OrgBranding | null

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg"
            style={{ backgroundColor: branding?.primary ?? '#1a472a' }}
          />
          <div>
            <p className="text-sm font-semibold">{organization.name}</p>
            <p className="text-muted-foreground text-xs">{userRole}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
