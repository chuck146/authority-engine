import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoGenerationStatus } from '@/components/video/video-generation-status'
import type { VideoJobStatus } from '@/types/video'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('VideoGenerationStatus — Premium pipeline', () => {
  const onComplete = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderStatus(jobId: string) {
    return render(<VideoGenerationStatus jobId={jobId} onComplete={onComplete} onError={onError} />)
  }

  function mockStatusResponse(status: Partial<VideoJobStatus>) {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          jobId: 'premium-org-456-123',
          status: 'processing',
          progress: 0,
          result: null,
          error: null,
          ...status,
        }),
    })
  }

  it('shows "Premium Pipeline In Progress" for premium- prefix', () => {
    mockStatusResponse({ status: 'queued', progress: 0 })
    renderStatus('premium-org-456-123')

    expect(screen.getByText('Premium Pipeline In Progress')).toBeTruthy()
  })

  it('shows 10-20 minute time estimate for premium', () => {
    mockStatusResponse({ status: 'queued', progress: 0 })
    renderStatus('premium-org-456-123')

    expect(screen.getByText(/10-20 minutes/)).toBeTruthy()
  })

  it('shows 7-step indicator when premiumStep is present', async () => {
    mockStatusResponse({
      status: 'processing',
      progress: 45,
      premiumStep: {
        currentStep: 'scenes',
        stepLabel: 'Rendering cinematic scenes...',
        overallProgress: 45,
        sceneProgress: { currentScene: 2, totalScenes: 3 },
      },
    })

    renderStatus('premium-org-456-123')

    // Wait for poll to run
    await vi.advanceTimersByTimeAsync(100)

    // Step labels should render
    expect(screen.getByText(/Script/)).toBeTruthy()
    expect(screen.getByText(/Key Frames/)).toBeTruthy()
    expect(screen.getByText(/Stitch/)).toBeTruthy()
    expect(screen.getByText(/Upload/)).toBeTruthy()
  })

  it('shows scene progress during scenes step', async () => {
    mockStatusResponse({
      status: 'processing',
      progress: 45,
      premiumStep: {
        currentStep: 'scenes',
        stepLabel: 'Rendering cinematic scenes...',
        overallProgress: 45,
        sceneProgress: { currentScene: 2, totalScenes: 3 },
      },
    })

    renderStatus('premium-org-456-123')
    await vi.advanceTimersByTimeAsync(100)

    // Scene progress should appear somewhere in the rendered output
    const matches = screen.getAllByText(/2\/3/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows step label in description', async () => {
    mockStatusResponse({
      status: 'processing',
      progress: 12,
      premiumStep: {
        currentStep: 'keyframes',
        stepLabel: 'Generating key frames...',
        overallProgress: 12,
      },
    })

    renderStatus('premium-org-456-123')
    await vi.advanceTimersByTimeAsync(100)

    expect(screen.getByText('Generating key frames...')).toBeTruthy()
  })

  it('highlights current step in step indicator', async () => {
    mockStatusResponse({
      status: 'processing',
      progress: 82,
      premiumStep: {
        currentStep: 'stitch',
        stepLabel: 'Stitching final video...',
        overallProgress: 82,
      },
    })

    renderStatus('premium-org-456-123')
    await vi.advanceTimersByTimeAsync(100)

    // The "Stitch" step should have the active class — find within the step indicator
    const stitchSteps = screen.getAllByText(/Stitch/)
    const activeStitch = stitchSteps.find(
      (el) => el.className.includes('text-primary') && el.className.includes('font-medium'),
    )
    expect(activeStitch).toBeTruthy()
  })

  it('calls onComplete when premium job finishes', async () => {
    mockStatusResponse({
      status: 'completed',
      progress: 100,
      premiumStep: {
        currentStep: 'upload',
        stepLabel: 'Uploading final video...',
        overallProgress: 100,
      },
      result: {
        id: 'video-1',
        videoType: 'premium_reel',
        filename: 'premium-reel-123.mp4',
        storagePath: 'org/videos/premium.mp4',
        publicUrl: 'https://example.com/premium.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 10485760,
        durationSeconds: 30,
      },
    })

    renderStatus('premium-org-456-123')
    await vi.advanceTimersByTimeAsync(100)

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'video-1',
        videoType: 'premium_reel',
      }),
    )
  })

  it('calls onError when premium job fails', async () => {
    mockStatusResponse({
      status: 'failed',
      progress: 40,
      error: 'Scene 2 generation timed out',
    })

    renderStatus('premium-org-456-123')
    await vi.advanceTimersByTimeAsync(100)

    expect(onError).toHaveBeenCalledWith('Scene 2 generation timed out')
  })

  it('does NOT show composite steps for premium jobs', () => {
    mockStatusResponse({ status: 'queued', progress: 0 })
    renderStatus('premium-org-456-123')

    // Should not show "Cinematic" which is composite-specific label
    const allText = document.body.textContent
    expect(allText).not.toContain('Cinematic')
  })
})
