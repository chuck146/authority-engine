export type SendSmsRequest = {
  to: string
  message: string
}

export type SendSmsResult = {
  success: boolean
  messageId?: string
  error?: string
}

export type SmsAdapterStatus = {
  isConfigured: boolean
  provider: string
}

export type SmsAdapter = {
  send(request: SendSmsRequest): Promise<SendSmsResult>
  getStatus(): SmsAdapterStatus
}
