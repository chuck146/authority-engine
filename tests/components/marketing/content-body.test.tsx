import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentBody } from '@/components/marketing/content-body'
import { structuredContentSchema, type StructuredContent } from '@/types/content'

const base: StructuredContent = {
  headline: 'Interior Painting',
  intro: '<p>Intro</p>',
  sections: [{ title: 'Our Process', body: '<p>Prep, prime, paint.</p>' }],
  cta: 'Get a free estimate',
  meta_title: 'Interior Painting | Cleanest Painting',
  meta_description: 'Interior painting in NJ.',
}

describe('ContentBody FAQs', () => {
  it('renders FAQs as visible question headings with answers', () => {
    render(
      <ContentBody
        content={{
          ...base,
          faqs: [
            {
              question: 'What is included in an interior painting estimate?',
              answer: 'Your estimate lists the rooms and surfaces, prep work, and paint.',
            },
          ],
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Common Questions' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'What is included in an interior painting estimate?',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/lists the rooms and surfaces/)).toBeInTheDocument()
  })

  it('renders nothing extra without FAQs', () => {
    render(<ContentBody content={base} />)
    expect(screen.queryByText('Common Questions')).not.toBeInTheDocument()
  })

  it('sanitizes FAQ answers', () => {
    const { container } = render(
      <ContentBody
        content={{
          ...base,
          faqs: [{ question: 'Is this safe?', answer: 'Yes<script>alert(1)</script> it is.' }],
        }}
      />,
    )
    expect(container.querySelector('script')).toBeNull()
  })

  it('keeps faqs through schema validation (dashboard edits must not strip them)', () => {
    const parsed = structuredContentSchema.parse({
      ...base,
      faqs: [{ question: 'How long does it take?', answer: 'Most rooms take a day or two.' }],
    })
    expect(parsed.faqs).toHaveLength(1)
  })
})
