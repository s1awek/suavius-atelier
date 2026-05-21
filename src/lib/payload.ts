import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getPayloadClient() {
  const resolvedConfig = await config
  return getPayload({ config: resolvedConfig })
}

export { formatPrice } from './format'
