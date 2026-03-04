import type {
  Ga4AccountSummary,
  Ga4ReportRequest,
  Ga4ReportResponse,
} from '@/types/ga4'

const ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com/v1beta'
const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'

type FetchOptions = {
  accessToken: string
}

// --- Admin API ---

type AccountSummariesResponse = {
  accountSummaries?: Ga4AccountSummary[]
  nextPageToken?: string
}

export async function listAccountSummaries(
  options: FetchOptions,
): Promise<Ga4AccountSummary[]> {
  const res = await fetch(`${ADMIN_API_BASE}/accountSummaries?pageSize=200`, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GA4 Admin API error (${res.status}): ${text}`)
  }

  const data: AccountSummariesResponse = await res.json()
  return data.accountSummaries ?? []
}

// --- Data API ---

type RunReportOptions = FetchOptions & {
  propertyId: string
  request: Ga4ReportRequest
}

export async function runReport(options: RunReportOptions): Promise<Ga4ReportResponse> {
  const { accessToken, propertyId, request } = options
  const id = propertyId.replace('properties/', '')

  const res = await fetch(`${DATA_API_BASE}/properties/${id}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GA4 Data API error (${res.status}): ${text}`)
  }

  return res.json()
}

type BatchRunReportsOptions = FetchOptions & {
  propertyId: string
  requests: Ga4ReportRequest[]
}

type BatchRunReportsResponse = {
  reports?: Ga4ReportResponse[]
}

export async function batchRunReports(
  options: BatchRunReportsOptions,
): Promise<Ga4ReportResponse[]> {
  const { accessToken, propertyId, requests } = options
  const id = propertyId.replace('properties/', '')

  const res = await fetch(`${DATA_API_BASE}/properties/${id}:batchRunReports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GA4 Batch Report API error (${res.status}): ${text}`)
  }

  const data: BatchRunReportsResponse = await res.json()
  return data.reports ?? []
}
