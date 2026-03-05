/**
 * Google Business Profile API types.
 * Used by lib/google/business-profile.ts service library.
 */

// --- Account Management API ---

export type GbpAccount = {
  name: string // e.g. "accounts/123456"
  accountName: string
  type: 'PERSONAL' | 'LOCATION_GROUP' | 'USER_GROUP' | 'ORGANIZATION'
  verificationState: 'VERIFIED' | 'UNVERIFIED' | 'VERIFICATION_REQUESTED'
  accountNumber?: string
}

// --- Business Information API ---

export type GbpLocation = {
  name: string // e.g. "locations/789"
  title: string // Business name
  storefrontAddress?: {
    addressLines: string[]
    locality: string
    administrativeArea: string
    postalCode: string
    regionCode: string
  }
  websiteUri?: string
  phoneNumbers?: {
    primaryPhone?: string
  }
}

// --- Reviews API ---

/** GBP uses string enums for star ratings */
export type GbpStarRating = 'STAR_RATING_UNSPECIFIED' | 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'

export type GbpReviewer = {
  displayName: string
  profilePhotoUrl?: string
}

export type GbpReviewReply = {
  comment: string
  updateTime: string
}

export type GbpReview = {
  name: string // e.g. "accounts/123/locations/456/reviews/abc"
  reviewId: string
  reviewer: GbpReviewer
  starRating: GbpStarRating
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: GbpReviewReply
}

export type GbpReviewsResponse = {
  reviews: GbpReview[]
  totalReviewCount: number
  averageRating: number
  nextPageToken?: string
}

// --- Integration status ---

export type GbpConnectionStatus = {
  isConnected: boolean
  provider: 'business_profile'
  locationName: string | null
  status: 'active' | 'error' | 'disconnected'
  lastSyncedAt: string | null
  syncError: string | null
  connectedAt: string | null
}

// --- Location selector ---

export type GbpLocationOption = {
  value: string // location name (API resource path)
  label: string // display title
  address?: string
}

// --- Star rating conversion ---

const STAR_RATING_MAP: Record<GbpStarRating, number> = {
  STAR_RATING_UNSPECIFIED: 0,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
}

export function starRatingToNumber(rating: GbpStarRating): number {
  return STAR_RATING_MAP[rating] || 0
}
