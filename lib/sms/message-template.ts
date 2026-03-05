type MessageTemplateParams = {
  customerName: string
  orgName: string
  reviewUrl: string
  customMessage?: string
}

const DEFAULT_TEMPLATE =
  'Hi {name}! Thank you for choosing {org}. We\'d love to hear about your experience. Please leave us a review: {url}'

/**
 * Build the SMS message for a review request.
 * If customMessage is provided, variables {name}, {org}, {url} are interpolated.
 * Otherwise the default template is used.
 */
export function buildReviewRequestMessage(params: MessageTemplateParams): string {
  const template = params.customMessage || DEFAULT_TEMPLATE

  return template
    .replace(/\{name\}/g, params.customerName)
    .replace(/\{org\}/g, params.orgName)
    .replace(/\{url\}/g, params.reviewUrl)
}
