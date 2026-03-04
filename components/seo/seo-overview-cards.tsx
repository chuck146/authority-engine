'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SeoOverview } from '@/types/seo'

type SeoOverviewCardsProps = {
  overview: SeoOverview
}

export function SeoOverviewCards({ overview }: SeoOverviewCardsProps) {
  const { averageScore, totalPages, scoreDistribution } = overview

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{averageScore}</div>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalPages}</div>
          <p className="text-xs text-muted-foreground">scored pages</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {scoreDistribution.needsWork + scoreDistribution.poor}
          </div>
          <p className="text-xs text-muted-foreground">pages below 60</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Excellent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {scoreDistribution.excellent}
          </div>
          <p className="text-xs text-muted-foreground">pages scoring 80+</p>
        </CardContent>
      </Card>
    </div>
  )
}
