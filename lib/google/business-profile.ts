import type {
  GbpAccount,
  GbpLocation,
  GbpReview,
  GbpReviewsResponse,
  GbpReviewReply,
} from '@/types/gbp'

const ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const BUSINESS_INFO_API = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const REVIEWS_API = 'https://mybusiness.googleapis.com/v4'

type FetchOptions = {
  accessToken: string
}

// --- Account Management ---

type AccountsApiResponse = {
  accounts?: GbpAccount[]
}

export async function listAccounts(options: FetchOptions): Promise<GbpAccount[]> {
  const res = await fetch(`${ACCOUNT_API}/accounts`, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GBP Accounts API error (${res.status}): ${text}`)
  }

  const data: AccountsApiResponse = await res.json()
  return data.accounts ?? []
}

// --- Business Information ---

type LocationsApiResponse = {
  locations?: GbpLocation[]
  nextPageToken?: string
}

export async function listLocations(
  options: FetchOptions & { accountId: string },
): Promise<GbpLocation[]> {
  const { accessToken, accountId } = options
  const allLocations: GbpLocation[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(`${BUSINESS_INFO_API}/${accountId}/locations`)
    url.searchParams.set('readMask', 'name,title,storefrontAddress,websiteUri,phoneNumbers')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GBP Locations API error (${res.status}): ${text}`)
    }

    const data: LocationsApiResponse = await res.json()
    allLocations.push(...(data.locations ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return allLocations
}

// --- Reviews ---

type ReviewsApiResponse = {
  reviews?: GbpReview[]
  totalReviewCount?: number
  averageRating?: number
  nextPageToken?: string
}

export async function listReviews(
  options: FetchOptions & { locationName: string; pageSize?: number; pageToken?: string },
): Promise<GbpReviewsResponse> {
  const { accessToken, locationName, pageSize, pageToken } = options
  const url = new URL(`${REVIEWS_API}/${locationName}/reviews`)
  url.searchParams.set('pageSize', String(pageSize ?? 50))
  if (pageToken) url.searchParams.set('pageToken', pageToken)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GBP Reviews API error (${res.status}): ${text}`)
  }

  const data: ReviewsApiResponse = await res.json()
  return {
    reviews: data.reviews ?? [],
    totalReviewCount: data.totalReviewCount ?? 0,
    averageRating: data.averageRating ?? 0,
    nextPageToken: data.nextPageToken,
  }
}

export async function replyToReview(
  options: FetchOptions & { reviewName: string; comment: string },
): Promise<GbpReviewReply> {
  const { accessToken, reviewName, comment } = options
  const res = await fetch(`${REVIEWS_API}/${reviewName}/reply`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GBP Reply API error (${res.status}): ${text}`)
  }

  return res.json()
}

export async function deleteReply(
  options: FetchOptions & { reviewName: string },
): Promise<void> {
  const { accessToken, reviewName } = options
  const res = await fetch(`${REVIEWS_API}/${reviewName}/reply`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GBP Delete Reply API error (${res.status}): ${text}`)
  }
}
