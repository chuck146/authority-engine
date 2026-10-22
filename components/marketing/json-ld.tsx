// Escape "<" so content can never close the <script> tag (e.g. "</script>" in a
// headline). \u003c is still valid JSON and parses back to "<".
export function serializeJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

export function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null

  return (
    <>
      {data.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
    </>
  )
}
