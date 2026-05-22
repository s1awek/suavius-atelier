import nodemailer, { type Transporter } from 'nodemailer'
import { formatPrice } from './format'

let cached: Transporter | null = null

function getTransport(): Transporter {
  if (cached) return cached

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD must be set')
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return cached
}

export type OrderConfirmationItem = {
  title: string
  quantity: number
  priceAtPurchase: number
}

export type OrderConfirmationInput = {
  orderId: number | string
  customerEmail: string
  customerName: string
  items: OrderConfirmationItem[]
  total: number
  currency: string
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
  }
}

const FROM_NAME = 'Suavius Atelier'

function renderCustomerEmail(input: OrderConfirmationInput): string {
  const { orderId, customerName, items, total, currency, shippingAddress } = input

  const itemsRows = items
    .map(
      (it) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8e0d0;color:#2c2825;font-family:Georgia,serif;">
            ${escapeHtml(it.title)}
            <span style="color:#8c7b6b;"> &times; ${it.quantity}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8e0d0;color:#2c2825;text-align:right;font-family:Georgia,serif;">
            ${formatPrice(it.priceAtPurchase * it.quantity, currency)}
          </td>
        </tr>`,
    )
    .join('')

  const addressLines = [
    escapeHtml(shippingAddress.line1),
    shippingAddress.line2 ? escapeHtml(shippingAddress.line2) : null,
    `${escapeHtml(shippingAddress.postalCode)} ${escapeHtml(shippingAddress.city)}`,
    escapeHtml(shippingAddress.country),
  ]
    .filter(Boolean)
    .join('<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Order confirmation</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;color:#2c2825;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;border-bottom:2px solid #b87333;">
          <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:0.15em;color:#1a1714;">SUAVIUS ATELIER</div>
        </td></tr>
        <tr><td style="padding:32px 0 16px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:normal;color:#1a1714;">Thank you, ${escapeHtml(customerName || 'friend')}.</h1>
          <p style="margin:0 0 8px;line-height:1.6;">Your order has been received and is being prepared with care.</p>
          <p style="margin:0;color:#8c7b6b;font-size:14px;">Order #${escapeHtml(String(orderId))}</p>
        </td></tr>
        <tr><td style="padding:16px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${itemsRows}
            <tr>
              <td style="padding:16px 0 0;font-family:Georgia,serif;font-weight:bold;color:#1a1714;">Total</td>
              <td style="padding:16px 0 0;font-family:Georgia,serif;font-weight:bold;color:#1a1714;text-align:right;">${formatPrice(total, currency)}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 0 8px;border-top:1px solid #e8e0d0;">
          <div style="font-size:12px;letter-spacing:0.1em;color:#8c7b6b;text-transform:uppercase;margin-bottom:8px;">Shipping to</div>
          <div style="line-height:1.6;color:#2c2825;">${addressLines}</div>
        </td></tr>
        <tr><td style="padding:32px 0 0;border-top:1px solid #e8e0d0;text-align:center;color:#8c7b6b;font-size:13px;line-height:1.6;">
          We will email you again when your order ships.<br>
          Questions? Reply to this email or write to orders@suaviusatelier.com.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function renderAdminEmail(input: OrderConfirmationInput): string {
  const { orderId, customerEmail, customerName, items, total, currency } = input
  const itemList = items
    .map((it) => `- ${escapeHtml(it.title)} x ${it.quantity} (${formatPrice(it.priceAtPurchase * it.quantity, currency)})`)
    .join('<br>')

  return `<!DOCTYPE html>
<html><body style="font-family:monospace;font-size:14px;color:#1a1714;">
<p><strong>New order #${escapeHtml(String(orderId))}</strong></p>
<p>${escapeHtml(customerName)} &lt;${escapeHtml(customerEmail)}&gt;</p>
<p>${itemList}</p>
<p><strong>Total: ${formatPrice(total, currency)}</strong></p>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendOrderConfirmation(
  input: OrderConfirmationInput,
  adminEmail?: string,
): Promise<void> {
  const transport = getTransport()
  const from = `"${FROM_NAME}" <${process.env.SMTP_USER}>`

  await transport.sendMail({
    from,
    to: input.customerEmail,
    subject: `Your Suavius Atelier order #${input.orderId}`,
    html: renderCustomerEmail(input),
  })

  if (adminEmail && adminEmail !== input.customerEmail) {
    try {
      await transport.sendMail({
        from,
        to: adminEmail,
        subject: `[Suavius] New order #${input.orderId} - ${formatPrice(input.total, input.currency)}`,
        html: renderAdminEmail(input),
      })
    } catch (err) {
      console.error('[email] admin notification failed', err)
    }
  }
}
