import Image from 'next/image'
import Link from 'next/link'
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
  if (projects.length < 3) return null

  return (
    <section id="work" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
        <ScrollReveal>
          <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl">
            Recent Work
          </h2>
        </ScrollReveal>

        {/* Desktop: asymmetric 2-col (1 tall + 2 landscape) */}
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left — tall image spanning full height */}
          <ScrollReveal>
            <div className="group relative aspect-[3/4] overflow-hidden rounded-xl lg:h-full">
              <Image
                src={projects[0]!.src}
                alt={projects[0]!.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5">
                <p className="text-sm font-medium text-white">{projects[0]!.label}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right — 2 landscape images stacked */}
          <div className="flex flex-col gap-4">
            {projects.slice(1, 3).map((project, i) => (
              <ScrollReveal key={project.src} delay={(i + 1) * 100}>
                <div className="group relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={project.src}
                    alt={project.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5">
                    <p className="text-sm font-medium text-white">{project.label}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Optional 4th image — full width below */}
        {projects[3] && (
          <ScrollReveal delay={300}>
            <div className="group relative mt-4 aspect-[21/9] overflow-hidden rounded-xl">
              <Image
                src={projects[3].src}
                alt={projects[3].alt}
                fill
                sizes="100vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5">
                <p className="text-sm font-medium text-white">{projects[3].label}</p>
              </div>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <div className="mt-8">
            <Link
              href="/locations"
              className="text-sm font-medium text-[#1B2B5B] underline underline-offset-4 transition-colors hover:text-[#1B2B5B]/70"
            >
              View all projects
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
