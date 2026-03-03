'use client'

import { MoreHorizontal, CheckCircle, XCircle, Globe, Archive } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAvailableActions } from '@/lib/content/status-transitions'
import type { ContentListItem } from '@/types/content'
import type { ContentStatus, UserRole } from '@/types'

type ContentTableProps = {
  items: ContentListItem[]
  userRole: UserRole
  onSelectItem: (item: ContentListItem) => void
}

const typeLabels: Record<string, string> = {
  service_page: 'Service Page',
  location_page: 'Location Page',
  blog_post: 'Blog Post',
}

const statusVariant: Record<ContentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  review: 'outline',
  approved: 'default',
  published: 'default',
  archived: 'secondary',
}

const actionIcons: Record<string, typeof CheckCircle> = {
  approve: CheckCircle,
  reject: XCircle,
  publish: Globe,
  archive: Archive,
}

const actionLabels: Record<string, string> = {
  approve: 'Approve',
  reject: 'Reject',
  publish: 'Publish',
  archive: 'Archive',
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function ContentTable({ items, userRole, onSelectItem }: ContentTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-lg">No content yet</p>
        <p className="text-muted-foreground text-sm">
          Switch to the Generate tab to create your first page.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SEO Score</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const actions = getAvailableActions(item.status, userRole)

          return (
            <TableRow
              key={`${item.type}-${item.id}`}
              className="cursor-pointer"
              onClick={() => onSelectItem(item)}
            >
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{typeLabels[item.type]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
              </TableCell>
              <TableCell>{item.seoScore !== null ? `${item.seoScore}/100` : '--'}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
              <TableCell>
                {actions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {actions.map((action) => {
                        const Icon = actionIcons[action]
                        return (
                          <DropdownMenuItem
                            key={action}
                            onClick={() => onSelectItem(item)}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                            {actionLabels[action]}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
