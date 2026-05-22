'use client'

import Image from 'next/image'
import { useState } from 'react'

export type GalleryImage = {
  id: number | string
  url: string
  alt: string
}

type Props = {
  images: GalleryImage[]
  productTitle: string
}

export function ProductGallery({ images, productTitle }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-warm-mid flex items-center justify-center text-ink-muted text-sm rounded-md">
        [no images]
      </div>
    )
  }

  const active = images[activeIdx] ?? images[0]

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-warm-mid relative overflow-hidden rounded-md">
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt || productTitle}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover animate-[fade-in_200ms_ease-out]"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3" role="tablist" aria-label="Product images">
          {images.map((img, i) => {
            const isActive = i === activeIdx
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                role="tab"
                aria-selected={isActive}
                aria-label={`Show image ${i + 1}`}
                className={`aspect-square bg-warm-mid relative overflow-hidden cursor-pointer transition-all rounded-md ${
                  isActive
                    ? 'ring-2 ring-dark ring-offset-2 ring-offset-warm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${productTitle} ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
