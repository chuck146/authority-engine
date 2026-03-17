import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { publishScheduledContent } from '@/lib/queue/publish-worker'

export const maxDuration = 60

function verifyCronSecret(authHeader: string | null): boolean {
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!authHeader || !process.env.CRON_SECRET) return false
  if (Buffer.byteLength(authHeader) !== Buffer.byteLength(expected)) return false
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await publishScheduledContent()

  return NextResponse.json({
    success: true,
    published: result.published,
    failed: result.failed,
  })
}
