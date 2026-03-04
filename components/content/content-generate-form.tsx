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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContentPreview } from '@/components/content/content-preview'
import {
  servicePageInputSchema,
  locationPageInputSchema,
  blogPostInputSchema,
  type ContentType,
  type ContentListItem,
  type GenerateContentResponse,
  type StructuredContent,
} from '@/types/content'

type ContentGenerateFormProps = {
  onGenerated: (item: ContentListItem) => void
}

const schemaMap = {
  service_page: servicePageInputSchema,
  location_page: locationPageInputSchema,
  blog_post: blogPostInputSchema,
} as const

// Unified form values type — superset of all content type fields.
// The Zod resolver validates per-type constraints; this type satisfies useForm's generics.
type ContentFormValues = {
  contentType: ContentType
  serviceName: string
  serviceDescription: string
  city: string
  state: string
  topic: string
  category: string
  tone: 'professional' | 'friendly' | 'authoritative'
  targetKeywords: string[] | undefined
  targetWordCount: number
}

function getDefaultValues(type: ContentType): ContentFormValues {
  const base = {
    serviceName: '',
    serviceDescription: '',
    city: '',
    state: '',
    topic: '',
    category: '',
    targetKeywords: undefined,
    targetWordCount: 800,
  }
  switch (type) {
    case 'service_page':
      return { ...base, contentType: 'service_page', tone: 'professional' }
    case 'location_page':
      return { ...base, contentType: 'location_page', tone: 'professional' }
    case 'blog_post':
      return { ...base, contentType: 'blog_post', tone: 'friendly' }
  }
}

export function ContentGenerateForm({ onGenerated }: ContentGenerateFormProps) {
  const [selectedType, setSelectedType] = useState<ContentType>('service_page')
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<{
    content: StructuredContent
    title: string
    contentType: ContentType
  } | null>(null)

  const currentSchema = schemaMap[selectedType]

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: getDefaultValues(selectedType),
  })

  function handleTypeChange(type: ContentType) {
    setSelectedType(type)
    form.reset(getDefaultValues(type))
    setPreview(null)
  }

  async function onSubmit(values: ContentFormValues) {
    setIsGenerating(true)
    setPreview(null)

    try {
      const response = await fetch('/api/v1/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Generation failed')
      }

      const result: GenerateContentResponse = await response.json()

      setPreview({
        content: result.content,
        title: result.title,
        contentType: result.contentType,
      })

      toast.success('Content generated successfully! Review it below.')

      onGenerated({
        id: result.id,
        type: result.contentType,
        title: result.title,
        slug: result.slug,
        status: result.status,
        seoScore: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
          <CardDescription>
            Select a content type and fill in the details. AI will generate SEO-optimized content
            for your review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium">Content Type</label>
            <Select value={selectedType} onValueChange={(v) => handleTypeChange(v as ContentType)}>
              <SelectTrigger className="mt-1.5 w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_page">Service Page</SelectItem>
                <SelectItem value="location_page">Location Page</SelectItem>
                <SelectItem value="blog_post">Blog Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {selectedType === 'service_page' && <ServicePageFields />}
              {selectedType === 'location_page' && <LocationPageFields />}
              {selectedType === 'blog_post' && <BlogPostFields />}

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                      <FormControl>
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Keywords (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., interior painting, house painter"
                        value={(field.value as string[] | undefined)?.join(', ') ?? ''}
                        onChange={(e) => {
                          const keywords = e.target.value
                            .split(',')
                            .map((k) => k.trim())
                            .filter(Boolean)
                          field.onChange(keywords.length > 0 ? keywords : undefined)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated keywords. Leave empty for AI to suggest.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isGenerating} className="mt-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating (this may take 10-15 seconds)...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Generate Content
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {preview && (
        <ContentPreview
          content={preview.content}
          title={preview.title}
          contentType={preview.contentType}
        />
      )}
    </div>
  )
}

// --- Sub-components using useFormContext from parent Form provider ---

function ServicePageFields() {
  const { control } = useFormContext()

  return (
    <>
      <FormField
        control={control}
        name="serviceName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Interior Painting" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="serviceDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Description (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Brief description of what this service includes..."
                {...field}
              />
            </FormControl>
            <FormDescription>
              Help the AI understand the specifics of your service offering.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function LocationPageFields() {
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
              <FormDescription>2-letter code</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}

function BlogPostFields() {
  const { control } = useFormContext()

  return (
    <>
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
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tips & Guides" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="targetWordCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Word Count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={300}
                  max={3000}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 800)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
