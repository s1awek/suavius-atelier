import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Category, Media, Page, Product } from '../payload-types.js'

type CategorySeed = {
  slug: string
  title: string
  description: string
}

type ProductSeed = {
  slug: string
  title: string
  categorySlug: string
  material: 'pcb' | 'wood' | 'other'
  price: number
  compareAtPrice?: number
  description: string
  imageSeed: string
  weightGrams: number
  dimensions: { widthMm: number; heightMm: number; depthMm: number }
  stock?: number
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'pcb-coasters',
    title: 'PCB Coasters',
    description:
      'FR4 fiberglass coasters with ENIG copper-gold finish and UV silkscreen designs.',
  },
  {
    slug: 'wood-pieces',
    title: 'Wood Pieces',
    description: 'Laser-engraved hardwood coasters, trivets, and small accessories.',
  },
]

const PRODUCTS: ProductSeed[] = [
  {
    slug: 'copper-circuit-coaster',
    title: 'Copper Circuit Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 2900,
    compareAtPrice: 3500,
    description:
      'A FR4 PCB coaster with golden ENIG plating and a circuit-trace pattern. ' +
      'Heat-resistant, waterproof, and quietly beautiful under good light.',
    imageSeed: 'copper-circuit',
    weightGrams: 38,
    dimensions: { widthMm: 95, heightMm: 95, depthMm: 1.6 },
  },
  {
    slug: 'constellation-pcb-coaster',
    title: 'Constellation PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 3200,
    description:
      'Star map etched on dark blue FR4 with brushed copper points. Each coaster ' +
      'maps a real constellation from the northern sky.',
    imageSeed: 'constellation',
    weightGrams: 38,
    dimensions: { widthMm: 95, heightMm: 95, depthMm: 1.6 },
  },
  {
    slug: 'walnut-grove-trivet',
    title: 'Walnut Grove Trivet',
    categorySlug: 'wood-pieces',
    material: 'wood',
    price: 4900,
    description:
      'Solid walnut trivet, laser-engraved with a topographic grove pattern. ' +
      'Finished with food-safe linseed oil.',
    imageSeed: 'walnut-grove',
    weightGrams: 180,
    dimensions: { widthMm: 180, heightMm: 180, depthMm: 12 },
  },
]

export type ContentBlock = { type: 'h2' | 'p'; text: string }

type PageSeed = {
  slug: string
  title: string
  seoTitle?: string
  seoDescription?: string
  blocks: ContentBlock[]
}

