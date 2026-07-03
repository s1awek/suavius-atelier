import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_product_interest_topic" AS ENUM('gold-foil-personalization', 'other');
  CREATE TABLE "product_interest" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"product_slug" varchar,
  	"topic" "enum_product_interest_topic" DEFAULT 'gold-foil-personalization' NOT NULL,
  	"email" varchar NOT NULL,
  	"consented_at" timestamp(3) with time zone,
  	"consent_text" varchar,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "products" ADD COLUMN "video_poster_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_video_file_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_video_poster_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_interest_id" integer;
  ALTER TABLE "product_interest" ADD CONSTRAINT "product_interest_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "product_interest_product_idx" ON "product_interest" USING btree ("product_id");
  CREATE INDEX "product_interest_email_idx" ON "product_interest" USING btree ("email");
  CREATE INDEX "product_interest_updated_at_idx" ON "product_interest" USING btree ("updated_at");
  CREATE INDEX "product_interest_created_at_idx" ON "product_interest" USING btree ("created_at");
  ALTER TABLE "products" ADD CONSTRAINT "products_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_video_file_id_media_id_fk" FOREIGN KEY ("version_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_video_poster_id_media_id_fk" FOREIGN KEY ("version_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_interest_fk" FOREIGN KEY ("product_interest_id") REFERENCES "public"."product_interest"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_video_video_file_idx" ON "products" USING btree ("video_file_id");
  CREATE INDEX "products_video_video_poster_idx" ON "products" USING btree ("video_poster_id");
  CREATE INDEX "_products_v_version_video_version_video_file_idx" ON "_products_v" USING btree ("version_video_file_id");
  CREATE INDEX "_products_v_version_video_version_video_poster_idx" ON "_products_v" USING btree ("version_video_poster_id");
  CREATE INDEX "payload_locked_documents_rels_product_interest_id_idx" ON "payload_locked_documents_rels" USING btree ("product_interest_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_interest" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "product_interest" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_video_file_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_video_poster_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_video_file_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_video_poster_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_interest_fk";
  
  DROP INDEX "products_video_video_file_idx";
  DROP INDEX "products_video_video_poster_idx";
  DROP INDEX "_products_v_version_video_version_video_file_idx";
  DROP INDEX "_products_v_version_video_version_video_poster_idx";
  DROP INDEX "payload_locked_documents_rels_product_interest_id_idx";
  ALTER TABLE "products" DROP COLUMN "video_file_id";
  ALTER TABLE "products" DROP COLUMN "video_poster_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_video_file_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_video_poster_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "product_interest_id";
  DROP TYPE "public"."enum_product_interest_topic";`)
}
