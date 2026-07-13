import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_stock_movements_source" AS ENUM('store-order', 'etsy-order', 'manual', 'restock', 'seed');
  CREATE TABLE "stock_movements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sku" varchar NOT NULL,
  	"delta" numeric NOT NULL,
  	"new_stock" numeric,
  	"source" "enum_stock_movements_source" NOT NULL,
  	"external_ref" varchar,
  	"clamped" boolean DEFAULT false,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "etsy_listing_id" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_etsy_listing_id" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stock_movements_id" integer;
  CREATE INDEX "stock_movements_sku_idx" ON "stock_movements" USING btree ("sku");
  CREATE INDEX "stock_movements_source_idx" ON "stock_movements" USING btree ("source");
  CREATE INDEX "stock_movements_external_ref_idx" ON "stock_movements" USING btree ("external_ref");
  CREATE INDEX "stock_movements_updated_at_idx" ON "stock_movements" USING btree ("updated_at");
  CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_movements_fk" FOREIGN KEY ("stock_movements_id") REFERENCES "public"."stock_movements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_stock_movements_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_movements_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stock_movements" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "stock_movements" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stock_movements_fk";
  
  DROP INDEX "payload_locked_documents_rels_stock_movements_id_idx";
  ALTER TABLE "products" DROP COLUMN "etsy_listing_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_etsy_listing_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stock_movements_id";
  DROP TYPE "public"."enum_stock_movements_source";`)
}
