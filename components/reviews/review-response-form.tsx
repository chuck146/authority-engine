'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

type ReviewResponseFormProps = {
  reviewId: string
  onGenerated?: () => void
}

export function ReviewResponseForm({ reviewId, onGenerated }: ReviewResponseFormProps) {
  const [tone, setTone] = useState<'appreciative' | 'empathetic' | 'professional' | 'friendly'>(
    'professional',
  )
  const [includePromotion, setIncludePromotion] = useState(false)
  const [maxLength, setMaxLength] = useState(500)
  const [customInstructions, setCustomInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          includePromotion,
          maxLength,
          customInstructions: customInstructions || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate response')
      }

      onGenerated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="response-tone">Tone</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
          <SelectTrigger id="response-tone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appreciative">Appreciative</SelectItem>
            <SelectItem value="empathetic">Empathetic</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-length">Max Length (characters)</Label>
        <Input
          id="max-length"
          type="number"
          min={50}
          max={2000}
          value={maxLength}
          onChange={(e) => setMaxLength(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-instructions">Custom Instructions (optional)</Label>
        <Input
          id="custom-instructions"
          placeholder="e.g., Mention our new spring special..."
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          maxLength={500}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="include-promotion"
          type="checkbox"
          checked={includePromotion}
          onChange={(e) => setIncludePromotion(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="include-promotion" className="text-sm font-normal">
          Include subtle promotion
        </Label>
      </div>

      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </div>
      )}

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? 'Generating...' : 'Generate AI Response'}
      </Button>
    </div>
  )
}
