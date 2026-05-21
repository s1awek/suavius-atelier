export function formatPrice(minorUnits: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(minorUnits / 100)
}
