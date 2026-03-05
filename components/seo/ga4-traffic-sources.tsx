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
import type { Ga4TrafficSource } from '@/types/ga4'

type Ga4TrafficSourcesProps = {
  sources: Ga4TrafficSource[]
}

export function Ga4TrafficSources({ sources }: Ga4TrafficSourcesProps) {
  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No traffic source data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Users</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((s) => (
              <TableRow key={`${s.source}-${s.medium}`}>
                <TableCell className="font-medium">{s.source}</TableCell>
                <TableCell className="text-muted-foreground">{s.medium}</TableCell>
                <TableCell className="text-right">{s.sessions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{s.users.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
