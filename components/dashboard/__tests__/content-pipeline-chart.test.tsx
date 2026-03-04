import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentPipelineChart } from '../content-pipeline-chart'
import { buildContentPipeline } from '@/tests/factories'

describe('ContentPipelineChart', () => {
  it('renders status legend with counts', () => {
    render(<ContentPipelineChart pipeline={buildContentPipeline()} />)

    expect(screen.getByText(/Published: 23/)).toBeInTheDocument()
    expect(screen.getByText(/Review: 3/)).toBeInTheDocument()
    expect(screen.getByText(/Draft: 2/)).toBeInTheDocument()
  })

  it('renders content type breakdown', () => {
    render(<ContentPipelineChart pipeline={buildContentPipeline()} />)

    expect(screen.getByText('Service Pages')).toBeInTheDocument()
    expect(screen.getByText('Location Pages')).toBeInTheDocument()
    expect(screen.getByText('Blog Posts')).toBeInTheDocument()
  })

  it('shows published count per type', () => {
    render(<ContentPipelineChart pipeline={buildContentPipeline()} />)

    expect(screen.getByText('8 published')).toBeInTheDocument()
    expect(screen.getByText('12 published')).toBeInTheDocument()
    expect(screen.getByText('3 published')).toBeInTheDocument()
  })

  it('shows empty state when no content', () => {
    render(
      <ContentPipelineChart
        pipeline={buildContentPipeline({
          totalContent: 0,
          statusBreakdown: { draft: 0, review: 0, approved: 0, published: 0, archived: 0 },
          byType: [],
        })}
      />,
    )

    expect(screen.getByText('No content yet.')).toBeInTheDocument()
  })

  it('renders total badges per type', () => {
    render(<ContentPipelineChart pipeline={buildContentPipeline()} />)

    // Badge values for total counts
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })
})
