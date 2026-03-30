import type { IOptions } from 'sanitize-html'

/**
 * Explicit sanitize-html configuration for all user/AI-generated HTML content.
 * Used by content-body.tsx and content-preview.tsx.
 *
 * Allows only safe formatting tags — no scripts, iframes, forms, or event handlers.
 */
export const sanitizeOptions: IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'a',
    'b',
    'i',
    'em',
    'strong',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    '*': ['class'],
  },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        ...(attribs.target === '_blank' ? { target: '_blank' } : {}),
      },
    }),
  },
}
