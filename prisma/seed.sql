-- ========================================
-- 1. 清空旧表，从零重建
-- ========================================
DROP TABLE IF EXISTS "chat_messages" CASCADE;
DROP TABLE IF EXISTS "chat_conversations" CASCADE;
DROP TABLE IF EXISTS "approval_requests" CASCADE;
DROP TABLE IF EXISTS "task_asset_references" CASCADE;
DROP TABLE IF EXISTS "prompt_records" CASCADE;
DROP TABLE IF EXISTS "generation_tasks" CASCADE;
DROP TABLE IF EXISTS "asset_tag_mapping" CASCADE;
DROP TABLE IF EXISTS "assets" CASCADE;
DROP TABLE IF EXISTS "tags" CASCADE;
DROP TABLE IF EXISTS "reference_images" CASCADE;
DROP TABLE IF EXISTS "workspaces" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- ========================================
-- 2. 建表（与 init.sql 一致）
-- ========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(50),
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_role_check" CHECK ("role" IN ('admin', 'member'))
);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "assets" (
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
CREATE INDEX "idx_assets_type" ON "assets"("type");
CREATE INDEX "idx_assets_created_at" ON "assets"("created_at");

CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

CREATE TABLE "asset_tag_mapping" (
    "asset_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    CONSTRAINT "asset_tag_mapping_pkey" PRIMARY KEY ("asset_id", "tag_id"),
    CONSTRAINT "asset_tag_mapping_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asset_tag_mapping_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_asset_tag_mapping_tag_id" ON "asset_tag_mapping"("tag_id");

CREATE TABLE "generation_tasks" (
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
CREATE INDEX "idx_generation_tasks_user_id" ON "generation_tasks"("user_id");
CREATE INDEX "idx_generation_tasks_status" ON "generation_tasks"("status");

CREATE TABLE "prompt_records" (
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
CREATE INDEX "idx_prompt_records_task_id" ON "prompt_records"("task_id");

CREATE TABLE "task_asset_references" (
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
CREATE INDEX "idx_task_asset_references_task_id" ON "task_asset_references"("task_id");

CREATE TABLE "approval_requests" (
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
CREATE INDEX "idx_approval_requests_submitter_id" ON "approval_requests"("submitter_id");
CREATE INDEX "idx_approval_requests_reviewer_id" ON "approval_requests"("reviewer_id");
CREATE INDEX "idx_approval_requests_status" ON "approval_requests"("status");
CREATE INDEX "idx_approval_requests_task_id" ON "approval_requests"("task_id");
CREATE INDEX "idx_approval_requests_parent_id" ON "approval_requests"("parent_request_id");

CREATE TABLE "chat_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "title" VARCHAR(200) NOT NULL DEFAULT '新对话',
    "model_name" VARCHAR(100),
    "system_prompt" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "idx_chat_conversations_user_id" ON "chat_conversations"("user_id");
CREATE INDEX "idx_chat_conversations_updated_at" ON "chat_conversations"("updated_at" DESC);

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "model_name" VARCHAR(100),
    "token_usage" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_messages_role_check" CHECK ("role" IN ('system', 'user', 'assistant')),
    CONSTRAINT "chat_messages_status_check" CHECK ("status" IN ('success', 'error', 'aborted')),
    CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_chat_messages_conversation_id" ON "chat_messages"("conversation_id");
CREATE INDEX "idx_chat_messages_created_at" ON "chat_messages"("created_at");

-- ========================================
-- 3. 注入测试数据
-- ========================================

-- 3.1 用户
INSERT INTO "users" ("id", "username", "password_hash", "display_name", "role", "created_at") VALUES
('a0000000-0000-0000-0000-000000000001', 'yuxingsong@gmail.com',  'd95a2a67bf2b8ad7ec01f473b95ef008:324bbc6f18b44036dfd9298c58dd3b6c3cda4abde7ec7ce2b83e0b6d672dc71c319282d8cd4fa9f383c77a29fdecb4923a1ff709ed72f15e46c260e86d2b436c', '宋雨星', 'admin',  '2025-06-01 00:00:00'),
('a0000000-0000-0000-0000-000000000002', 'hanpingxu@gmail.com',   'e13ee9e43cf33eeb8bd990bc481b57e4:9602598aaf4e596de756327b74e7b8f507f7a2fe52dc1f7670e822f6385f270e0d93bd980b1a4c7d405c08cda93f153c54cf9e2703cf97ba624a4e688a760070', '许汉平', 'admin',  '2025-06-02 00:00:00'),
('a0000000-0000-0000-0000-000000000003', 'zhangming@gmail.com',   '7b39e3f4740e0d9fe909d4f4f1c78e04:6fa268df0a9e387ef7b678c95fc8e871b3a1a8298f8071f5a38c08c23adad1961d0dabe7e74d8a8240b3fb6629af7fd302280d4a695ce93510ac77c072021509', '张明',   'member', '2025-07-01 00:00:00'),
('a0000000-0000-0000-0000-000000000004', 'lihua@gmail.com',       'b374fe22065521acb42bd7463db38731:19cd34e3475d1440f1d6e62da3625b3f4223cc2988def2a925de172b9d0a755de2110941c3316ab7d4285cf9b89ef38834a6dbbf4910bc88251ebaeaa0bbae44', '李华',   'member', '2025-07-15 00:00:00'),
('a0000000-0000-0000-0000-000000000005', 'wangfang@gmail.com',    '5259e10be79bb07281e9095a3fb1f92d:16679267f9a32afd869db0b19d955a6f03254138cef0b09c725b27f367251689d520c5d47df19ff2052d32f8375de791354437a65baf8b76c299df1217fdc278', '王芳',   'member', '2025-08-01 00:00:00');

-- 3.2 标签
INSERT INTO "tags" ("id", "name") VALUES
('b0000000-0000-0000-0000-000000000001', '龙骑士'),
('b0000000-0000-0000-0000-000000000002', '雷霆之怒'),
('b0000000-0000-0000-0000-000000000003', '雪原'),
('b0000000-0000-0000-0000-000000000004', '写实油画'),
('b0000000-0000-0000-0000-000000000005', '赛博朋克'),
('b0000000-0000-0000-0000-000000000006', '中世纪'),
('b0000000-0000-0000-0000-000000000007', '魔法师'),
('b0000000-0000-0000-0000-000000000008', '火焰剑');

-- 3.3 资产
INSERT INTO "assets" ("id", "name", "type", "description", "preview_url", "created_by", "created_at") VALUES
('c0000000-0000-0000-0000-000000000001', '法师',       'character', '头戴缀有金色星星的蓝色尖顶巫帽、身着蓝白露脐魔法裙装、手持嵌发光水晶法杖的二次元魔法少女', 'http://tclnvh9o7.hd-bkt.clouddn.com/97bee20770ae01f6b030f5a1451d96046b4d8bf210d0c5-qubiqU.jpeg?e=1776324344&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:ghbSyoHUWf2a_J-ZLtdNgLAWdd8=', NULL, '2025-08-10 10:00:00'),
('c0000000-0000-0000-0000-000000000002', '雷霆之怒',   'weapon',    '散发蓝色闪电的双手巨剑，剑身刻有符文',                                                   'http://tclnvh9o7.hd-bkt.clouddn.com/4806d68eee21ea81b386065e4597f84893f2654919f0e-RY3w21_fw658webp.webp?e=1776324249&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:6Ry6OH6Nnwj-LILajK6fo43bQBs=', NULL, '2025-08-11 10:00:00'),
('c0000000-0000-0000-0000-000000000003', '冰雪荒原',   'scene',     '无尽的雪原，远处有冰川和极光',                                                           'http://tclnvh9o7.hd-bkt.clouddn.com/%E7%94%9F%E6%88%90%E4%BA%8C%E6%AC%A1%E5%85%83%E6%B8%B8%E6%88%8F%E7%94%BB%E9%A3%8E%E5%8F%82%E8%80%83%E5%9B%BE.png?e=1776324614&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:VEwlGINFutCK2heoMpiSmrYSdJU=', 'a0000000-0000-0000-0000-000000000002', '2025-08-12 10:00:00'),
('c0000000-0000-0000-0000-000000000004', '赛博街区',   'scene',     '霓虹闪烁的未来城市街道，雨后的路面倒映着广告灯牌',                                         'http://tclnvh9o7.hd-bkt.clouddn.com/f792de8bb300ec5c82a033df722ad20483a85cc55a210-AUVQf7_fw658webp.webp?e=1776324669&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:9jMFKybZXKc8dWmVznhMVnc0WOQ=', 'a0000000-0000-0000-0000-000000000002', '2025-08-13 10:00:00'),
('c0000000-0000-0000-0000-000000000005', '魔法师',     'character', '身穿深蓝长袍、手持水晶法杖的年老魔法师',                                                  'http://tclnvh9o7.hd-bkt.clouddn.com/fc0bf367507158a57fd8eb6c449845c763557782d3da-D5mRy6_fw658webp.webp?e=1776326419&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:TDpKa1_5XdXqq4wCRV9Y2uUGDAU=', 'a0000000-0000-0000-0000-000000000003', '2025-08-14 10:00:00'),
('c0000000-0000-0000-0000-000000000006', '冰剑',       'weapon',    '剑身银色的单手剑，握柄由羽毛制成',                                                       'http://tclnvh9o7.hd-bkt.clouddn.com/0f080213d273b3e6d8665e86e2b27aedba38c0951eb41-3S9sXH_fw658webp.webp?e=1776323839&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:7A0EVfkp0loeZmJXOuzvalRGa0w=', 'a0000000-0000-0000-0000-000000000003', '2025-08-15 10:00:00'),
('c0000000-0000-0000-0000-000000000007', '中世纪城堡', 'scene',     '矗立在空中之上的石砌城堡，周围环绕着浓雾',                                                'http://tclnvh9o7.hd-bkt.clouddn.com/a5dd3da143d6b2e4d9297b04ae5eb907b3e0d5ec2d99f-59m8Go_fw658webp.webp?e=1776326536&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:yS_2qPuzcbTpTiDfvKxkkq9ttbM=', 'a0000000-0000-0000-0000-000000000004', '2025-08-16 10:00:00'),
('c0000000-0000-0000-0000-000000000009', '星芒弓箭',   'weapon',    '缠绕银白藤蔓与裹挟冰晶羽翼的冰晶战弓，弓身点缀星芒尖刺与幽蓝流光',                            'http://tclnvh9o7.hd-bkt.clouddn.com/422a582cfa657cafa5649e7d3ccc2a0d31cfe54d2a045-veUdo8_fw658webp.webp?e=1776324363&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:74TXfmtbHbSKnVGitQl5hdm-l1c=', 'a0000000-0000-0000-0000-000000000004', '2026-04-16 07:21:19.799761');

-- 3.4 资产-标签关联
INSERT INTO "asset_tag_mapping" ("asset_id", "tag_id") VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007'),
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006');

-- 3.5 生成任务
INSERT INTO "generation_tasks" ("id", "user_id", "raw_prompt", "final_prompt", "model_name", "status", "image_size", "image_url", "request_params", "error_message", "created_at", "finished_at") VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 '画一个龙骑士拿着雷霆之怒站在雪原',
 'A majestic dragon knight in heavy black plate armor with a horned helmet, wielding Thunderfury crackling with blue lightning, standing in a vast snowy field under aurora borealis, realistic oil painting style, cinematic lighting, masterpiece, 8k',
 'doubao-seedream-5-0', 'success', '2K', 'https://placehold.co/1024x1024/1a1a2e/e94560?text=Result1', '{"watermark": true}', NULL,
 '2025-09-01 14:00:00', '2025-09-01 14:02:30'),

('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
 '赛博朋克街头的魔法师',
 'An ancient mage in deep blue robes holding a crystal staff, standing in a neon-lit cyberpunk street with rain reflections, futuristic and fantasy hybrid, volumetric lighting, 4k',
 'doubao-seedream-5-0', 'success', '2K', 'https://placehold.co/1024x1024/533483/c4e0e5?text=Result2', '{"watermark": false}', NULL,
 '2025-09-02 10:30:00', '2025-09-02 10:33:00'),

('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
 '中世纪城堡前手持火焰剑的骑士',
 'A medieval knight brandishing a flaming sword forged from dragon bone, standing before a stone castle on a misty cliff, dramatic lighting, epic composition, photorealistic, 8k',
 'doubao-seedream-5-0', 'success', '1K', 'https://placehold.co/1024x1024/e94560/1a1a2e?text=Result3', NULL, NULL,
 '2025-09-03 16:00:00', '2025-09-03 16:01:45'),

('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003',
 '雪原上的龙骑士油画风格',
 NULL,
 'doubao-seedream-5-0', 'failed', '2K', NULL, NULL, 'model server timeout after 60s',
 '2025-09-04 09:00:00', '2025-09-04 09:01:05'),

('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003',
 '画一把燃烧的巨剑，写实风格',
 NULL,
 'doubao-seedream-5-0', 'pending', '2K', NULL, '{"watermark": true}', NULL,
 '2025-09-05 11:00:00', NULL),

('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004',
 '极光下的冰川全景',
 'A breathtaking panoramic view of glaciers under shimmering aurora borealis, snow-covered terrain, photorealistic landscape, ultra wide angle, 8k resolution',
 'doubao-seedream-5-0', 'processing', '2K', NULL, NULL, NULL,
 '2025-09-06 08:30:00', NULL);

-- 3.6 提示词记录
INSERT INTO "prompt_records" ("id", "task_id", "stage", "prompt_text", "structured_result", "model_name", "created_at") VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'extract', NULL,
 '{"subject": "龙骑士", "equipment": "雷霆之怒", "scene": "雪原", "style": null}',
 'doubao-pro-32k', '2025-09-01 14:00:05'),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'final',
 'A majestic dragon knight in heavy black plate armor with a horned helmet, wielding Thunderfury crackling with blue lightning, standing in a vast snowy field under aurora borealis, realistic oil painting style, cinematic lighting, masterpiece, 8k',
 NULL, 'doubao-pro-32k', '2025-09-01 14:00:12'),

('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'extract', NULL,
 '{"subject": "魔法师", "equipment": null, "scene": "赛博朋克街头", "style": null}',
 'doubao-pro-32k', '2025-09-02 10:30:04'),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'final',
 'An ancient mage in deep blue robes holding a crystal staff, standing in a neon-lit cyberpunk street with rain reflections, futuristic and fantasy hybrid, volumetric lighting, 4k',
 NULL, 'doubao-pro-32k', '2025-09-02 10:30:10'),

('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'extract', NULL,
 '{"subject": "骑士", "equipment": "火焰剑", "scene": "中世纪城堡", "style": null}',
 'doubao-pro-32k', '2025-09-03 16:00:03'),
('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'final',
 'A medieval knight brandishing a flaming sword forged from dragon bone, standing before a stone castle on a misty cliff, dramatic lighting, epic composition, photorealistic, 8k',
 NULL, 'doubao-pro-32k', '2025-09-03 16:00:09'),

('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', 'extract', NULL,
 '{"subject": "龙骑士", "equipment": null, "scene": "雪原", "style": "油画"}',
 'doubao-pro-32k', '2025-09-04 09:00:04'),
('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'fallback',
 '龙骑士, in 雪原, 油画 style, high quality, cinematic lighting',
 NULL, NULL, '2025-09-04 09:00:06');

-- 3.7 任务参考资产
INSERT INTO "task_asset_references" ("id", "task_id", "asset_id", "reference_type", "match_method", "reference_order") VALUES
('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'subject',   'tag', 0),
('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'equipment', 'tag', 1),
('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'scene',     'tag', 2),
('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'subject',   'tag', 0),
('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'scene',     'description', 1),
('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'equipment', 'tag', 0),
('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'scene',     'tag', 1);

-- 3.8.1 成员侧已成功任务（用于审批模块）
INSERT INTO "generation_tasks" ("id", "user_id", "raw_prompt", "final_prompt", "model_name", "status", "image_size", "image_url", "request_params", "created_at", "finished_at") VALUES
('d1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
 '星空下的独角兽奔跑在云端',
 'A majestic unicorn galloping across clouds under a starry sky, iridescent mane flowing, cinematic fantasy painting, volumetric lighting, 8k masterpiece',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/unicorn/1024/1024', '{"watermark": false, "seed": 12450}',
 '2025-09-10 10:00:00', '2025-09-10 10:01:20'),
('d1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
 '秋日森林中的狐狸精灵',
 'An ethereal fox spirit with glowing nine tails walking through an autumn forest, falling red leaves, soft morning light, studio ghibli style, ultra detailed',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/foxspirit/1024/1024', '{"watermark": false, "seed": 77123}',
 '2025-09-11 14:30:00', '2025-09-11 14:31:45'),
('d1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
 '海底宫殿中的美人鱼公主',
 'A regal mermaid princess in a coral palace beneath the ocean, schools of glowing fish, bioluminescent lighting, hyperrealistic digital painting, 8k',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/mermaid/1024/1024', '{"watermark": true, "seed": 33198}',
 '2025-09-12 09:15:00', '2025-09-12 09:16:50'),
('d1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
 '未来都市的机甲战士',
 'A heavily armored mecha pilot standing on a neon-lit rooftop overlooking a futuristic city, cyberpunk aesthetic, rain and reflections, cinematic, 4k',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/mecha/1024/1024', '{"watermark": false, "seed": 54620}',
 '2025-09-13 11:00:00', '2025-09-13 11:02:10'),
('d1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005',
 '樱花树下的和服少女',
 'A young girl in a traditional kimono standing beneath a blooming cherry blossom tree, falling pink petals, soft bokeh, photorealistic portrait, 8k',
 'doubao-seedream-5-0', 'success', '1K', 'https://picsum.photos/seed/sakura/1024/1024', '{"watermark": true, "seed": 89012}',
 '2025-09-14 16:45:00', '2025-09-14 16:46:30'),
('d1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005',
 '废墟中的机械天使',
 'A mechanical angel with broken wings standing in post-apocalyptic ruins, glowing halo, dramatic lighting, dark fantasy concept art, ultra detailed',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/angel/1024/1024', '{"watermark": false, "seed": 45789}',
 '2025-09-15 08:20:00', '2025-09-15 08:22:05'),
('d1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003',
 '熔岩巨龙破空而出',
 'A colossal lava dragon bursting from a volcano, magma flowing from its scales, ember particles, dynamic composition, epic fantasy art, 8k',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/dragon/1024/1024', '{"watermark": false, "seed": 21334}',
 '2025-09-16 13:10:00', '2025-09-16 13:12:40'),
('d1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004',
 '水墨风格的山水村落',
 'A peaceful Chinese mountain village rendered in classical ink wash painting, distant mist, flowing river, minimalist brushstrokes, traditional aesthetic',
 'doubao-seedream-5-0', 'success', '2K', 'https://picsum.photos/seed/inkwash/1024/1024', '{"watermark": true, "seed": 67450}',
 '2025-09-17 15:55:00', '2025-09-17 15:57:20');

-- 3.9 审批申请
-- 张明 提交任务 1 给管理员宋雨星 -> 已通过
INSERT INTO "approval_requests" ("id", "task_id", "submitter_id", "reviewer_id", "status", "submitter_note", "reviewer_note", "parent_request_id", "version", "created_at", "reviewed_at") VALUES
('22000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'approved', '首版龙骑士效果，请审核', '画面氛围到位，可以用于最终物料。',
 NULL, 1, '2025-09-01 15:00:00', '2025-09-01 15:20:00'),

-- 李华 提交任务 2 给宋雨星 -> 驳回
('22000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'rejected', '魔法师赛博风格首版', '光影太亮,人物手指崩了,请重新生成。',
 NULL, 1, '2025-09-02 11:00:00', '2025-09-02 11:30:00'),

-- 李华 基于上条驳回重新提交 -> 待审批（v2）
('22000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'pending', '已根据意见调整提示词，降低高光、修正手部结构，请再次审核。', NULL,
 '22000000-0000-0000-0000-000000000002', 2, '2025-09-02 12:00:00', NULL),

-- 王芳 提交任务 3 给许汉平 -> 待审批
('22000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002',
 'pending', '中世纪城堡骑士，等待审批。', NULL,
 NULL, 1, '2025-09-03 17:00:00', NULL),

-- 张明 新任务首次提交 -> 待审批（宋雨星）
('22100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'pending', '新业务线旗舰 banner 图，请审核。', NULL,
 NULL, 1, '2025-09-10 11:00:00', NULL),

-- 张明 秋日森林 -> 通过（许汉平）
('22100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
 'approved', '秋季主题活动首图备选。', '氛围很好，立刻可用。',
 NULL, 1, '2025-09-11 15:00:00', '2025-09-11 15:30:00'),

-- 李华 美人鱼 -> 通过（宋雨星）
('22100000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'approved', '用于宣传海报的候选。', '构图完整，色彩稳，通过。',
 NULL, 1, '2025-09-12 10:00:00', '2025-09-12 10:40:00'),

-- 李华 机甲战士 v1 -> 驳回（许汉平）
('22100000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
 'rejected', '赛博主题定制海报 v1。', '背景乱，主体的头盔比例偏大，请重新生成。',
 NULL, 1, '2025-09-13 12:00:00', '2025-09-13 13:30:00'),

-- 李华 机甲战士 v2 -> 待审批
('22100000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
 'pending', '已根据批注修正头盔比例、简化背景，请再次审核。', NULL,
 '22100000-0000-0000-0000-000000000004', 2, '2025-09-13 18:00:00', NULL),

-- 王芳 樱花少女 v1 -> 驳回（宋雨星）
('22100000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
 'rejected', '春季营销活动头图。', '人物面部有轻微崩坏，樱花色彩过饱和，请重生。',
 NULL, 1, '2025-09-14 17:00:00', '2025-09-14 18:00:00'),

-- 王芳 樱花少女 v2 -> 通过（宋雨星）
('22100000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
 'approved', '已增加人物细节描述词并调低饱和度，请再审。', '细节到位了，通过。',
 '22100000-0000-0000-0000-000000000006', 2, '2025-09-15 09:00:00', '2025-09-15 09:45:00'),

-- 王芳 机械天使 -> 待审批（许汉平）
('22100000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000006',
 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002',
 'pending', '暗黑系概念图，比稿用。', NULL,
 NULL, 1, '2025-09-15 10:30:00', NULL),

-- 张明 熔岩巨龙 -> 待审批（宋雨星）
('22100000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000007',
 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'pending', '大主视觉备选，求快审。', NULL,
 NULL, 1, '2025-09-16 14:00:00', NULL),

-- 李华 水墨村落 -> 通过（许汉平）
('22100000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000008',
 'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
 'approved', '传统文化专题页面配图。', '气韵尚佳，保留。',
 NULL, 1, '2025-09-17 16:00:00', '2025-09-17 16:20:00');
