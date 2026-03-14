import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const INPUT = path.resolve('public/project-4.jpeg')
const BACKUP = path.resolve('public/project-4.original.jpeg')
const OUTPUT = INPUT

async function enhance() {
  // Backup original
  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(INPUT, BACKUP)
    console.log('Backed up original to project-4.original.jpeg')
  }

  await sharp(BACKUP)
    .resize(1920, 2560, {
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    // Reduce glare: slight gamma correction (darken highlights)
    .gamma(1.8)
    // Boost wallpaper color vibrancy
    .modulate({ brightness: 0.95, saturation: 1.15 })
    // Sharpen to recover detail
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 0.5 })
    // Normalize contrast
    .normalize()
    // High-quality JPEG output
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(OUTPUT)

  const stats = fs.statSync(OUTPUT)
  console.log(`Enhanced image written: ${(stats.size / 1024).toFixed(0)}KB`)

  // Show dimensions
  const meta = await sharp(OUTPUT).metadata()
  console.log(`Dimensions: ${meta.width}x${meta.height}`)
}

enhance().catch(console.error)
