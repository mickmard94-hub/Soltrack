CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_expiration_index" on "cache"("expiration");
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_locks_expiration_index" on "cache_locks"("expiration");
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" varchar not null,
  "queue" varchar not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE INDEX "failed_jobs_connection_queue_failed_at_index" on "failed_jobs"(
  "connection",
  "queue",
  "failed_at"
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "membres"(
  "id" integer primary key autoincrement not null,
  "sol_id" integer not null,
  "nom" varchar not null,
  "telephone" varchar,
  "ordre_reception" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("sol_id") references "sols"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "tours"(
  "id" integer primary key autoincrement not null,
  "sol_id" integer not null,
  "numero_tour" integer not null,
  "membre_beneficiaire_id" integer not null,
  "date_prevue" date not null,
  "date_versement" date,
  "statut" varchar check("statut" in('a_venir', 'verse')) not null default 'a_venir',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("sol_id") references "sols"("id") on delete cascade,
  foreign key("membre_beneficiaire_id") references "membres"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "cotisations"(
  "id" integer primary key autoincrement not null,
  "sol_id" integer not null,
  "membre_id" integer not null,
  "tour_numero" integer not null,
  "montant" numeric not null,
  "date_paiement" date not null,
  "statut" varchar check("statut" in('paye', 'en_retard')) not null default 'paye',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("sol_id") references "sols"("id") on delete cascade,
  foreign key("membre_id") references "membres"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "personal_access_tokens"(
  "id" integer primary key autoincrement not null,
  "tokenable_type" varchar not null,
  "tokenable_id" integer not null,
  "name" text not null,
  "token" varchar not null,
  "abilities" text,
  "last_used_at" datetime,
  "expires_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" on "personal_access_tokens"(
  "tokenable_type",
  "tokenable_id"
);
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" on "personal_access_tokens"(
  "token"
);
CREATE INDEX "personal_access_tokens_expires_at_index" on "personal_access_tokens"(
  "expires_at"
);
CREATE TABLE IF NOT EXISTS "sols"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "montant_cotisation" numeric not null,
  "frequence" varchar not null,
  "nombre_tours" integer not null,
  "date_debut" date not null,
  "statut" varchar not null default('actif'),
  "created_at" datetime,
  "updated_at" datetime,
  "user_id" integer not null,
  foreign key("user_id") references "users"("id") on delete cascade
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2026_07_07_030550_create_sols_table',1);
INSERT INTO migrations VALUES(5,'2026_07_07_032206_create_membres_table',1);
INSERT INTO migrations VALUES(6,'2026_07_07_032938_create_tours_table',1);
INSERT INTO migrations VALUES(7,'2026_07_07_033821_create_cotisations_table',1);
INSERT INTO migrations VALUES(8,'2026_07_07_045242_create_personal_access_tokens_table',1);
INSERT INTO migrations VALUES(9,'2026_07_07_163004_add_user_id_to_sols_table',1);
INSERT INTO migrations VALUES(10,'2026_07_08_080547_add_performance_indexes',1);
