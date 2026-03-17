'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { SocialPostDetail } from '@/types/social'

type SocialPostPreviewOverrides = {
  body?: string
  hashtags?: string[]
  ctaType?: string | null
  ctaUrl?: string | null
  mediaUrl?: string | null
}

type SocialPostPreviewProps = {
  post: SocialPostDetail
  overrides?: SocialPostPreviewOverrides
}

export function SocialPostPreview({ post, overrides }: SocialPostPreviewProps) {
  switch (post.platform) {
    case 'gbp':
      return <GbpPreview post={post} overrides={overrides} />
    case 'instagram':
      return <InstagramPreview post={post} overrides={overrides} />
    case 'facebook':
      return <FacebookPreview post={post} overrides={overrides} />
  }
}

function GbpPreview({ post, overrides }: SocialPostPreviewProps) {
  const body = overrides?.body ?? post.body
  const ctaType = overrides?.ctaType !== undefined ? overrides.ctaType : post.ctaType
  const mediaUrl = overrides?.mediaUrl !== undefined ? overrides.mediaUrl : post.mediaUrl

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            G
          </div>
          <div>
            <p className="text-sm font-medium">Business Update</p>
            <p className="text-muted-foreground text-xs">Google Business Profile</p>
          </div>
        </div>
        {mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="Post image" className="mb-3 w-full rounded object-cover" />
        )}
        <p className="text-sm whitespace-pre-wrap">{body}</p>
        {ctaType && (
          <div className="mt-3">
            <span className="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white">
              {ctaType.replace('_', ' ')}
            </span>
          </div>
        )}
        <p className="text-muted-foreground mt-2 text-xs">{body.length} / 1,500 characters</p>
      </CardContent>
    </Card>
  )
}

function InstagramPreview({ post, overrides }: SocialPostPreviewProps) {
  const body = overrides?.body ?? post.body
  const hashtags = overrides?.hashtags ?? post.hashtags
  const mediaUrl = overrides?.mediaUrl !== undefined ? overrides.mediaUrl : post.mediaUrl

  return (
    <Card className="border-pink-200 dark:border-pink-800">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-xs font-bold text-white">
            IG
          </div>
          <div>
            <p className="text-sm font-medium">Instagram Post</p>
            <p className="text-muted-foreground text-xs">Caption Preview</p>
          </div>
        </div>
        {mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="Post image" className="mb-3 w-full rounded object-cover" />
        )}
        <p className="text-sm whitespace-pre-wrap">{body}</p>
        {hashtags.length > 0 && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          {body.length} / 2,200 characters | {hashtags.length} hashtags
        </p>
      </CardContent>
    </Card>
  )
}

function FacebookPreview({ post, overrides }: SocialPostPreviewProps) {
  const body = overrides?.body ?? post.body
  const hashtags = overrides?.hashtags ?? post.hashtags
  const mediaUrl = overrides?.mediaUrl !== undefined ? overrides.mediaUrl : post.mediaUrl

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white">
            f
          </div>
          <div>
            <p className="text-sm font-medium">Facebook Post</p>
            <p className="text-muted-foreground text-xs">Post Preview</p>
          </div>
        </div>
        {mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="Post image" className="mb-3 w-full rounded object-cover" />
        )}
        <p className="text-sm whitespace-pre-wrap">{body}</p>
        {hashtags.length > 0 && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          {body.length} characters | {hashtags.length} hashtags
        </p>
      </CardContent>
    </Card>
  )
}
