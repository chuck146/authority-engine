import type { SmsAdapter, SendSmsRequest, SendSmsResult, SmsAdapterStatus } from './adapter'

type SalesMessageConversationResponse = {
  data: {
    id: number
  }
}

type SalesMessageMessageResponse = {
  data: {
    id: number
  }
}

/**
 * Normalize phone number to E.164 format.
 * Strips non-digit chars, prepends +1 for 10-digit US numbers.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (phone.startsWith('+')) return phone.replace(/[^\d+]/g, '')
  return `+${digits}`
}

export class SalesMessageAdapter implements SmsAdapter {
  private apiKey: string
  private numberId: string
  private teamId: string
  private baseUrl = 'https://api.salesmessage.com/pub/v2.2'

  constructor(config: { apiKey: string; numberId: string; teamId: string }) {
    this.apiKey = config.apiKey
    this.numberId = config.numberId
    this.teamId = config.teamId
  }

  getStatus(): SmsAdapterStatus {
    return {
      isConfigured: !!(this.apiKey && this.numberId && this.teamId),
      provider: 'salesmessage',
    }
  }

  async send(request: SendSmsRequest): Promise<SendSmsResult> {
    const normalizedPhone = normalizePhone(request.to)

    // Step 1: Create or find conversation
    let conversationId: number
    try {
      const convResponse = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          number_id: this.numberId,
          team_id: this.teamId,
          phones: [normalizedPhone],
        }),
      })

      if (!convResponse.ok) {
        const errorText = await convResponse.text()
        return {
          success: false,
          error: `Failed to create conversation: ${convResponse.status} ${errorText}`,
        }
      }

      const convData = (await convResponse.json()) as SalesMessageConversationResponse
      conversationId = convData.data.id
    } catch (err) {
      return {
        success: false,
        error: `Network error creating conversation: ${err instanceof Error ? err.message : 'Unknown'}`,
      }
    }

    // Step 2: Send message to conversation
    try {
      const msgResponse = await fetch(`${this.baseUrl}/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          content: request.message,
        }),
      })

      if (!msgResponse.ok) {
        const errorText = await msgResponse.text()
        return {
          success: false,
          error: `Failed to send message: ${msgResponse.status} ${errorText}`,
        }
      }

      const msgData = (await msgResponse.json()) as SalesMessageMessageResponse
      return {
        success: true,
        messageId: String(msgData.data.id),
      }
    } catch (err) {
      return {
        success: false,
        error: `Network error sending message: ${err instanceof Error ? err.message : 'Unknown'}`,
      }
    }
  }
}

/**
 * Factory function to create the SMS adapter from environment variables.
 */
export function createSmsAdapter(): SmsAdapter {
  return new SalesMessageAdapter({
    apiKey: process.env.SALESMESSAGE_API_KEY ?? '',
    numberId: process.env.SALESMESSAGE_NUMBER_ID ?? '',
    teamId: process.env.SALESMESSAGE_TEAM_ID ?? '',
  })
}
