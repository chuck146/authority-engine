'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SeoScoreBadge } from './seo-score-badge'
import type { SeoContentItem } from '@/types/seo'

type SeoContentListProps = {
  items: SeoContentItem[]
  onSelectItem: (item: SeoContentItem) => void
}

const typeLabels: Record<string, string> = {
  service_page: 'Service Page',
  location_page: 'Location Page',
  blog_post: 'Blog Post',
}

export function SeoContentList({ items, onSelectItem }: SeoContentListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-lg">No content to analyze</p>
        <p className="text-muted-foreground text-sm">
          Generate content first, then come back to see SEO scores.
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
          <TableHead>Top Issue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={`${item.contentType}-${item.id}`}
            className="cursor-pointer"
            onClick={() => onSelectItem(item)}
          >
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell>
              <Badge variant="secondary">{typeLabels[item.contentType]}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{item.status}</Badge>
            </TableCell>
            <TableCell>
              <SeoScoreBadge score={item.seoScore} />
            </TableCell>
            <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
              {item.topIssue ?? 'All checks passed'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
