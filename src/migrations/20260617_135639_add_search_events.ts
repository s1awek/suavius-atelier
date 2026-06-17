import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "search_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"result_count" numeric DEFAULT 0,
  	"zero_results" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_events_id" integer;
  CREATE INDEX "search_events_q_idx" ON "search_events" USING btree ("q");
  CREATE INDEX "search_events_zero_results_idx" ON "search_events" USING btree ("zero_results");
  CREATE INDEX "search_events_updated_at_idx" ON "search_events" USING btree ("updated_at");
  CREATE INDEX "search_events_created_at_idx" ON "search_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_events_fk" FOREIGN KEY ("search_events_id") REFERENCES "public"."search_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_search_events_id_idx" ON "payload_locked_documents_rels" USING btree ("search_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "search_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_search_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_events_id";`)
}
