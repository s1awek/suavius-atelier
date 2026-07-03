export function formatPrice(minorUnits: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(minorUnits / 100)
}

const MM_PER_INCH = 25.4

/** Diameter shown as metric cm + imperial inches, e.g. "10 cm (3.9 in)". */
export function formatDiameter(mm: number): string {
  const cm = mm / 10
  const cmStr = Number.isInteger(cm) ? String(cm) : cm.toFixed(1)
  return `${cmStr} cm (${(mm / MM_PER_INCH).toFixed(1)} in)`
}

/** Thickness shown as metric mm + imperial inches, e.g. "1.6 mm (0.06 in)". */
export function formatThickness(mm: number): string {
  return `${mm} mm (${(mm / MM_PER_INCH).toFixed(2)} in)`
}
