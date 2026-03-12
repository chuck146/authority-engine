import Image from 'next/image'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'

type Project = {
  src: string
  alt: string
  label: string
}

type ProjectGalleryProps = {
  projects: Project[]
}

export function ProjectGallery({ projects }: ProjectGalleryProps) {
  if (projects.length < 4) return null

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl">
            Recent <em className="text-[var(--color-brand-green)] not-italic">Work</em>
          </h2>
        </ScrollReveal>

        {/* Row 1: exterior wide + interior tall */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-12">
          <ScrollReveal className="sm:col-span-7">
            <div className="group overflow-hidden rounded-xl">
              <Image
                src={projects[0]!.src}
                alt={projects[0]!.alt}
                width={1024}
                height={768}
                sizes="(max-width: 640px) 100vw, 58vw"
                className="h-[300px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 sm:h-[420px]"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{projects[0]!.label}</p>
          </ScrollReveal>

          <ScrollReveal className="sm:col-span-5" delay={100}>
            <div className="group relative h-[300px] overflow-hidden rounded-xl sm:h-[420px]">
              <Image
                src={projects[1]!.src}
                alt={projects[1]!.alt}
                fill
                sizes="(max-width: 640px) 100vw, 42vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{projects[1]!.label}</p>
          </ScrollReveal>
        </div>

        {/* Row 2: interior landscape + wallpaper portrait */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
          <ScrollReveal className="sm:col-span-5" delay={200}>
            <div className="group relative h-[300px] overflow-hidden rounded-xl sm:h-[420px]">
              <Image
                src={projects[2]!.src}
                alt={projects[2]!.alt}
                fill
                sizes="(max-width: 640px) 100vw, 42vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{projects[2]!.label}</p>
          </ScrollReveal>

          <ScrollReveal className="sm:col-span-7" delay={300}>
            <div className="group relative h-[300px] overflow-hidden rounded-xl sm:h-[420px]">
              <Image
                src={projects[3]!.src}
                alt={projects[3]!.alt}
                fill
                sizes="(max-width: 640px) 100vw, 58vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{projects[3]!.label}</p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
