'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SocialPostPreview } from './social-post-preview'
import type { SocialPostDetail as SocialPostDetailType } from '@/types/social'

type SocialPostDetailProps = {
  postId: string | null
  onClose: () => void
  onStatusChange?: () => void
}

const PLATFORM_NAMES = {
  gbp: 'Google Business Profile',
  instagram: 'Instagram',
  facebook: 'Facebook',
} as const

export function SocialPostDetail({ postId, onClose, onStatusChange }: SocialPostDetailProps) {
  const [post, setPost] = useState<SocialPostDetailType | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!postId) {
      setPost(null)
      return
    }

    setLoading(true)
    fetch(`/api/v1/social/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load post')
        return res.json()
      })
      .then((data) => setPost(data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [postId])

  async function handleAction(action: string) {
    if (!post) return
    setActionLoading(true)

    try {
      const res = await fetch(`/api/v1/social/${post.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Action failed')
      }

      const result = await res.json()
      setPost((prev) => (prev ? { ...prev, status: result.status } : null))
      onStatusChange?.()
    } catch {
      // silently fail — user sees the unchanged status
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCopy() {
    if (!post) return
    const text =
      post.hashtags.length > 0
        ? `${post.body}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`
        : post.body

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={!!postId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{post ? PLATFORM_NAMES[post.platform] : 'Post Detail'}</SheetTitle>
          <SheetDescription>
            {post && (
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                {post.status}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="space-y-3 pt-4">
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-20 animate-pulse rounded" />
          </div>
        )}

        {post && !loading && (
          <div className="space-y-6 pt-4">
            {/* Preview */}
            <SocialPostPreview post={post} />

            {/* Hashtags */}
            {post.hashtags.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Hashtags</h4>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted inline-flex rounded-full px-2 py-0.5 text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {post.ctaType && (
              <div>
                <h4 className="mb-1 text-sm font-medium">Call to Action</h4>
                <p className="text-muted-foreground text-sm">
                  {post.ctaType}
                  {post.ctaUrl && (
                    <>
                      {' — '}
                      <a
                        href={post.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {post.ctaUrl}
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Attached Image */}
            {post.mediaUrl && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Attached Image</h4>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrl}
                  alt="Generated social graphic"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            {/* Meta */}
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
              {post.publishedAt && <p>Published: {new Date(post.publishedAt).toLocaleString()}</p>}
              {post.keywords.length > 0 && <p>Keywords: {post.keywords.join(', ')}</p>}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>

              {post.status === 'review' && (
                <>
                  <Button onClick={() => handleAction('approve')} disabled={actionLoading}>
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                </>
              )}

              {post.status === 'approved' && (
                <Button onClick={() => handleAction('publish')} disabled={actionLoading}>
                  Mark as Published
                </Button>
              )}

              {(post.status === 'review' ||
                post.status === 'approved' ||
                post.status === 'published') && (
                <Button
                  variant="outline"
                  onClick={() => handleAction('archive')}
                  disabled={actionLoading}
                >
                  Archive
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
