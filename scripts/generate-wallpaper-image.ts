import { config } from 'dotenv'
config({ path: '.env.local' })

import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const OUTPUT = path.resolve('public/project-4.jpeg')

const prompt = `Professional interior design photography of a luxury home theater room. Deep navy blue / midnight blue painted walls with raised panel wainscoting molding creating an elegant grid pattern. Matching dark navy ceiling painted the same color for an immersive cocoon effect. Moody ambient lighting from brushed nickel wall sconces casting warm downward light, with subtle LED strip lighting along tiered steps. Plush gray modular lounge seating arranged in stadium-style tiers with textured gray and charcoal throw pillows. A small black side table with a classic red-and-white popcorn box. Built-in navy shelving on the right wall with glass candy jars and popcorn containers. Dark plush carpet. Shot with a wide-angle lens from the doorway/entrance perspective looking into the room, capturing the full dramatic atmosphere. Magazine-quality interior design photography, warm cinematic tones, professional real estate style. 4K resolution, sharp detail, photorealistic.`

async function generate() {
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

  console.log('Generating image with Gemini Flash Image...')
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
    },
  })

  const imagePart = response.candidates?.[0]?.content?.parts?.find((part) =>
    part.inlineData?.mimeType?.startsWith('image/'),
  )

  if (!imagePart?.inlineData) {
    throw new Error('Gemini returned no image content')
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data!, 'base64')
  console.log(`Raw image: ${(imageBuffer.length / 1024).toFixed(0)}KB`)

  // Convert to high-quality JPEG and ensure good dimensions
  await sharp(imageBuffer)
    .resize(1920, undefined, { withoutEnlargement: false })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(OUTPUT)

  const stats = fs.statSync(OUTPUT)
  const meta = await sharp(OUTPUT).metadata()
  console.log(`Saved: ${OUTPUT}`)
  console.log(`Size: ${(stats.size / 1024).toFixed(0)}KB`)
  console.log(`Dimensions: ${meta.width}x${meta.height}`)
}

generate().catch(console.error)
