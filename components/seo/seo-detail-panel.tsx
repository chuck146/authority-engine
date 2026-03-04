'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SeoScoreBadge } from './seo-score-badge'
import type { SeoContentItem, SeoScoreResult, SeoRuleCategory } from '@/types/seo'

type SeoDetailPanelProps = {
  item: SeoContentItem | null
  onClose: () => void
}

const categoryLabels: Record<SeoRuleCategory, string> = {
  'meta-tags': 'Meta Tags',
  'content-structure': 'Content Structure',
  'keyword-optimization': 'Keyword Optimization',
  readability: 'Readability',
}

const categoryOrder: SeoRuleCategory[] = [
  'meta-tags',
  'content-structure',
  'keyword-optimization',
  'readability',
]

function RuleRow({ label, score, passed, recommendation }: {
  label: string
  score: number
  passed: boolean
  recommendation: string | null
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {passed ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Pass</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">Fail</Badge>
          )}
        </div>
        {recommendation && (
          <p className="mt-1 text-xs text-muted-foreground">{recommendation}</p>
        )}
      </div>
      <span className="text-sm font-mono tabular-nums">{score}/100</span>
    </div>
  )
}

export function SeoDetailPanel({ item, onClose }: SeoDetailPanelProps) {
  const [result, setResult] = useState<SeoScoreResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!item) {
      setResult(null)
      return
    }

    setLoading(true)
    fetch(`/api/v1/seo/${item.contentType}/${item.id}`)
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult(null))
      .finally(() => setLoading(false))
  }, [item])

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item?.title}</SheetTitle>
          <SheetDescription>
            SEO analysis — {item ? <SeoScoreBadge score={item.seoScore} showLabel /> : null}
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Analyzing...</div>
          </div>
        )}

        {result && !loading && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{result.summary}</p>

            {categoryOrder.map((cat) => {
              const catRules = result.rules.filter((r) => r.category === cat)
              if (catRules.length === 0) return null

              return (
                <Card key={cat}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{categoryLabels[cat]}</CardTitle>
                      <span className="text-sm font-mono tabular-nums text-muted-foreground">
                        {result.categoryScores[cat]}/100
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {catRules.map((rule) => (
                        <RuleRow
                          key={rule.id}
                          label={rule.label}
                          score={rule.score}
                          passed={rule.passed}
                          recommendation={rule.recommendation}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
