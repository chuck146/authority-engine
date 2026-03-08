import type { Job } from 'bullmq'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { OrgBranding } from '@/types'

export type BrandPropsSource = {
  orgContext: OrgContext
  branding: OrgBranding | null
  headingFont?: string
  bodyFont?: string
}

/** Download a file from Supabase Storage by storage path */
export async function downloadFromStorage(storagePath: string): Promise<Buffer> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from('media').download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download from storage: ${error?.message ?? 'no data'}`)
  }

  return Buffer.from(await data.arrayBuffer())
}

/** Stitch multiple MP4 clips together using FFmpeg concat demuxer */
export async function stitchClips(inputPaths: string[], outputPath: string): Promise<void> {
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)

  const concatListPath = path.join(os.tmpdir(), `concat-${Date.now()}.txt`)
  const concatContent = inputPaths.map((p) => `file '${p}'`).join('\n')
  fs.writeFileSync(concatListPath, concatContent)

  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outputPath,
    ])
  } catch {
    // If stream copy fails (different codecs/params), re-encode
    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        '-pix_fmt',
        'yuv420p',
        outputPath,
      ])
    } catch (reencodeErr) {
      throw new Error(
        `FFmpeg stitching failed: ${reencodeErr instanceof Error ? reencodeErr.message : String(reencodeErr)}`,
      )
    }
  } finally {
    try {
      fs.unlinkSync(concatListPath)
    } catch {
      // Non-critical
    }
  }
}

/** Create a mock Job object for running sub-renders inline */
export function createMockJob<T>(data: T): Job<T> {
  return {
    data,
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    updateProgress: async () => {},
  } as unknown as Job<T>
}

/** Build Remotion brand props from job data */
export function buildBrandProps(data: BrandPropsSource) {
  return {
    orgName: data.orgContext.orgName,
    tagline: data.branding?.tagline ?? undefined,
    primaryColor: data.branding?.primary ?? '#1B2B5B',
    secondaryColor: data.branding?.secondary ?? '#fbbf24',
    accentColor: data.branding?.accent ?? '#1e3a5f',
    headingFont: data.headingFont ?? 'Montserrat',
    bodyFont: data.bodyFont ?? 'DMSans',
  }
}
