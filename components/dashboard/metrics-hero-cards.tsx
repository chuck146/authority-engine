'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HeroMetrics } from '@/types/dashboard'

type MetricsHeroCardsProps = {
  hero: HeroMetrics
}

function formatRelativeDate(isoDate: string): { primary: string; secondary: string } {
  const target = new Date(isoDate)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return { primary: 'Today', secondary: target.toLocaleDateString() }
  if (diffDays === 1) return { primary: 'Tomorrow', secondary: target.toLocaleDateString() }
  return { primary: `${diffDays} days`, secondary: target.toLocaleDateString() }
}

export function MetricsHeroCards({ hero }: MetricsHeroCardsProps) {
  const nextPublish = hero.nextScheduledPublish
    ? formatRelativeDate(hero.nextScheduledPublish)
    : null

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Hero card — visually dominant */}
      <Card className="ring-1 ring-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Published Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{hero.totalPublished}</div>
          <p className="text-xs text-muted-foreground">live &amp; indexed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. SEO Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {hero.averageSeoScore}
            <span className="text-lg font-normal text-muted-foreground">/100</span>
          </div>
          <p className="text-xs text-muted-foreground">published pages</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Needs Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${hero.contentInReview > 0 ? 'text-orange-600' : ''}`}
          >
            {hero.contentInReview}
          </div>
          <p className="text-xs text-muted-foreground">awaiting approval</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Next Publish
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextPublish ? (
            <>
              <div className="text-3xl font-bold">{nextPublish.primary}</div>
              <p className="text-xs text-muted-foreground">{nextPublish.secondary}</p>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-muted-foreground">—</div>
              <p className="text-xs text-muted-foreground">nothing scheduled</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
