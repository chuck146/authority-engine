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
import type { KeywordRankingItem } from '@/types/gsc'

type GscTopQueriesProps = {
  queries: KeywordRankingItem[]
}

function PositionChange({ change }: { change: number | null }) {
  if (change == null) return <span className="text-muted-foreground">—</span>
  if (change === 0) return <span className="text-muted-foreground">0</span>
  const isImproved = change > 0 // positive = position improved (went up)
  const color = isImproved ? 'text-green-600' : 'text-red-600'
  const arrow = isImproved ? '↑' : '↓'
  return (
    <span className={color}>
      {arrow}
      {Math.abs(change).toFixed(1)}
    </span>
  )
}

export function GscTopQueries({ queries }: GscTopQueriesProps) {
  if (queries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No query data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Queries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((q) => (
              <TableRow key={q.query}>
                <TableCell className="font-medium">{q.query}</TableCell>
                <TableCell className="text-right">{q.clicks}</TableCell>
                <TableCell className="text-right">{q.impressions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{(q.ctr * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{q.position.toFixed(1)}</TableCell>
                <TableCell className="text-right">
                  <PositionChange change={q.positionChange} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
