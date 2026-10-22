import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd, serializeJsonLd } from '@/components/marketing/json-ld'

describe('serializeJsonLd', () => {
  it('escapes < so </script> cannot appear', () => {
    const out = serializeJsonLd({ headline: 'Evil </script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c')
  })

  it('round-trips through JSON.parse', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'HousePainter',
      name: 'A <b>bold</b> & "quoted" name',
      nested: { list: [1, 2, '<x>'] },
    }
    expect(JSON.parse(serializeJsonLd(schema))).toEqual(schema)
  })
})

describe('JsonLd', () => {
  it('renders one script per schema', () => {
    const { container } = render(
      <JsonLd data={[{ '@type': 'WebSite' }, { '@type': 'HousePainter', name: '</script>' }]} />,
    )
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(2)
    expect(JSON.parse(scripts[0]!.innerHTML)).toEqual({ '@type': 'WebSite' })
    expect(JSON.parse(scripts[1]!.innerHTML)).toEqual({
      '@type': 'HousePainter',
      name: '</script>',
    })
  })

  it('renders nothing for an empty array', () => {
    const { container } = render(<JsonLd data={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