export const PAGES: PageSeed[] = [
  {
    slug: 'about',
    title: 'About',
    seoDescription:
      'Suavius Atelier - hand-designed PCB coasters and laser-engraved wood accessories, made in small batches.',
    blocks: [
      { type: 'p', text: 'Suavius Atelier is a small studio making objects at the intersection of electronics manufacturing and traditional craft. Every piece is designed in-house and produced in small batches.' },
      { type: 'h2', text: 'Materials' },
      { type: 'p', text: 'Our PCB coasters are manufactured on FR4 fiberglass substrate with ENIG (Electroless Nickel Immersion Gold) finish - the same process used for high-reliability electronics. The result is a piece that is heat-resistant, waterproof, and ages beautifully.' },
      { type: 'p', text: 'Our wood pieces are cut from European hardwoods and finished with food-safe linseed oil. Patterns are burned with a CO2 laser - no inks, no varnishes that flake.' },
      { type: 'h2', text: 'Where things are made' },
      { type: 'p', text: 'Design, prototyping, and finishing happen in our studio in Poland. PCB fabrication is done by partner factories in Shenzhen and assembled here. Wood is cut, engraved, and finished entirely in-house.' },
    ],
  },
  {
    slug: 'shipping-returns',
    title: 'Shipping & Returns',
    seoDescription: 'Worldwide shipping from Poland. 14-day returns on unused items.',
    blocks: [
      { type: 'h2', text: 'Shipping' },
      { type: 'p', text: 'We ship from Poland. Ready, in-stock pieces are dispatched within 2-3 business days and typically arrive in 3-7 working days within the EU, or 7-14 working days worldwide depending on destination.' },
      { type: 'p', text: 'Made-to-order and personalized pieces take considerably longer than 2-3 days, because each is made by hand for your order. How long depends on the type of customization and other factors we cannot always predict in advance. We will keep you updated on your order, and you are always welcome to email us for an estimate before you buy.' },
      { type: 'p', text: 'Shipping costs are calculated at checkout based on destination and weight.' },
      { type: 'h2', text: 'Returns' },
      { type: 'p', text: 'You may return any unused item within 14 days of delivery for a full refund (excluding original shipping). Items must be in their original condition and packaging.' },
      { type: 'p', text: 'To start a return, email orders@suaviusatelier.com with your order number. Return shipping is at your expense unless the item arrived damaged.' },
      { type: 'h2', text: 'Damaged or lost shipments' },
      { type: 'p', text: 'If your order arrives damaged or never arrives, contact us within 30 days and we will replace it or refund in full.' },
    ],
  },
  {
    slug: 'faq',
    title: 'FAQ',
    seoDescription: 'Common questions about Suavius Atelier products, materials, and shipping.',
    blocks: [
      { type: 'h2', text: 'Are PCB coasters food-safe?' },
      { type: 'p', text: 'The ENIG finish is inert and food-contact safe. We still recommend treating them as you would any tableware - wash with mild soap, dry promptly.' },
      { type: 'h2', text: 'How heat-resistant are the PCB coasters?' },
      { type: 'p', text: 'FR4 is rated up to around 130°C continuous. A hot mug of coffee or tea is well within that range.' },
      { type: 'h2', text: 'Do you offer custom designs?' },
      { type: 'p', text: 'Yes, for batches of 25 or more. Email orders@suaviusatelier.com with your idea.' },
      { type: 'h2', text: 'What if I receive a damaged item?' },
      { type: 'p', text: 'Contact us within 30 days of delivery and we will replace it or refund in full. See our Shipping & Returns page for details.' },
      { type: 'h2', text: 'Do you ship outside the EU?' },
      { type: 'p', text: 'Yes, worldwide. Local taxes and duties may apply on arrival and are the buyer responsibility.' },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    seoDescription: 'Get in touch with Suavius Atelier.',
    blocks: [
      { type: 'p', text: 'For orders, returns, and general questions, email orders@suaviusatelier.com. We typically reply within one business day.' },
      { type: 'p', text: 'For custom design inquiries, wholesale, or press, write to the same address with a short note about what you are looking for.' },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    seoDescription: 'Terms and conditions of sale at Suavius Atelier.',
    blocks: [
      { type: 'p', text: 'This is a working draft of our Terms and Conditions. They are reviewed by legal counsel before the shop opens for live orders. If anything here is unclear, please email orders@suaviusatelier.com.' },
      { type: 'h2', text: 'Who we are' },
      { type: 'p', text: 'Suavius Atelier is a trade name of Wellmade Sławomir Kasprzak, a sole proprietorship registered in Poland (NIP and REGON available on request). Our registered correspondence address is in Bielawa, Poland. All contracts of sale are governed by Polish law.' },
      { type: 'h2', text: 'Ordering and payment' },
      { type: 'p', text: 'By placing an order through this website you are making an offer to purchase the products described. The contract of sale is formed when we confirm your order by email after successful payment.' },
      { type: 'p', text: 'All prices are shown in euro (EUR) and include applicable VAT unless stated otherwise. Payment is processed by Stripe Payments Europe Limited. We do not store your full card details.' },
      { type: 'h2', text: 'Shipping' },
      { type: 'p', text: 'We ship worldwide from Poland. Shipping costs and estimated delivery times are shown at checkout. See our Shipping & Returns page for full details.' },
      { type: 'h2', text: 'Right of withdrawal' },
      { type: 'p', text: 'If you are a consumer based in the European Union, you have the right to withdraw from the contract within 14 days of receiving the goods, without giving any reason. The withdrawal period expires 14 days from the day you (or a third party other than the carrier indicated by you) acquire physical possession of the last item of the order.' },
      { type: 'p', text: 'To exercise the right of withdrawal, you must inform us of your decision by an unequivocal statement (an email to orders@suaviusatelier.com is sufficient). You shall send back the goods without undue delay and in any event not later than 14 days from the day on which you communicate your withdrawal. The direct cost of returning the goods is borne by you, unless the goods were faulty.' },
      { type: 'p', text: 'We will reimburse the full amount paid (including original outbound shipping where applicable) within 14 days of receiving the returned goods, using the same means of payment that you used for the initial transaction.' },
      { type: 'h2', text: 'Complaints and warranty' },
      { type: 'p', text: 'Goods sold by Suavius Atelier are covered by statutory warranty rights under Polish and EU consumer law. If your item arrives damaged, defective, or not as described, please contact us within 30 days of delivery. We will replace, repair, or refund as appropriate.' },
      { type: 'h2', text: 'Limitation of liability' },
      { type: 'p', text: 'Our liability for any claim arising out of a contract of sale is limited to the amount paid for the goods, except where liability cannot be limited under applicable law (for example, in cases of death, personal injury, or gross negligence).' },
      { type: 'h2', text: 'Disputes and applicable law' },
      { type: 'p', text: 'These terms are governed by Polish law. Disputes arising from a contract of sale shall be resolved by the courts having jurisdiction over the seller, except where mandatory consumer protection rules grant the consumer the right to bring proceedings in their country of residence. Consumers in the EU may also use the European Online Dispute Resolution platform at ec.europa.eu/consumers/odr.' },
      { type: 'h2', text: 'Changes to these terms' },
      { type: 'p', text: 'We may update these terms from time to time. The version effective at the moment you place your order applies to that order.' },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    seoDescription: 'How Suavius Atelier collects, uses, and protects your personal data.',
    blocks: [
      { type: 'p', text: 'This privacy policy explains what personal data we collect when you visit or buy from suaviusatelier.com, how we use it, and what rights you have. We follow the EU General Data Protection Regulation (GDPR) and Polish data protection law.' },
      { type: 'h2', text: 'Data controller' },
      { type: 'p', text: 'The data controller is Wellmade Sławomir Kasprzak, with correspondence address in Bielawa, Poland. You can reach us for any privacy matter at orders@suaviusatelier.com.' },
      { type: 'h2', text: 'What we collect' },
      { type: 'p', text: 'When you place an order, we collect your name, email address, shipping address, and phone number. Payment details (card number, expiry, CVC) are entered directly with Stripe and never reach our servers. We store a reference to the Stripe payment intent so we can match your order to the payment.' },
      { type: 'p', text: 'We use Vercel Web Analytics and Speed Insights, a privacy-friendly, cookieless analytics service that measures aggregate traffic and page performance. It does not set cookies, does not collect personal data, and does not track you across other websites or build advertising profiles. We use no other analytics, advertising, or behavioural tracking tools. You can switch analytics off at any time using the "Disable analytics" control in the site footer, and we automatically honour your browser\'s Global Privacy Control signal.' },
      { type: 'h2', text: 'Legal basis and purpose' },
      { type: 'p', text: 'We process your data on the following legal bases: (a) performance of the contract of sale (Art. 6(1)(b) GDPR), in order to dispatch the goods, send order confirmations, and handle returns or complaints; (b) compliance with legal obligations (Art. 6(1)(c) GDPR), in particular bookkeeping and tax retention rules.' },
      { type: 'h2', text: 'Retention' },
      { type: 'p', text: 'Order records are kept for the period required by Polish tax law (currently five years from the end of the calendar year in which the tax liability arose, typically meaning seven calendar years for safety). After that period, we anonymise or delete order data.' },
      { type: 'h2', text: 'Sharing' },
      { type: 'p', text: 'We share the minimum personal data necessary with the following service providers, each of which acts as our processor or controller in their own right:' },
      { type: 'p', text: 'Stripe Payments Europe Limited (payment processing). Vercel Inc. (website hosting and content delivery). Neon Database Inc. (database hosting in EU region). Cloudflare Inc. (DNS and image delivery). SEOhost.pl (email delivery). Shipping carriers selected for your order (carrier name will be visible in your shipment notification). InFakt (accounting and invoicing system used for tax compliance).' },
      { type: 'h2', text: 'Your rights' },
      { type: 'p', text: 'Under the GDPR you have the right to: access your data, correct inaccurate data, request deletion (right to be forgotten), restrict or object to processing, request portability, and withdraw consent. To exercise any of these rights, email orders@suaviusatelier.com. We will respond within one month.' },
      { type: 'p', text: 'You also have the right to lodge a complaint with the Polish supervisory authority, the President of the Personal Data Protection Office (UODO, uodo.gov.pl).' },
      { type: 'h2', text: 'International transfers' },
      { type: 'p', text: 'Some of our processors (notably Stripe, Vercel, Cloudflare) may transfer data outside the European Economic Area. In each case, transfers are governed by Standard Contractual Clauses approved by the European Commission or equivalent safeguards.' },
      { type: 'h2', text: 'Changes to this policy' },
      { type: 'p', text: 'We will update this policy when our practices change. The current version is always the one published on this page.' },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    seoDescription: 'How Suavius Atelier uses cookies and similar technologies.',
    blocks: [
      { type: 'p', text: 'We use a minimal set of cookies, only what is needed to make the shop work. Our analytics is cookieless, so we set no analytics, advertising, or behavioural tracking cookies.' },
      { type: 'h2', text: 'Essential cookies' },
      { type: 'p', text: 'A small set of essential cookies and localStorage entries are required to operate the shop: they remember what is in your cart between page loads and let our payment provider keep a secure session with you during checkout. These cannot be disabled without breaking core shop features.' },
      { type: 'h2', text: 'Third-party cookies' },
      { type: 'p', text: 'When you proceed to checkout, you are redirected to Stripe, which sets its own cookies to detect fraud and keep your session secure. Stripe is a separate data controller for those cookies. See Stripe Privacy Center at stripe.com/privacy for details.' },
      { type: 'h2', text: 'Analytics and tracking' },
      { type: 'p', text: 'We use Vercel Web Analytics and Speed Insights to measure aggregate traffic and page performance. This service is cookieless and privacy-friendly: it sets no cookies, collects no personal data, and does not track you across other websites. We do not use Google Analytics, Facebook Pixel, or any advertising or behavioural-profiling tools. You can switch analytics off at any time using the "Disable analytics" control in the site footer, and we automatically honour your browser\'s Global Privacy Control signal.' },
      { type: 'h2', text: 'How to disable cookies' },
      { type: 'p', text: 'You can block or delete cookies in your browser settings. Disabling essential cookies will prevent the shopping cart and checkout from working. See the help pages of your browser for instructions.' },
      { type: 'h2', text: 'Contact' },
      { type: 'p', text: 'Questions about cookies or our privacy practices: orders@suaviusatelier.com.' },
    ],
  },
]

function richTextDoc(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          version: 1,
          format: '' as const,
          indent: 0,
          direction: 'ltr' as const,
          children: [
            {
              type: 'text',
              version: 1,
              text,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
            },
          ],
        },
      ],
    },
  }
}

