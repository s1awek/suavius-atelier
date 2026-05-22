'use client'

import type { DefaultServerCellComponentProps } from 'payload'

const fmt = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

export function PriceCell({ cellData }: DefaultServerCellComponentProps) {
  if (typeof cellData !== 'number' || Number.isNaN(cellData)) return <span>—</span>
  return <span>{fmt.format(cellData / 100)}</span>
}
