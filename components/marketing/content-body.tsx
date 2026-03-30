import sanitizeHtml from 'sanitize-html'
import { sanitizeOptions } from '@/lib/sanitize-config'
import type { StructuredContent } from '@/types/content'

export function ContentBody({ content }: { content: StructuredContent }) {
  return (
    <div className="prose prose-lg prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-a:text-[#1B2B5B] prose-a:underline-offset-2 hover:prose-a:text-[#1e3a5f] prose-strong:text-foreground prose-li:marker:text-amber-500 max-w-none">
      <div
        className="lead"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.intro, sanitizeOptions) }}
      />
      {content.sections.map((section, i) => (
        <section
          key={i}
          className={i > 0 ? 'mt-10 border-t border-gray-100 pt-10 dark:border-gray-800' : ''}
        >
          <h2>{section.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body, sanitizeOptions) }} />
        </section>
      ))}
    </div>
  )
}
