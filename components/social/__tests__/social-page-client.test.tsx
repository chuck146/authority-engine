import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialPageClient } from '../social-page-client'

// Mock child components
vi.mock('../social-post-list', () => ({
  SocialPostList: ({ platform }: { platform?: string }) => (
    <div data-testid={`post-list-${platform ?? 'all'}`}>Post List ({platform ?? 'all'})</div>
  ),
}))

vi.mock('../social-generate-form', () => ({
  SocialGenerateForm: ({ onGenerated: _onGenerated }: { onGenerated?: () => void }) => (
    <div data-testid="generate-form">Generate Form</div>
  ),
}))

describe('SocialPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tabs', () => {
    render(<SocialPageClient />)

    expect(screen.getByRole('tab', { name: 'All Posts' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'GBP' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Instagram' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Facebook' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Generate' })).toBeInTheDocument()
  })

  it('shows All Posts tab content by default', () => {
    render(<SocialPageClient />)

    expect(screen.getByTestId('post-list-all')).toBeInTheDocument()
  })
})
