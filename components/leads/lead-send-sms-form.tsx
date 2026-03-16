'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type LeadSendSmsFormProps = {
  leadId: string
  leadName: string
  onSent: () => void
}

export function LeadSendSmsForm({ leadId, leadName, onSent }: LeadSendSmsFormProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to send SMS')
        return
      }

      setMessage('')
      onSent()
    } catch {
      setError('Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder={`Message to ${leadName}...`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={1600}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{message.length}/1600</span>
        <Button size="sm" onClick={handleSend} disabled={sending || !message.trim()}>
          {sending ? 'Sending...' : 'Send SMS'}
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
