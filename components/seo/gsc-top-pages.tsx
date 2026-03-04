'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { PagePerformanceItem } from '@/types/gsc'

type GscTopPagesProps = {
  pages: PagePerformanceItem[]
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? u.hostname : u.pathname
  } catch {
    return url
  }
}

export function GscTopPages({ pages }: GscTopPagesProps) {
  if (pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No page data available yet.</p>
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
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((p) => (
              <TableRow key={p.page}>
                <TableCell className="max-w-[300px] truncate font-medium" title={p.page}>
                  {shortenUrl(p.page)}
                </TableCell>
                <TableCell className="text-right">{p.clicks}</TableCell>
                <TableCell className="text-right">{p.impressions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{(p.ctr * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{p.position.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
