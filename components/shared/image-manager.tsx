'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageIcon, Upload, Wand2, Loader2, Check, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

type MediaItem = {
  id: string
  publicUrl: string
  filename: string
}

type ImageManagerProps = {
  imageType: string
  generateDefaults: Record<string, string>
  currentImageUrl: string | null
  onImageChange: (url: string | null, mediaAssetId?: string) => void
  disabled?: boolean
}

type Tab = 'library' | 'upload' | 'generate'

export function ImageManager({
  imageType,
  generateDefaults,
  currentImageUrl,
  onImageChange,
  disabled,
}: ImageManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null)
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedPreview, setGeneratedPreview] = useState<{ url: string; id: string } | null>(null)
  const [generateStyle, setGenerateStyle] = useState('photorealistic')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchLibrary() {
    setLibraryLoading(true)
    try {
      const res = await fetch(`/api/v1/media?imageType=${imageType}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setLibraryItems(data.items ?? data)
    } catch {
      setLibraryItems([])
    } finally {
      setLibraryLoading(false)
    }
  }

  function openTab(tab: Tab) {
    setActiveTab(tab)
    setGeneratedPreview(null)
    if (tab === 'library') fetchLibrary()
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('imageType', imageType)

      const res = await fetch('/api/v1/media/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const data = await res.json()
      onImageChange(data.publicUrl, data.id)
      setActiveTab(null)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setGeneratedPreview(null)
    try {
      const body: Record<string, string> = {
        imageType,
        style: generateStyle,
        mood: 'warm',
        ...generateDefaults,
      }

      const res = await fetch('/api/v1/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const data = await res.json()
      setGeneratedPreview({ url: data.publicUrl, id: data.id })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function handleUseGenerated() {
    if (!generatedPreview) return
    onImageChange(generatedPreview.url, generatedPreview.id)
    setActiveTab(null)
    setGeneratedPreview(null)
  }

  return (
    <div className="space-y-3">
      {/* Current image preview */}
      {currentImageUrl && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt="Current image"
            className="h-32 w-full rounded-lg border object-cover"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeTab === 'library' ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => openTab('library')}
        >
          <ImageIcon className="mr-1 h-3 w-3" />
          Library
        </Button>
        <Button
          type="button"
          variant={activeTab === 'upload' ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => openTab('upload')}
        >
          <Upload className="mr-1 h-3 w-3" />
          Upload
        </Button>
        <Button
          type="button"
          variant={activeTab === 'generate' ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => openTab('generate')}
        >
          <Wand2 className="mr-1 h-3 w-3" />
          Generate
        </Button>
        {currentImageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              onImageChange(null)
              setActiveTab(null)
            }}
          >
            <X className="mr-1 h-3 w-3" />
            Remove
          </Button>
        )}
      </div>

      {/* Library tab */}
      {activeTab === 'library' && (
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Select from media library</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab(null)}
            >
              Cancel
            </Button>
          </div>
          {libraryLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted aspect-square animate-pulse rounded" />
              ))}
            </div>
          ) : libraryItems.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No images found. Try generating one instead.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {libraryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onImageChange(item.publicUrl, item.id)
                    setActiveTab(null)
                  }}
                  className="hover:ring-primary aspect-square overflow-hidden rounded border transition-all hover:ring-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.publicUrl}
                    alt={item.filename}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload tab */}
      {activeTab === 'upload' && (
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Upload an image (max 10 MB)</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setActiveTab(null)}
            >
              Cancel
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>
      )}

      {/* Generate tab */}
      {activeTab === 'generate' && (
        <div className="rounded-lg border p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Generate with AI</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setActiveTab(null)
                setGeneratedPreview(null)
              }}
            >
              Cancel
            </Button>
          </div>

          <div className="mb-3">
            <label className="text-muted-foreground mb-1 block text-xs">Style</label>
            <Select value={generateStyle} onValueChange={setGenerateStyle}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photorealistic">Photorealistic</SelectItem>
                <SelectItem value="illustration">Illustration</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="watercolor">Watercolor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" className="w-full" disabled={generating} onClick={handleGenerate}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'Generate Image'}
          </Button>

          {generatedPreview && (
            <div className="mt-3 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedPreview.url}
                alt="Generated preview"
                className="w-full rounded-lg border object-cover"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" className="flex-1" onClick={handleUseGenerated}>
                  <Check className="mr-1 h-3 w-3" />
                  Use This Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={generating}
                  onClick={handleGenerate}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
