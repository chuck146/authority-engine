'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type LeadSendEmailFormProps = {
  leadId: string
  leadName: string
  onSent: () => void
}

export function LeadSendEmailForm({ leadId, leadName, onSent }: LeadSendEmailFormProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to send email')
        return
      }

      setSubject('')
      setBody('')
      onSent()
    } catch {
      setError('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={200}
      />
      <Textarea
        placeholder={`Email body to ${leadName}...`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
        >
          {sending ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
