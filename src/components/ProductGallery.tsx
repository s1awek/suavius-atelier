'use client'

import Image from 'next/image'
import { useState } from 'react'

export type GalleryImage = {
  id: number | string
  url: string
  alt: string
}

export type GalleryVideo = {
  id: number | string
  url: string
  /** Poster frame shown before playback and as the tile thumbnail. */
  poster: string
  alt: string
}

type Slide =
  | { kind: 'image'; id: number | string; url: string; alt: string }
  | { kind: 'video'; id: number | string; url: string; poster: string; alt: string }

type Props = {
  images: GalleryImage[]
  video?: GalleryVideo | null
  productTitle: string
}

export function ProductGallery({ images, video, productTitle }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Etsy convention: first image, then the video, then the remaining images.
  const slides: Slide[] = [
    ...images.slice(0, 1).map<Slide>((img) => ({ kind: 'image', ...img })),
    ...(video ? [{ kind: 'video' as const, ...video }] : []),
    ...images.slice(1).map<Slide>((img) => ({ kind: 'image', ...img })),
  ]

  if (slides.length === 0) {
    return (
      <div className="aspect-square bg-warm-mid flex items-center justify-center text-ink-muted text-sm rounded-md">
        [no images]
      </div>
    )
  }

  const active = slides[activeIdx] ?? slides[0]

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-warm-mid relative overflow-hidden rounded-md">
        {active.kind === 'video' ? (
          <video
            key={active.id}
            src={active.url}
            poster={active.poster}
            autoPlay
            muted
            loop
            playsInline
            controls
            aria-label={active.alt || `${productTitle} video`}
            className="absolute inset-0 h-full w-full object-cover animate-[fade-in_200ms_ease-out]"
          />
        ) : (
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt || productTitle}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover animate-[fade-in_200ms_ease-out]"
            priority
          />
        )}
      </div>

      {slides.length > 1 && (
        <div className="grid grid-cols-4 gap-3" role="tablist" aria-label="Product media">
          {slides.map((slide, i) => {
            const isActive = i === activeIdx
            const thumbUrl = slide.kind === 'video' ? slide.poster : slide.url
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                role="tab"
                aria-selected={isActive}
                aria-label={
                  slide.kind === 'video' ? 'Play product video' : `Show image ${i + 1}`
                }
                className={`aspect-square bg-warm-mid relative overflow-hidden cursor-pointer transition-all rounded-md ${
                  isActive
                    ? 'ring-2 ring-dark ring-offset-2 ring-offset-warm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={slide.alt || `${productTitle} ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                {slide.kind === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-dark/20">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warm/90 shadow-sm">
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-4 w-4 translate-x-[1px] fill-dark"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
