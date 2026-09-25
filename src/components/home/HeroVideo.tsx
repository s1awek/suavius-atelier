'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/**
 * Poster first (it is the LCP image), the looping clip only when the visitor
 * has not asked for reduced motion. The clip is real footage of a finished piece.
 */
export function HeroVideo({
  videoUrl,
  posterUrl,
  alt,
}: {
  videoUrl: string | null
  posterUrl: string
  alt: string
}) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoUrl) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const v = ref.current
    if (!v) return
    v.src = videoUrl
    v.play().catch(() => {})
  }, [videoUrl])

  return (
    <div className="relative w-full h-full">
      <Image
        src={posterUrl}
        alt={alt}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 58vw"
        className="object-cover"
      />
      {videoUrl && (
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            playing ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
