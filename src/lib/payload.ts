import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getPayloadClient() {
  const resolvedConfig = await config
  return getPayload({ config: resolvedConfig })
}

export function formatPrice(minorUnits: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(minorUnits / 100)
}
