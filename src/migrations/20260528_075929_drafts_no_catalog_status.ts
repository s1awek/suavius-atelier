import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__products_v_version_material" AS ENUM('pcb', 'wood', 'other');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_collections_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__collections_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_products_v_version_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"sku" varchar,
  	"stock" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" jsonb,
  	"version_category_id" integer,
  	"version_price" numeric,
  	"version_compare_at_price" numeric,
  	"version_material" "enum__products_v_version_material",
  	"version_is_new" boolean DEFAULT false,
  	"version_is_bestseller" boolean DEFAULT false,
  	"version_weight_grams" numeric,
  	"version_dimensions_width_mm" numeric,
  	"version_dimensions_height_mm" numeric,
  	"version_dimensions_depth_mm" numeric,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_content" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_collections_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_subtitle" varchar,
  	"version_tagline" varchar,
  	"version_description" jsonb,
  	"version_hero_image_id" integer,
  	"version_order" numeric DEFAULT 100,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__collections_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_collections_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  ALTER TABLE "products" ALTER COLUMN "_status" SET DATA TYPE text;
  ALTER TABLE "products" ALTER COLUMN "_status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_products_status";
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  ALTER TABLE "products" ALTER COLUMN "_status" SET DEFAULT 'draft'::"public"."enum_products_status";
  ALTER TABLE "products" ALTER COLUMN "_status" SET DATA TYPE "public"."enum_products_status" USING "_status"::"public"."enum_products_status";
  ALTER TABLE "products_images" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "products_variants" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "products_variants" ALTER COLUMN "sku" DROP NOT NULL;
  ALTER TABLE "products_variants" ALTER COLUMN "stock" DROP NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "material" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "collections" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "collections" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "products" ADD COLUMN "_status" "enum_products_status" DEFAULT 'draft';
  ALTER TABLE "pages" ADD COLUMN "_status" "enum_pages_status" DEFAULT 'draft';
  ALTER TABLE "collections" ADD COLUMN "_status" "enum_collections_status" DEFAULT 'draft';
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_variants" ADD CONSTRAINT "_products_v_version_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_collections_v" ADD CONSTRAINT "_collections_v_parent_id_collections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_collections_v" ADD CONSTRAINT "_collections_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_collections_v_rels" ADD CONSTRAINT "_collections_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_collections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_collections_v_rels" ADD CONSTRAINT "_collections_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_products_v_version_images_order_idx" ON "_products_v_version_images" USING btree ("_order");
  CREATE INDEX "_products_v_version_images_parent_id_idx" ON "_products_v_version_images" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_images_image_idx" ON "_products_v_version_images" USING btree ("image_id");
  CREATE INDEX "_products_v_version_variants_order_idx" ON "_products_v_version_variants" USING btree ("_order");
  CREATE INDEX "_products_v_version_variants_parent_id_idx" ON "_products_v_version_variants" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_variants_sku_idx" ON "_products_v_version_variants" USING btree ("sku");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_category_idx" ON "_products_v" USING btree ("version_category_id");
  CREATE INDEX "_products_v_version_version_seo_image_idx" ON "_products_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_collections_v_parent_idx" ON "_collections_v" USING btree ("parent_id");
  CREATE INDEX "_collections_v_version_version_slug_idx" ON "_collections_v" USING btree ("version_slug");
  CREATE INDEX "_collections_v_version_version_hero_image_idx" ON "_collections_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_collections_v_version_version_updated_at_idx" ON "_collections_v" USING btree ("version_updated_at");
  CREATE INDEX "_collections_v_version_version_created_at_idx" ON "_collections_v" USING btree ("version_created_at");
  CREATE INDEX "_collections_v_version_version__status_idx" ON "_collections_v" USING btree ("version__status");
  CREATE INDEX "_collections_v_created_at_idx" ON "_collections_v" USING btree ("created_at");
  CREATE INDEX "_collections_v_updated_at_idx" ON "_collections_v" USING btree ("updated_at");
  CREATE INDEX "_collections_v_latest_idx" ON "_collections_v" USING btree ("latest");
  CREATE INDEX "_collections_v_rels_order_idx" ON "_collections_v_rels" USING btree ("order");
  CREATE INDEX "_collections_v_rels_parent_idx" ON "_collections_v_rels" USING btree ("parent_id");
  CREATE INDEX "_collections_v_rels_path_idx" ON "_collections_v_rels" USING btree ("path");
  CREATE INDEX "_collections_v_rels_products_id_idx" ON "_collections_v_rels" USING btree ("products_id");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "collections__status_idx" ON "collections" USING btree ("_status");
  ALTER TABLE "products" DROP COLUMN "status";`)

  // Existing rows were live before drafts were introduced; keep them visible by
  // marking everything as published. Without this, ADD COLUMN _status DEFAULT 'draft'
  // would hide every previously-public product/page/collection on the frontend.
  await db.execute(sql`
    UPDATE "products" SET "_status" = 'published';
    UPDATE "pages" SET "_status" = 'published';
    UPDATE "collections" SET "_status" = 'published';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_products_v_version_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_collections_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_collections_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_products_v_version_images" CASCADE;
  DROP TABLE "_products_v_version_variants" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_collections_v" CASCADE;
  DROP TABLE "_collections_v_rels" CASCADE;
  ALTER TABLE "products" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_products_status";
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'active', 'archived');
  ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_products_status";
  ALTER TABLE "products" ALTER COLUMN "status" SET DATA TYPE "public"."enum_products_status" USING "status"::"public"."enum_products_status";
  DROP INDEX "products__status_idx";
  DROP INDEX "pages__status_idx";
  DROP INDEX "collections__status_idx";
  ALTER TABLE "products_images" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "products_variants" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "products_variants" ALTER COLUMN "sku" SET NOT NULL;
  ALTER TABLE "products_variants" ALTER COLUMN "stock" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "price" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "material" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "collections" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "collections" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "products" ADD COLUMN "status" "enum_products_status" DEFAULT 'draft' NOT NULL;
  ALTER TABLE "products" DROP COLUMN "_status";
  ALTER TABLE "pages" DROP COLUMN "_status";
  ALTER TABLE "collections" DROP COLUMN "_status";
  DROP TYPE "public"."enum__products_v_version_material";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_collections_status";
  DROP TYPE "public"."enum__collections_v_version_status";`)
}