export function richTextFromBlocks(blocks: ContentBlock[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: blocks.map((b) => {
        const textNode = {
          type: 'text',
          version: 1,
          text: b.text,
          format: 0,
          detail: 0,
          mode: 'normal',
          style: '',
        }
        if (b.type === 'h2') {
          return {
            type: 'heading',
            tag: 'h2',
            version: 1,
            format: '' as const,
            indent: 0,
            direction: 'ltr' as const,
            children: [textNode],
          }
        }
        return {
          type: 'paragraph',
          version: 1,
          format: '' as const,
          indent: 0,
          direction: 'ltr' as const,
          children: [textNode],
        }
      }),
    },
  }
}

async function fetchPlaceholderImage(seed: string): Promise<Buffer> {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/1200`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch placeholder for "${seed}": ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function findBySlug<T extends { slug?: string | null }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'categories' | 'products' | 'pages',
  slug: string,
): Promise<T | null> {
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return (res.docs[0] as unknown as T | undefined) ?? null
}

async function run() {
  const resolved = await config
  const payload = await getPayload({ config: resolved })

  payload.logger.info('Seeding categories...')
  const categoryByslug = new Map<string, Category>()
  for (const c of CATEGORIES) {
    const existing = await findBySlug<Category>(payload, 'categories', c.slug)
    if (existing) {
      payload.logger.info(`  - exists: ${c.slug}`)
      categoryByslug.set(c.slug, existing)
      continue
    }
    const created = await payload.create({
      collection: 'categories',
      data: { title: c.title, slug: c.slug, description: c.description },
    })
    payload.logger.info(`  + created: ${c.slug}`)
    categoryByslug.set(c.slug, created)
  }

  payload.logger.info('Seeding products + media...')
  for (const p of PRODUCTS) {
    const existing = await findBySlug<Product>(payload, 'products', p.slug)
    if (existing) {
      payload.logger.info(`  - exists: ${p.slug}`)
      continue
    }

    const category = categoryByslug.get(p.categorySlug)
    if (!category) throw new Error(`Missing category ${p.categorySlug}`)

    const buffer = await fetchPlaceholderImage(p.imageSeed)
    const media = (await payload.create({
      collection: 'media',
      data: { alt: `${p.title} photograph` },
      file: {
        data: buffer,
        mimetype: 'image/jpeg',
        name: `${p.slug}.jpg`,
        size: buffer.byteLength,
      },
    })) as Media

    await payload.create({
      collection: 'products',
      data: {
        title: p.title,
        slug: p.slug,
        category: category.id,
        material: p.material,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        description: richTextDoc(p.description),
        images: [{ image: media.id }],
        _status: 'published',
        weightGrams: p.weightGrams,
        dimensions: p.dimensions,
        variants: [
          { name: 'Standard', sku: `${p.slug}-standard`, stock: p.stock ?? 10 },
        ],
      },
    })
    payload.logger.info(`  + created: ${p.slug}`)
  }

  payload.logger.info('Seeding shipping zones (if missing)...')
  const settings = await payload.findGlobal({ slug: 'settings' })
  const zones = (settings as { shippingZones?: unknown[] }).shippingZones
  if (!Array.isArray(zones) || zones.length === 0) {
    await payload.updateGlobal({
      slug: 'settings',
      data: {
        shippingZones: [
          { name: 'Poland', countries: 'PL', flatRate: 1500 },
          { name: 'European Union', countries: 'DE,FR,ES,IT,NL,BE,AT,CZ,SK', flatRate: 2200 },
          { name: 'United Kingdom', countries: 'GB', flatRate: 2800 },
          { name: 'United States', countries: 'US', flatRate: 3500 },
        ],
      },
    })
    payload.logger.info('  + seeded 4 default zones')
  } else {
    payload.logger.info(`  - exists: ${zones.length} zones`)
  }

  payload.logger.info('Seeding pages...')
  for (const pg of PAGES) {
    const existing = await findBySlug<Page>(payload, 'pages', pg.slug)
    if (existing) {
      payload.logger.info(`  - exists: ${pg.slug}`)
      continue
    }
    await payload.create({
      collection: 'pages',
      data: {
        title: pg.title,
        slug: pg.slug,
        seoTitle: pg.seoTitle,
        seoDescription: pg.seoDescription,
        content: richTextFromBlocks(pg.blocks),
        _status: 'published',
      },
    })
    payload.logger.info(`  + created: ${pg.slug}`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

// Only run the full seed when this file is executed directly, not when another
// module imports PAGES / richTextFromBlocks from it (e.g. scripts/update-legal-pages.ts).
const isMain =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  run().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
