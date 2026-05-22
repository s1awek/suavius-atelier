'use client'

import { useField } from '@payloadcms/ui'

type Props = {
  path: string
}

const fmt = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

export function PriceDescription({ path }: Props) {
  const { value } = useField<number | null | undefined>({ path })
  const num = typeof value === 'number' && !Number.isNaN(value) ? value : null

  return (
    <div
      style={{
        marginTop: '0.25rem',
        fontSize: '0.85rem',
        color: 'var(--theme-elevation-500)',
      }}
    >
      {num !== null ? (
        <>
          = <strong style={{ color: 'var(--theme-elevation-800)' }}>{fmt.format(num / 100)}</strong>
          {'  ·  '}
        </>
      ) : null}
      enter in cents (e.g. 2900 = €29.00)
    </div>
  )
}
