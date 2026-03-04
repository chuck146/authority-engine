import { GoogleGenAI } from '@google/genai'

let clientInstance: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  if (!clientInstance) {
    clientInstance = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY!,
    })
  }
  return clientInstance
}

export type GenerateImageOptions = {
  prompt: string
}

export type GeminiImageResult = {
  imageData: Buffer
  mimeType: string
  promptUsed: string
}

export async function generateImage(options: GenerateImageOptions): Promise<GeminiImageResult> {
  const client = getGeminiClient()

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: options.prompt,
    config: {
      responseModalities: ['IMAGE'],
    },
  })

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.mimeType?.startsWith('image/'),
  )

  if (!imagePart?.inlineData) {
    throw new Error('Gemini returned no image content')
  }

  return {
    imageData: Buffer.from(imagePart.inlineData.data!, 'base64'),
    mimeType: imagePart.inlineData.mimeType!,
    promptUsed: options.prompt,
  }
}
