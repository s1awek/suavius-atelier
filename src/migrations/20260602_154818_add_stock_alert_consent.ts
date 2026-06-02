import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stock_alerts" ADD COLUMN "consented_at" timestamp(3) with time zone;
  ALTER TABLE "stock_alerts" ADD COLUMN "consent_text" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stock_alerts" DROP COLUMN "consented_at";
  ALTER TABLE "stock_alerts" DROP COLUMN "consent_text";`)
}
