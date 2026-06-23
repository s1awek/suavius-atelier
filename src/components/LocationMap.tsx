import Image from 'next/image'

export function LocationMap() {
  return (
    <figure className="w-full">
      <div className="relative aspect-[223/192] bg-[#ede2cf] border border-warm-mid overflow-hidden">
        <Image
          src="/brand/map-bielawa.webp"
          alt="Hand-drawn map showing Bielawa in Lower Silesia, Poland, at the foot of the Owl Mountains"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={false}
        />
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">
        Our atelier is in Bielawa, at the foot of the Owl Mountains. Visits by appointment.
      </figcaption>
    </figure>
  )
}
