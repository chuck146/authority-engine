import DOMPurify from 'isomorphic-dompurify'
import type { StructuredContent } from '@/types/content'

export function ContentBody({ content }: { content: StructuredContent }) {
  return (
    <div className="prose prose-lg max-w-none">
      <p className="lead">{content.intro}</p>
      {content.sections.map((section, i) => (
        <section key={i}>
          <h2>{section.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.body) }} />
        </section>
      ))}
    </div>
  )
}
