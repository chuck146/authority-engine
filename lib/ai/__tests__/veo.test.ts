import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateVideos = vi.fn()
const mockGetVideosOperation = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateVideos: mockGenerateVideos,
      generateContent: vi.fn(),
    },
    operations: {
      getVideosOperation: mockGetVideosOperation,
    },
  })),
}))

// Must import after mock setup
const { generateVideo } = await import('../veo')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateVideo', () => {
  it('returns video data when operation completes immediately', async () => {
    const videoBytes = Buffer.from('fake-video-data').toString('base64')

    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [
          {
            video: { videoBytes },
          },
        ],
      },
    })

    const result = await generateVideo({
      prompt: 'A beautiful painted room',
      model: 'veo-3.1-fast-generate-preview',
    })

    expect(result.mimeType).toBe('video/mp4')
    expect(result.durationSeconds).toBe(8)
    expect(result.videoData).toBeInstanceOf(Buffer)
    expect(result.promptUsed).toBe('A beautiful painted room')
  })

  it('polls until operation is done', async () => {
    vi.useFakeTimers()
    const videoBytes = Buffer.from('final-video').toString('base64')

    mockGenerateVideos.mockResolvedValue({
      done: false,
      name: 'operations/123',
    })

    mockGetVideosOperation
      .mockResolvedValueOnce({ done: false, name: 'operations/123' })
      .mockResolvedValueOnce({
        done: true,
        response: {
          generatedVideos: [{ video: { videoBytes } }],
        },
      })

    const promise = generateVideo({
      prompt: 'Test prompt',
      model: 'veo-3.1-fast-generate-preview',
    })

    // Advance through poll delays
    await vi.advanceTimersByTimeAsync(5_000)
    await vi.advanceTimersByTimeAsync(10_000)

    const result = await promise

    expect(mockGetVideosOperation).toHaveBeenCalledTimes(2)
    expect(result.videoData).toBeInstanceOf(Buffer)
    vi.useRealTimers()
  })

  it('downloads video from URI when videoBytes not present', async () => {
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    } as Response)

    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [
          {
            video: { uri: 'https://storage.example.com/video.mp4' },
          },
        ],
      },
    })

    const result = await generateVideo({
      prompt: 'Test prompt',
      model: 'veo-3.1-fast-generate-preview',
    })

    expect(mockFetch).toHaveBeenCalledWith('https://storage.example.com/video.mp4')
    expect(result.videoData).toBeInstanceOf(Buffer)

    mockFetch.mockRestore()
  })

  it('throws when no video content returned', async () => {
    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [],
      },
    })

    await expect(
      generateVideo({
        prompt: 'Test',
        model: 'veo-3.1-fast-generate-preview',
      }),
    ).rejects.toThrow('Veo returned no video content')
  })

  it('throws when video has no data or URI', async () => {
    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [{ video: {} }],
      },
    })

    await expect(
      generateVideo({
        prompt: 'Test',
        model: 'veo-3.1-fast-generate-preview',
      }),
    ).rejects.toThrow('Veo returned video with no data or URI')
  })

  it('passes image parameter when starting frame provided', async () => {
    const videoBytes = Buffer.from('video-data').toString('base64')

    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [{ video: { videoBytes } }],
      },
    })

    await generateVideo({
      prompt: 'Test prompt',
      model: 'veo-3.1-fast-generate-preview',
      image: {
        imageData: Buffer.from('image-data'),
        mimeType: 'image/png',
        promptUsed: 'Starting frame prompt',
      },
    })

    const callArgs = mockGenerateVideos.mock.calls[0]![0]
    expect(callArgs.image).toBeDefined()
    expect(callArgs.image.mimeType).toBe('image/png')
  })

  it('passes aspect ratio config', async () => {
    const videoBytes = Buffer.from('video-data').toString('base64')

    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [{ video: { videoBytes } }],
      },
    })

    await generateVideo({
      prompt: 'Test',
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: '16:9',
    })

    const callArgs = mockGenerateVideos.mock.calls[0]![0]
    expect(callArgs.config.aspectRatio).toBe('16:9')
  })
})
