'use client'

import { useState } from 'react'
import { useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  blogThumbnailInputSchema,
  locationHeroInputSchema,
  socialGraphicInputSchema,
  type ImageType,
  type GenerateImageResponse,
} from '@/types/media'

type ImageGenerateFormProps = {
  onGenerated: (result: GenerateImageResponse) => void
}

const schemaMap = {
  blog_thumbnail: blogThumbnailInputSchema,
  location_hero: locationHeroInputSchema,
  social_graphic: socialGraphicInputSchema,
} as const

type ImageFormValues = {
  imageType: ImageType
  topic: string
  city: string
  state: string
  serviceName: string
  message: string
  style: 'photorealistic' | 'illustration' | 'flat' | 'watercolor'
  mood: 'warm' | 'cool' | 'vibrant' | 'neutral' | 'dramatic'
}

function getDefaultValues(type: ImageType): ImageFormValues {
  const base = {
    topic: '',
    city: '',
    state: '',
    serviceName: '',
    message: '',
    style: 'photorealistic' as const,
    mood: 'warm' as const,
  }
  return { ...base, imageType: type }
}

export function ImageGenerateForm({ onGenerated }: ImageGenerateFormProps) {
  const [selectedType, setSelectedType] = useState<ImageType>('blog_thumbnail')
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<GenerateImageResponse | null>(null)

  const currentSchema = schemaMap[selectedType]

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: getDefaultValues(selectedType),
  })

  function handleTypeChange(type: ImageType) {
    setSelectedType(type)
    form.reset(getDefaultValues(type))
    setPreview(null)
  }

  async function onSubmit(values: ImageFormValues) {
    setIsGenerating(true)
    setPreview(null)

    try {
      const response = await fetch('/api/v1/media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Image generation failed')
      }

      const result: GenerateImageResponse = await response.json()
      setPreview(result)
      toast.success('Image generated successfully!')
      onGenerated(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Image</CardTitle>
          <CardDescription>
            Select an image type and fill in the details. AI will generate a high-quality image for
            your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium">Image Type</label>
            <Select
              value={selectedType}
              onValueChange={(v) => handleTypeChange(v as ImageType)}
            >
              <SelectTrigger className="mt-1.5 w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog_thumbnail">Blog Thumbnail</SelectItem>
                <SelectItem value="location_hero">Location Hero</SelectItem>
                <SelectItem value="social_graphic">Social Graphic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {selectedType === 'blog_thumbnail' && <BlogThumbnailFields />}
              {selectedType === 'location_hero' && <LocationHeroFields />}
              {selectedType === 'social_graphic' && <SocialGraphicFields />}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="photorealistic">Photorealistic</SelectItem>
                          <SelectItem value="illustration">Illustration</SelectItem>
                          <SelectItem value="flat">Flat Design</SelectItem>
                          <SelectItem value="watercolor">Watercolor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedType !== 'location_hero' && (
                  <FormField
                    control={form.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mood</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cool">Cool</SelectItem>
                            <SelectItem value="vibrant">Vibrant</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="dramatic">Dramatic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Button type="submit" disabled={isGenerating} className="mt-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating (2-5 seconds)...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate Image
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.publicUrl}
              alt={preview.altText}
              className="max-h-[500px] rounded-lg object-contain"
            />
            <p className="text-muted-foreground mt-2 text-sm">{preview.altText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BlogThumbnailFields() {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name="topic"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Topic</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., How to Choose Paint Colors for Your Living Room"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function LocationHeroFields() {
  const { control } = useFormContext()

  return (
    <>
      <FormField
        control={control}
        name="serviceName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Painting Services" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="NJ" maxLength={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}

function SocialGraphicFields() {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name="message"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Message / Theme</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Spring special: 15% off exterior painting"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
