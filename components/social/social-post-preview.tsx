'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { SocialPostDetail } from '@/types/social'

type SocialPostPreviewProps = {
  post: SocialPostDetail
}

export function SocialPostPreview({ post }: SocialPostPreviewProps) {
  switch (post.platform) {
    case 'gbp':
      return <GbpPreview post={post} />
    case 'instagram':
      return <InstagramPreview post={post} />
    case 'facebook':
      return <FacebookPreview post={post} />
  }
}

function GbpPreview({ post }: SocialPostPreviewProps) {
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
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>
        {post.ctaType && (
          <div className="mt-3">
            <span className="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white">
              {post.ctaType.replace('_', ' ')}
            </span>
          </div>
        )}
        <p className="text-muted-foreground mt-2 text-xs">{post.body.length} / 1,500 characters</p>
      </CardContent>
    </Card>
  )
}

function InstagramPreview({ post }: SocialPostPreviewProps) {
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
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>
        {post.hashtags.length > 0 && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {post.hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          {post.body.length} / 2,200 characters | {post.hashtags.length} hashtags
        </p>
      </CardContent>
    </Card>
  )
}

function FacebookPreview({ post }: SocialPostPreviewProps) {
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
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>
        {post.hashtags.length > 0 && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {post.hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          {post.body.length} characters | {post.hashtags.length} hashtags
        </p>
      </CardContent>
    </Card>
  )
}
