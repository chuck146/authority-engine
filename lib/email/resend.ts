import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

type LeadNotificationData = {
  name: string
  email: string
  phone: string
  service?: string | null
  message?: string | null
}

export async function sendLeadNotification(to: string, lead: LeadNotificationData): Promise<void> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured — skipping lead notification email')
    return
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'cleanestpaintingnj.com'

  const text = [
    `New Estimate Request from ${lead.name}`,
    '',
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    lead.service ? `Service: ${lead.service}` : null,
    lead.message ? `Message: ${lead.message}` : null,
    '',
    '---',
    `Submitted via ${siteUrl}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px;">
      <h2 style="color: #1B2B5B; margin-bottom: 24px;">New Estimate Request</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; color: #666; font-size: 14px;">Name</td>
          <td style="padding: 8px 12px; font-size: 14px; font-weight: 600;">${escapeHtml(lead.name)}</td>
        </tr>
        <tr style="background: #f9fafb;">
          <td style="padding: 8px 12px; color: #666; font-size: 14px;">Email</td>
          <td style="padding: 8px 12px; font-size: 14px;">
            <a href="mailto:${escapeHtml(lead.email)}" style="color: #1B2B5B;">${escapeHtml(lead.email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; color: #666; font-size: 14px;">Phone</td>
          <td style="padding: 8px 12px; font-size: 14px;">
            <a href="tel:${escapeHtml(lead.phone)}" style="color: #1B2B5B;">${escapeHtml(lead.phone)}</a>
          </td>
        </tr>
        ${lead.service ? `<tr style="background: #f9fafb;"><td style="padding: 8px 12px; color: #666; font-size: 14px;">Service</td><td style="padding: 8px 12px; font-size: 14px;">${escapeHtml(lead.service)}</td></tr>` : ''}
      </table>
      ${lead.message ? `<div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;"><p style="margin: 0 0 4px; color: #666; font-size: 13px;">Message</p><p style="margin: 0; font-size: 14px; line-height: 1.5;">${escapeHtml(lead.message)}</p></div>` : ''}
      <p style="margin-top: 24px; color: #999; font-size: 12px;">Submitted via ${escapeHtml(siteUrl)}</p>
    </div>
  `

  try {
    await resend.emails.send({
      from,
      to,
      subject: `New Estimate Request from ${lead.name}`,
      text,
      html,
    })
  } catch (err) {
    console.error('Failed to send lead notification email:', err)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
