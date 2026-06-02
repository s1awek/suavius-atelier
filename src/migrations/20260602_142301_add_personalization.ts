import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_personalization_options_file_config_allowed_types" AS ENUM('image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf');
  CREATE TYPE "public"."enum_personalization_options_input_type" AS ENUM('text', 'textarea', 'choice', 'color', 'file');
  CREATE TYPE "public"."enum_personalization_options_method" AS ENUM('engraving', 'printing', 'special-order', 'other');
  CREATE TYPE "public"."enum_personalization_options_presentation" AS ENUM('dropdown', 'radio', 'swatch');
  CREATE TYPE "public"."enum_personalization_uploads_scan_status" AS ENUM('skipped', 'pending', 'clean', 'flagged');
  CREATE TABLE "products_personalizations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option_id" integer,
  	"required" boolean,
  	"price_modifier_override" numeric
  );
  
  CREATE TABLE "_products_v_version_personalizations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"option_id" integer,
  	"required" boolean,
  	"price_modifier_override" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "orders_items_personalizations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option_label" varchar,
  	"input_type" varchar,
  	"value" varchar,
  	"choice_label" varchar,
  	"price_modifier" numeric DEFAULT 0,
  	"file_id" integer
  );
  
  CREATE TABLE "personalization_options_choices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"price_modifier" numeric DEFAULT 0
  );
  
  CREATE TABLE "personalization_options_file_config_allowed_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_personalization_options_file_config_allowed_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "personalization_options" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"input_type" "enum_personalization_options_input_type" DEFAULT 'text' NOT NULL,
  	"help_text" varchar,
  	"method" "enum_personalization_options_method" DEFAULT 'other',
  	"max_chars" numeric,
  	"presentation" "enum_personalization_options_presentation" DEFAULT 'dropdown',
  	"price_modifier" numeric DEFAULT 0,
  	"file_config_max_size_m_b" numeric DEFAULT 10,
  	"file_config_upload_instructions" varchar,
  	"default_required" boolean DEFAULT false,
  	"quote_only" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "personalization_uploads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"original_name" varchar,
  	"related_product_id" integer,
  	"checksum" varchar,
  	"sanitized" boolean DEFAULT false,
  	"scan_status" "enum_personalization_uploads_scan_status" DEFAULT 'skipped',
  	"prefix" varchar DEFAULT 'personalization-uploads',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "personalization_options_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "personalization_uploads_id" integer;
  ALTER TABLE "products_personalizations" ADD CONSTRAINT "products_personalizations_option_id_personalization_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."personalization_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_personalizations" ADD CONSTRAINT "products_personalizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_personalizations" ADD CONSTRAINT "_products_v_version_personalizations_option_id_personalization_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."personalization_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_personalizations" ADD CONSTRAINT "_products_v_version_personalizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items_personalizations" ADD CONSTRAINT "orders_items_personalizations_file_id_personalization_uploads_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."personalization_uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items_personalizations" ADD CONSTRAINT "orders_items_personalizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "personalization_options_choices" ADD CONSTRAINT "personalization_options_choices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."personalization_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "personalization_options_file_config_allowed_types" ADD CONSTRAINT "personalization_options_file_config_allowed_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."personalization_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "personalization_uploads" ADD CONSTRAINT "personalization_uploads_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_personalizations_order_idx" ON "products_personalizations" USING btree ("_order");
  CREATE INDEX "products_personalizations_parent_id_idx" ON "products_personalizations" USING btree ("_parent_id");
  CREATE INDEX "products_personalizations_option_idx" ON "products_personalizations" USING btree ("option_id");
  CREATE INDEX "_products_v_version_personalizations_order_idx" ON "_products_v_version_personalizations" USING btree ("_order");
  CREATE INDEX "_products_v_version_personalizations_parent_id_idx" ON "_products_v_version_personalizations" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_personalizations_option_idx" ON "_products_v_version_personalizations" USING btree ("option_id");
  CREATE INDEX "orders_items_personalizations_order_idx" ON "orders_items_personalizations" USING btree ("_order");
  CREATE INDEX "orders_items_personalizations_parent_id_idx" ON "orders_items_personalizations" USING btree ("_parent_id");
  CREATE INDEX "orders_items_personalizations_file_idx" ON "orders_items_personalizations" USING btree ("file_id");
  CREATE INDEX "personalization_options_choices_order_idx" ON "personalization_options_choices" USING btree ("_order");
  CREATE INDEX "personalization_options_choices_parent_id_idx" ON "personalization_options_choices" USING btree ("_parent_id");
  CREATE INDEX "personalization_options_file_config_allowed_types_order_idx" ON "personalization_options_file_config_allowed_types" USING btree ("order");
  CREATE INDEX "personalization_options_file_config_allowed_types_parent_idx" ON "personalization_options_file_config_allowed_types" USING btree ("parent_id");
  CREATE INDEX "personalization_options_updated_at_idx" ON "personalization_options" USING btree ("updated_at");
  CREATE INDEX "personalization_options_created_at_idx" ON "personalization_options" USING btree ("created_at");
  CREATE INDEX "personalization_uploads_related_product_idx" ON "personalization_uploads" USING btree ("related_product_id");
  CREATE INDEX "personalization_uploads_checksum_idx" ON "personalization_uploads" USING btree ("checksum");
  CREATE INDEX "personalization_uploads_updated_at_idx" ON "personalization_uploads" USING btree ("updated_at");
  CREATE INDEX "personalization_uploads_created_at_idx" ON "personalization_uploads" USING btree ("created_at");
  CREATE UNIQUE INDEX "personalization_uploads_filename_idx" ON "personalization_uploads" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_personalization_options_fk" FOREIGN KEY ("personalization_options_id") REFERENCES "public"."personalization_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_personalization_uploads_fk" FOREIGN KEY ("personalization_uploads_id") REFERENCES "public"."personalization_uploads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_personalization_options_id_idx" ON "payload_locked_documents_rels" USING btree ("personalization_options_id");
  CREATE INDEX "payload_locked_documents_rels_personalization_uploads_id_idx" ON "payload_locked_documents_rels" USING btree ("personalization_uploads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_personalizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_personalizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items_personalizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personalization_options_choices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personalization_options_file_config_allowed_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personalization_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "personalization_uploads" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_personalizations" CASCADE;
  DROP TABLE "_products_v_version_personalizations" CASCADE;
  DROP TABLE "orders_items_personalizations" CASCADE;
  DROP TABLE "personalization_options_choices" CASCADE;
  DROP TABLE "personalization_options_file_config_allowed_types" CASCADE;
  DROP TABLE "personalization_options" CASCADE;
  DROP TABLE "personalization_uploads" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_personalization_options_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_personalization_uploads_fk";
  
  DROP INDEX "payload_locked_documents_rels_personalization_options_id_idx";
  DROP INDEX "payload_locked_documents_rels_personalization_uploads_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "personalization_options_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "personalization_uploads_id";
  DROP TYPE "public"."enum_personalization_options_file_config_allowed_types";
  DROP TYPE "public"."enum_personalization_options_input_type";
  DROP TYPE "public"."enum_personalization_options_method";
  DROP TYPE "public"."enum_personalization_options_presentation";
  DROP TYPE "public"."enum_personalization_uploads_scan_status";`)
}
