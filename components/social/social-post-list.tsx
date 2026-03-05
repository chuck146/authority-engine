'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SocialPostDetail } from './social-post-detail'
import type { SocialPostListItem, SocialPlatform } from '@/types/social'

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  gbp: 'GBP',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  gbp: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  facebook: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  review: 'secondary',
  approved: 'default',
  published: 'default',
  archived: 'destructive',
}

type SocialPostListProps = {
  platform?: SocialPlatform
}

export function SocialPostList({ platform }: SocialPostListProps) {
  const [posts, setPosts] = useState<SocialPostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (platform) params.set('platform', platform)

    fetch(`/api/v1/social?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load posts')
        return res.json()
      })
      .then((data) => setPosts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [platform])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No posts yet. Go to the Generate tab to create your first post.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{platform ? `${PLATFORM_LABELS[platform]} Posts` : 'All Posts'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedId(post.id)}
                className="hover:bg-muted/50 flex w-full items-center gap-4 px-2 py-3 text-left transition-colors"
              >
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[post.platform]}`}
                >
                  {PLATFORM_LABELS[post.platform]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {post.title ?? post.body.slice(0, 80)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {post.body.slice(0, 120)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[post.status] ?? 'outline'}>{post.status}</Badge>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <SocialPostDetail
        postId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={() => {
          // Re-fetch posts after status change
          const params = new URLSearchParams()
          if (platform) params.set('platform', platform)
          fetch(`/api/v1/social?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => setPosts(data))
        }}
      />
    </>
  )
}
