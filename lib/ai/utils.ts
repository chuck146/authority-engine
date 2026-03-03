export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateTitleFromInput(input: {
  contentType: string
  serviceName?: string
  city?: string
  state?: string
  topic?: string
}): string {
  switch (input.contentType) {
    case 'service_page':
      return input.serviceName ?? 'Service Page'
    case 'location_page':
      return `${input.serviceName ?? 'Service'} in ${input.city ?? 'City'}, ${input.state ?? 'ST'}`
    case 'blog_post':
      return input.topic ?? 'Blog Post'
    default:
      return 'Content'
  }
}
