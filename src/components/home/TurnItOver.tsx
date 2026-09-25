'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

export type Face = { url: string; alt: string }

type Row = { label: string; title: string; body: string }

const ROWS: Row[] = [
  {
    label: 'Front',
    title: 'The picture',
    body: 'Drawn in our studio and printed with UV-cured multicolour silkscreen, straight onto the board.',
  },
  {
    label: 'Edge',
    title: 'The board',
    body: '1.6 mm of FR4 glass-fibre laminate, 100 mm across, 38 g. The gold rim is the copper layer itself, plated with nickel and immersion gold (ENIG).',
  },
  {
    label: 'Back',
    title: 'The reverse',
    body: 'A pattern in bare ENIG gold and the SA mark. Every PCB coaster has one, so either side can face up.',
  },
]

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * The one scroll-driven moment on the home page: a coaster turns from its printed
 * front to its gold reverse while the spec rows follow. Scroll writes straight to
 * the DOM in rAF (transform and opacity only, no CSS transitions on driven
 * properties), so it tracks the scroll frame by frame. Reduced motion gets a
 * static layout with both faces side by side.
 */
// Scroll phases (pinned, desktop): front turns to edge-on, holds while the layer
// section is drawn, then turns on to the reverse.
const TO_EDGE: [number, number] = [0.08, 0.36]
const HOLD_END = 0.6
const TO_BACK: [number, number] = [0.6, 0.88]

// Edge-on, the front faces right (rotateY +90deg), so the layers read gold | core | print.
// Thickness is exaggerated; the legend carries the real figures.
const LAYERS = [
  { label: 'ENIG gold, reverse', className: 'w-[5px] bg-enig' },
  { label: 'FR4 core, 1.6 mm', className: 'w-6 bg-[#cbc39a]' },
  { label: 'UV print, front', className: 'w-[5px] bg-[#2f8f9d]' },
]

export function TurnItOver({ front, back }: { front: Face; back: Face }) {
  const sectionRef = useRef<HTMLElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  const edgeBarRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const pinned = window.matchMedia('(min-width: 768px)')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      if (!pinned.matches) return
      const rect = section.getBoundingClientRect()
      const p = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight))
      const toEdge = ease(clamp((p - TO_EDGE[0]) / (TO_EDGE[1] - TO_EDGE[0])))
      const toBack = ease(clamp((p - TO_BACK[0]) / (TO_BACK[1] - TO_BACK[0])))
      const angle = 90 * toEdge + 90 * toBack
      // The layer section is visible only while the disc stands edge-on.
      const edge = Math.min(
        clamp((p - (TO_EDGE[1] - 0.04)) / 0.06),
        clamp((HOLD_END + 0.02 - p) / 0.06),
      )
      if (discRef.current) {
        discRef.current.style.transform = `rotateX(8deg) rotateY(${angle}deg)`
      }
      if (shadowRef.current) {
        shadowRef.current.style.transform = `scaleX(${0.2 + 0.8 * Math.abs(Math.cos((angle * Math.PI) / 180))})`
      }
      if (edgeRef.current) {
        edgeRef.current.style.opacity = String(edge)
      }
      if (edgeBarRef.current) edgeBarRef.current.style.transform = `scaleY(${edge})`
      if (barRef.current) barRef.current.style.transform = `scaleY(${p})`
      const active = p < TO_EDGE[1] - 0.04 ? 0 : p < HOLD_END + 0.02 ? 1 : 2
      rowRefs.current.forEach((row, i) => {
        if (row) row.style.opacity = i === active ? '1' : '0.45'
      })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const faceImage = (face: Face, sizes: string) => (
    <Image src={face.url} alt={face.alt} fill sizes={sizes} className="object-contain" />
  )

  return (
    <section
      ref={sectionRef}
      id="turn-it-over"
      aria-labelledby="turn-it-over-title"
      className="relative bg-board text-silk md:h-[300vh] motion-reduce:h-auto"
    >
      <div className="md:sticky md:top-0 md:h-[100svh] motion-reduce:static motion-reduce:h-auto overflow-hidden">
        <div className="max-w-7xl mx-auto h-full px-6 py-16 md:py-0 grid gap-8 md:gap-16 md:grid-cols-12 content-center md:items-center">
          <p aria-hidden="true" className="md:hidden text-4xl leading-[1.02]">
            Turn it <em className="text-enig">over.</em>
          </p>
          <div className="md:col-span-6 md:order-2 relative">
            {/* Desktop: the turning disc. */}
            <div className="hidden md:block motion-reduce:!hidden relative mx-auto w-[min(40vw,62svh)]">
              <div className="aspect-square [perspective:1600px]">
                <div
                  ref={discRef}
                  className="relative w-full h-full [transform-style:preserve-3d] will-change-transform"
                  style={{ transform: 'rotateX(8deg) rotateY(0deg)' }}
                >
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    {faceImage(front, '40vw')}
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {faceImage(back, '40vw')}
                  </div>
                </div>
              </div>
              <div
                ref={edgeRef}
                aria-hidden="true"
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center opacity-0"
              >
                <div ref={edgeBarRef} className="flex h-[88%] origin-center" style={{ transform: 'scaleY(0)' }}>
                  {LAYERS.map((layer) => (
                    <div key={layer.label} className={layer.className} />
                  ))}
                </div>
                <ul className="absolute left-full ml-10 space-y-3 font-mono text-xs text-silk-muted whitespace-nowrap">
                  {LAYERS.map((layer) => (
                    <li key={layer.label} className="flex items-center gap-3">
                      <span className={`h-3 ${layer.className.replace(/w-\S+/, 'w-3')}`} />
                      {layer.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                ref={shadowRef}
                aria-hidden="true"
                className="mx-auto mt-6 h-6 w-3/4 bg-[radial-gradient(ellipse_at_center,rgba(241,239,232,0.10),transparent_70%)]"
              />
            </div>
            {/* Phones and reduced motion: both faces side by side. */}
            <div className="grid md:hidden motion-reduce:!grid grid-cols-2 gap-4">
              <figure>
                <div className="relative aspect-square">{faceImage(front, '45vw')}</div>
              </figure>
              <figure>
                <div className="relative aspect-square">{faceImage(back, '45vw')}</div>
              </figure>
            </div>
          </div>

          <div className="md:col-span-6 md:order-1 max-w-xl">
            <h2 id="turn-it-over-title" className="sr-only md:not-sr-only text-4xl md:text-6xl leading-[1.02]">
              Turn it <em className="text-enig">over.</em>
            </h2>
            <div className="mt-2 md:mt-12 flex gap-6">
              <div className="relative w-px bg-silk/15 shrink-0 hidden md:block" aria-hidden="true">
                <div
                  ref={barRef}
                  className="absolute inset-0 bg-enig origin-top will-change-transform motion-reduce:hidden"
                  style={{ transform: 'scaleY(0)' }}
                />
              </div>
              <ol className="space-y-6 md:space-y-8">
                {ROWS.map((row, i) => (
                  <li
                    key={row.label}
                    ref={(el) => {
                      rowRefs.current[i] = el
                    }}
                    className={i === 0 ? '' : 'md:opacity-45 motion-reduce:!opacity-100'}
                  >
                    <p className="font-mono text-xs text-enig">{row.label}</p>
                    <h3 className="mt-2 text-xl md:text-2xl">{row.title}</h3>
                    <p className="mt-2 text-base text-silk-muted leading-relaxed max-w-[42ch]">
                      {row.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
