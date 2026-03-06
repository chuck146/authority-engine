'use client'

import DOMPurify from 'isomorphic-dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { StructuredContent, ContentType } from '@/types/content'
import type { ContentStatus } from '@/types'

type ContentPreviewProps = {
  content: StructuredContent
  title: string
  contentType: ContentType
  status?: ContentStatus
}

const typeLabels: Record<ContentType, string> = {
  service_page: 'Service Page',
  location_page: 'Location Page',
  blog_post: 'Blog Post',
}

const statusVariant: Record<ContentStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  review: 'outline',
  approved: 'default',
  published: 'default',
  archived: 'secondary',
}

export function ContentPreview({
  content,
  title,
  contentType,
  status = 'review',
}: ContentPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Preview: {title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{typeLabels[contentType]}</Badge>
            <Badge variant={statusVariant[status]}>{status}</Badge>
          </div>
        </div>
        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
          <p>
            <strong>Meta Title:</strong> {content.meta_title}
          </p>
          <p>
            <strong>Meta Description:</strong> {content.meta_description}
          </p>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="prose prose-sm max-w-none pt-6">
        <h1>{content.headline}</h1>
        <p>{content.intro}</p>

        {content.sections.map((section, index) => (
          <div key={index}>
            <h2>{section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.body) }} />
          </div>
        ))}

        <div className="bg-muted rounded-lg p-4">
          <p className="font-semibold">{content.cta}</p>
        </div>
      </CardContent>
    </Card>
  )
}
