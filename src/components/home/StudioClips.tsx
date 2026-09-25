'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

export type Clip = {
  href: string
  title: string
  posterUrl: string
  posterAlt: string
  videoUrl: string | null
}

/**
 * Bench footage of the real pieces. Posters are static; a clip plays only while its
 * tile is hovered or focused, so there is never more than one thing moving on screen.
 * The video source is attached on first interest, so nothing downloads up front.
 */
export function StudioClips({ clips }: { clips: Clip[] }) {
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {clips.map((clip) => (
        <li key={clip.href}>
          <ClipTile clip={clip} />
        </li>
      ))}
    </ul>
  )
}

function ClipTile({ clip }: { clip: Clip }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const start = () => {
    const v = videoRef.current
    if (!v || !clip.videoUrl) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!v.src) v.src = clip.videoUrl
    v.play().then(() => v.classList.replace('opacity-0', 'opacity-100')).catch(() => {})
  }
  const stop = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.classList.replace('opacity-100', 'opacity-0')
  }

  return (
    <Link
      href={clip.href}
      className="group block"
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <div className="relative aspect-square overflow-hidden bg-board">
        <Image
          src={clip.posterUrl}
          alt={clip.posterAlt}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        {clip.videoUrl && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
          />
        )}
      </div>
      <p className="mt-3 text-base text-dark leading-snug group-hover:text-copper transition-colors">
        {clip.title}
      </p>
    </Link>
  )
}
