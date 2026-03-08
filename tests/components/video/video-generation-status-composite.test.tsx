import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { VideoGenerationStatus } from '@/components/video/video-generation-status'
import type { VideoJobStatus } from '@/types/video'

const onComplete = vi.fn()
const onError = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function buildCompositeStatus(overrides?: Partial<VideoJobStatus>): VideoJobStatus {
  return {
    jobId: 'composite-org-456-111',
    status: 'queued',
    progress: null,
    result: null,
    error: null,
    compositeStep: null,
    ...overrides,
  }
}

describe('VideoGenerationStatus — composite jobs', () => {
  describe('composite title and description', () => {
    it('shows "Composite Pipeline In Progress" title for composite job IDs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(buildCompositeStatus()),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      expect(screen.getByText('Composite Pipeline In Progress')).toBeDefined()
    })

    it('shows regular title for non-composite job IDs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            buildCompositeStatus({ jobId: 'video-org-456-111', status: 'processing' }),
          ),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="video-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      expect(screen.getByText('Video Generation In Progress')).toBeDefined()
    })

    it('shows extended time estimate for composite jobs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(buildCompositeStatus()),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      expect(screen.getByText(/5-10 minutes/)).toBeDefined()
    })
  })

  describe('step indicator strip', () => {
    it('renders all five pipeline steps when compositeStep is present', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            buildCompositeStatus({
              status: 'processing',
              progress: 20,
              compositeStep: {
                currentStep: 'intro',
                stepLabel: 'Rendering branded intro...',
                overallProgress: 20,
              },
            }),
          ),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      expect(screen.getByText(/Intro/)).toBeDefined()
      expect(screen.getByText(/Cinematic/)).toBeDefined()
      expect(screen.getByText(/Outro/)).toBeDefined()
      expect(screen.getByText(/Stitch/)).toBeDefined()
      expect(screen.getByText(/Upload/)).toBeDefined()
    })

    it('does not render step strip when compositeStep is null', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(buildCompositeStatus({ status: 'queued' })),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      // Step labels are rendered inside a flex container only when compositeStep is non-null
      expect(screen.queryByText('Cinematic')).toBeNull()
    })

    it('highlights the active step with an ellipsis indicator', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            buildCompositeStatus({
              status: 'processing',
              progress: 40,
              compositeStep: {
                currentStep: 'veo',
                stepLabel: 'Generating cinematic clip with Veo 3.1...',
                overallProgress: 40,
              },
            }),
          ),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      expect(screen.getByText('Cinematic ...')).toBeDefined()
    })
  })

  describe('stepLabel as status description', () => {
    it('shows stepLabel as the card description when compositeStep is present', async () => {
      const stepLabel = 'Stitching clips together...'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            buildCompositeStatus({
              status: 'processing',
              progress: 80,
              compositeStep: {
                currentStep: 'stitch',
                stepLabel,
                overallProgress: 80,
              },
            }),
          ),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      expect(screen.getByText(stepLabel)).toBeDefined()
    })
  })

  describe('completion and error callbacks', () => {
    it('calls onComplete when composite job completes', async () => {
      const result = {
        id: 'video-1',
        videoType: 'composite_reel',
        filename: 'composite-reel.mp4',
        storagePath: 'org-456/videos/composite_reel/abc.mp4',
        publicUrl: 'https://example.com/video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 1024000,
        durationSeconds: 14,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            buildCompositeStatus({
              status: 'completed',
              progress: 100,
              result: result as never,
            }),
          ),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledOnce()
        expect(onComplete.mock.calls[0]![0].id).toBe('video-1')
      })
    })

    it('calls onError when composite job fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve(
            buildCompositeStatus({
              status: 'failed',
              error: 'Veo API quota exceeded',
            }),
          ),
      })

      await act(async () => {
        render(
          <VideoGenerationStatus
            jobId="composite-org-456-111"
            onComplete={onComplete}
            onError={onError}
          />,
        )
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Veo API quota exceeded')
      })
    })
  })
})
