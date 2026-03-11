export function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null

  return (
    <>
      {data.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
