'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { SocialPostPreview } from './social-post-preview'
import { InlineMediaPicker } from './inline-media-picker'
import type { SocialPostDetail as SocialPostDetailType } from '@/types/social'

type SocialPostDetailProps = {
  postId: string | null
  onClose: () => void
  onStatusChange?: () => void
}

type EditFormState = {
  title: string
  body: string
  hashtags: string[]
  ctaType: string | null
  ctaUrl: string | null
  mediaAssetId: string | null
  mediaUrl: string | null
}

const PLATFORM_NAMES = {
  gbp: 'Google Business Profile',
  instagram: 'Instagram',
  facebook: 'Facebook',
} as const

const CTA_OPTIONS = [
  { value: '__none__', label: 'None' },
  { value: 'BOOK', label: 'Book' },
  { value: 'ORDER', label: 'Order' },
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'CALL', label: 'Call' },
]

const EDITABLE_STATUSES = ['draft', 'review']

export function SocialPostDetail({ postId, onClose, onStatusChange }: SocialPostDetailProps) {
  const [post, setPost] = useState<SocialPostDetailType | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState<EditFormState | null>(null)
  const [hashtagInput, setHashtagInput] = useState('')

  useEffect(() => {
    if (!postId) {
      setPost(null)
      setEditing(false)
      setFormState(null)
      return
    }

    setLoading(true)
    setEditing(false)
    setFormState(null)
    fetch(`/api/v1/social/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load post')
        return res.json()
      })
      .then((data) => setPost(data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [postId])

  function startEditing() {
    if (!post) return
    setFormState({
      title: post.title ?? '',
      body: post.body,
      hashtags: [...post.hashtags],
      ctaType: post.ctaType,
      ctaUrl: post.ctaUrl,
      mediaAssetId: post.mediaAssetId,
      mediaUrl: post.mediaUrl,
    })
    setHashtagInput('')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setFormState(null)
    setHashtagInput('')
  }

  const updateForm = useCallback((updates: Partial<EditFormState>) => {
    setFormState((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  function addHashtag() {
    if (!formState || !hashtagInput.trim()) return
    const newTags = hashtagInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter((t) => t.length > 0 && !formState.hashtags.includes(t))
    if (newTags.length > 0) {
      updateForm({ hashtags: [...formState.hashtags, ...newTags] })
    }
    setHashtagInput('')
  }

  function removeHashtag(tag: string) {
    if (!formState) return
    updateForm({ hashtags: formState.hashtags.filter((t) => t !== tag) })
  }

  async function handleSave() {
    if (!post || !formState) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/social/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formState.title || undefined,
          body: formState.body,
          hashtags: formState.hashtags,
          ctaType: formState.ctaType,
          ctaUrl: formState.ctaUrl,
          mediaAssetId: formState.mediaAssetId,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = await res.json()
      setPost(updated)
      setEditing(false)
      setFormState(null)
      onStatusChange?.()
    } catch {
      // stay in edit mode on error
    } finally {
      setSaving(false)
    }
  }

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

        {/* ========== EDIT MODE ========== */}
        {post && !loading && editing && formState && (
          <div className="space-y-5 pt-4">
            {/* Live Preview */}
            <SocialPostPreview
              post={post}
              overrides={{
                body: formState.body,
                hashtags: formState.hashtags,
                ctaType: formState.ctaType,
                ctaUrl: formState.ctaUrl,
                mediaUrl: formState.mediaUrl,
              }}
            />

            {/* Edit Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formState.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="Post title (optional)"
                  maxLength={200}
                />
              </div>

              {/* Body */}
              <div>
                <Label htmlFor="edit-body">Body</Label>
                <Textarea
                  id="edit-body"
                  value={formState.body}
                  onChange={(e) => updateForm({ body: e.target.value })}
                  rows={6}
                  maxLength={2200}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {formState.body.length} / 2,200 characters
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <Label htmlFor="edit-hashtags">Hashtags</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-hashtags"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addHashtag()
                      }
                    }}
                    placeholder="Type and press Enter"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addHashtag}>
                    Add
                  </Button>
                </div>
                {formState.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formState.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeHashtag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove #${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA Type */}
              <div>
                <Label>Call to Action</Label>
                <Select
                  value={formState.ctaType ?? '__none__'}
                  onValueChange={(val) =>
                    updateForm({
                      ctaType: val === '__none__' ? null : val,
                      ctaUrl: val === '__none__' ? null : formState.ctaUrl,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CTA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CTA URL */}
              {formState.ctaType && (
                <div>
                  <Label htmlFor="edit-cta-url">CTA URL</Label>
                  <Input
                    id="edit-cta-url"
                    value={formState.ctaUrl ?? ''}
                    onChange={(e) => updateForm({ ctaUrl: e.target.value || null })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Image */}
              <InlineMediaPicker
                currentMediaUrl={formState.mediaUrl}
                onSelect={(id, url) => updateForm({ mediaAssetId: id, mediaUrl: url })}
                onRemove={() => updateForm({ mediaAssetId: null, mediaUrl: null })}
              />
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 border-t pt-4">
              <Button onClick={handleSave} disabled={saving || !formState.body.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={cancelEditing} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ========== READ-ONLY MODE ========== */}
        {post && !loading && !editing && (
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
              {EDITABLE_STATUSES.includes(post.status) && (
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}

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
