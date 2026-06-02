import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ALTER COLUMN "stripe_payment_intent_id" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_email" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_name" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_line1" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_city" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_postal_code" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_country" DROP NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "stripe_checkout_session_id" varchar;
  CREATE UNIQUE INDEX "orders_stripe_checkout_session_id_idx" ON "orders" USING btree ("stripe_checkout_session_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_stripe_checkout_session_id_idx";
  ALTER TABLE "orders" ALTER COLUMN "stripe_payment_intent_id" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_email" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_name" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_line1" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_city" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_postal_code" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "customer_address_country" SET NOT NULL;
  ALTER TABLE "orders" DROP COLUMN "stripe_checkout_session_id";`)
}
