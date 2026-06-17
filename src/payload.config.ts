import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { ContactMessages } from './collections/ContactMessages'
import { StockAlerts } from './collections/StockAlerts'
import { SearchEvents } from './collections/SearchEvents'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Collections as DesignCollections } from './collections/Collections'
import { Redirects } from './collections/Redirects'
import { PersonalizationOptions } from './collections/PersonalizationOptions'
import {
  PersonalizationUploads,
  PERSONALIZATION_UPLOADS_PREFIX,
} from './collections/PersonalizationUploads'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Products, Orders, Pages, ContactMessages, StockAlerts, SearchEvents, NewsletterSubscribers, DesignCollections, Redirects, PersonalizationOptions, PersonalizationUploads],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  // Payload's own emails (admin password reset, verification) go through SMTP.
  // skipVerify + a pre-built (lazy) transport means no SMTP connection at boot/build,
  // so this never hangs or fails the Vercel build; mail is sent only when triggered.
  email: nodemailerAdapter({
    defaultFromName: 'Suavius Atelier',
    defaultFromAddress: process.env.SMTP_USER || 'orders@suaviusatelier.com',
    skipVerify: true,
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    }),
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
        'personalization-uploads': {
          prefix: PERSONALIZATION_UPLOADS_PREFIX,
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
      },
    }),
  ],
})
