'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { IndexingCoverage, GscSitemap } from '@/types/gsc'

type GscIndexingCoverageProps = {
  coverage: IndexingCoverage | null
  sitemaps: GscSitemap[]
}

export function GscIndexingCoverage({ coverage, sitemaps }: GscIndexingCoverageProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Indexing Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {coverage ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-green-600">{coverage.valid}</p>
                <p className="text-sm text-muted-foreground">Indexed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{coverage.excluded}</p>
                <p className="text-sm text-muted-foreground">Excluded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{coverage.warnings}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{coverage.errors}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No indexing data available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sitemaps</CardTitle>
        </CardHeader>
        <CardContent>
          {sitemaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sitemaps found.</p>
          ) : (
            <div className="space-y-3">
              {sitemaps.map((s) => (
                <div key={s.path} className="rounded border p-3">
                  <p className="truncate text-sm font-medium" title={s.path}>{s.path}</p>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    {s.contents.map((c) => (
                      <span key={c.type}>
                        {c.type}: {c.indexed}/{c.submitted} indexed
                      </span>
                    ))}
                    {s.errors > 0 && (
                      <span className="text-red-600">{s.errors} errors</span>
                    )}
                    {s.warnings > 0 && (
                      <span className="text-orange-600">{s.warnings} warnings</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
