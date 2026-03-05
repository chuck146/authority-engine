'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Ga4PageMetric } from '@/types/ga4'

type Ga4TopPagesProps = {
  pages: Ga4PageMetric[]
}

export function Ga4TopPages({ pages }: Ga4TopPagesProps) {
  if (pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No page data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Pageviews</TableHead>
              <TableHead className="text-right">Bounce Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((p) => (
              <TableRow key={p.pagePath}>
                <TableCell
                  className="max-w-[200px] truncate font-medium"
                  title={p.pageTitle || p.pagePath}
                >
                  {p.pagePath}
                </TableCell>
                <TableCell className="text-right">{p.sessions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{p.users.toLocaleString()}</TableCell>
                <TableCell className="text-right">{p.pageviews.toLocaleString()}</TableCell>
                <TableCell className="text-right">{(p.bounceRate * 100).toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
