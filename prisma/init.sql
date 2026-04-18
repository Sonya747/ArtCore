CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(50),
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_role_check" CHECK ("role" IN ('admin', 'member'))
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(50);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

CREATE TABLE IF NOT EXISTS "assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100),
    "type" VARCHAR(20),
    "description" TEXT,
    "preview_url" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "assets_type_check" CHECK ("type" IS NULL OR "type" IN ('character', 'weapon', 'scene', 'style', 'other')),
    CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "preview_url" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "created_by" UUID;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "assets" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "idx_assets_type" ON "assets"("type");
CREATE INDEX IF NOT EXISTS "idx_assets_created_at" ON "assets"("created_at");

CREATE TABLE IF NOT EXISTS "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_key" ON "tags"("name");

CREATE TABLE IF NOT EXISTS "asset_tag_mapping" (
    "asset_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "asset_tag_mapping_pkey" PRIMARY KEY ("asset_id", "tag_id"),
    CONSTRAINT "asset_tag_mapping_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asset_tag_mapping_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_asset_tag_mapping_tag_id" ON "asset_tag_mapping"("tag_id");

CREATE TABLE IF NOT EXISTS "generation_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "raw_prompt" TEXT NOT NULL,
    "final_prompt" TEXT,
    "model_name" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "image_size" VARCHAR(20),
    "image_url" TEXT,
    "request_params" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(6),

    CONSTRAINT "generation_tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "generation_tasks_status_check" CHECK ("status" IN ('pending', 'processing', 'success', 'failed')),
    CONSTRAINT "generation_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "generation_tasks" ADD COLUMN IF NOT EXISTS "image_url" TEXT;

CREATE INDEX IF NOT EXISTS "idx_generation_tasks_user_id" ON "generation_tasks"("user_id");
CREATE INDEX IF NOT EXISTS "idx_generation_tasks_status" ON "generation_tasks"("status");

CREATE TABLE IF NOT EXISTS "prompt_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "stage" VARCHAR(20) NOT NULL,
    "prompt_text" TEXT,
    "structured_result" JSONB,
    "model_name" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prompt_records_stage_check" CHECK ("stage" IN ('extract', 'final', 'fallback')),
    CONSTRAINT "prompt_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "generation_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_prompt_records_task_id" ON "prompt_records"("task_id");

CREATE TABLE IF NOT EXISTS "task_asset_references" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "reference_type" VARCHAR(20) NOT NULL,
    "match_method" VARCHAR(20) NOT NULL,
    "reference_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_asset_references_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_asset_references_reference_type_check" CHECK ("reference_type" IN ('subject', 'equipment', 'scene', 'style')),
    CONSTRAINT "task_asset_references_match_method_check" CHECK ("match_method" IN ('tag', 'description')),
    CONSTRAINT "task_asset_references_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "generation_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_asset_references_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_task_asset_references_task_id" ON "task_asset_references"("task_id");

CREATE TABLE IF NOT EXISTS "approval_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "submitter_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "submitter_note" TEXT,
    "reviewer_note" TEXT,
    "parent_request_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(6),

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "approval_requests_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected')),
    CONSTRAINT "approval_requests_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "generation_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_requests_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "approval_requests_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "approval_requests_parent_request_id_fkey" FOREIGN KEY ("parent_request_id") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_approval_requests_submitter_id" ON "approval_requests"("submitter_id");
CREATE INDEX IF NOT EXISTS "idx_approval_requests_reviewer_id" ON "approval_requests"("reviewer_id");
CREATE INDEX IF NOT EXISTS "idx_approval_requests_status" ON "approval_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_approval_requests_task_id" ON "approval_requests"("task_id");
CREATE INDEX IF NOT EXISTS "idx_approval_requests_parent_id" ON "approval_requests"("parent_request_id");
