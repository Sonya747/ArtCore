-- ========================================
-- 1. 清空旧表，从零重建
-- ========================================
DROP TABLE IF EXISTS "generated_images" CASCADE;
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

CREATE TABLE "generated_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "generated_images_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "generation_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_generated_images_task_id" ON "generated_images"("task_id");

-- ========================================
-- 3. 注入测试数据
-- ========================================

-- 3.1 用户
INSERT INTO "users" ("id", "username", "password_hash", "display_name", "role", "created_at") VALUES
('a0000000-0000-0000-0000-000000000001', 'yuxingsong@gmail.com',  'hash_placeholder', '宋雨星', 'admin',  '2025-06-01 00:00:00'),
('a0000000-0000-0000-0000-000000000002', 'hanpingxu@gmail.com',   'hash_placeholder', '许汉平', 'admin',  '2025-06-02 00:00:00'),
('a0000000-0000-0000-0000-000000000003', 'zhangming@gmail.com',   'hash_placeholder', '张明',   'member', '2025-07-01 00:00:00'),
('a0000000-0000-0000-0000-000000000004', 'lihua@gmail.com',       'hash_placeholder', '李华',   'member', '2025-07-15 00:00:00'),
('a0000000-0000-0000-0000-000000000005', 'wangfang@gmail.com',    'hash_placeholder', '王芳',   'member', '2025-08-01 00:00:00');

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
('c0000000-0000-0000-0000-000000000001', '龙骑士',     'character', '穿着黑色重铠、头戴双角盔的龙骑士，肩披暗红色斗篷',                          'https://placehold.co/512x512/1a1a2e/e94560?text=DragonKnight',  'a0000000-0000-0000-0000-000000000001', '2025-08-10 10:00:00'),
('c0000000-0000-0000-0000-000000000002', '雷霆之怒',   'weapon',    '散发蓝色闪电的双手巨剑，剑身刻有符文',                                    'https://placehold.co/512x512/0f3460/e94560?text=Thunderfury',   'a0000000-0000-0000-0000-000000000001', '2025-08-11 10:00:00'),
('c0000000-0000-0000-0000-000000000003', '冰雪荒原',   'scene',     '无尽的雪原，远处有冰川和极光',                                            'https://placehold.co/512x512/c4e0e5/1a1a2e?text=Snowfield',    'a0000000-0000-0000-0000-000000000002', '2025-08-12 10:00:00'),
('c0000000-0000-0000-0000-000000000004', '赛博街区',   'scene',     '霓虹闪烁的未来城市街道，雨后的路面倒映着广告灯牌',                          'https://placehold.co/512x512/533483/e94560?text=CyberStreet',   'a0000000-0000-0000-0000-000000000002', '2025-08-13 10:00:00'),
('c0000000-0000-0000-0000-000000000005', '魔法师',     'character', '身穿深蓝长袍、手持水晶法杖的年老魔法师',                                   'https://placehold.co/512x512/16213e/0f3460?text=Mage',          'a0000000-0000-0000-0000-000000000003', '2025-08-14 10:00:00'),
('c0000000-0000-0000-0000-000000000006', '火焰剑',     'weapon',    '剑身燃烧着永恒火焰的单手剑，握柄由龙骨制成',                               'https://placehold.co/512x512/e94560/1a1a2e?text=FlameSword',    'a0000000-0000-0000-0000-000000000003', '2025-08-15 10:00:00'),
('c0000000-0000-0000-0000-000000000007', '中世纪城堡', 'scene',     '矗立在悬崖之上的石砌城堡，周围环绕着浓雾',                                 'https://placehold.co/512x512/1a1a2e/c4e0e5?text=Castle',       'a0000000-0000-0000-0000-000000000004', '2025-08-16 10:00:00'),
('c0000000-0000-0000-0000-000000000008', '油画纹理',   'style',     '浓郁笔触的写实油画风格，色彩饱满，光影对比强烈',                            'https://placehold.co/512x512/e94560/c4e0e5?text=OilPaint',     'a0000000-0000-0000-0000-000000000004', '2025-08-17 10:00:00');

-- 3.4 资产-标签关联
INSERT INTO "asset_tag_mapping" ("asset_id", "tag_id") VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007'),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000008'),
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006'),
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004');

-- 3.5 生成任务
INSERT INTO "generation_tasks" ("id", "user_id", "raw_prompt", "final_prompt", "model_name", "status", "image_size", "request_params", "error_message", "created_at", "finished_at") VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 '画一个龙骑士拿着雷霆之怒站在雪原',
 'A majestic dragon knight in heavy black plate armor with a horned helmet, wielding Thunderfury crackling with blue lightning, standing in a vast snowy field under aurora borealis, realistic oil painting style, cinematic lighting, masterpiece, 8k',
 'doubao-seedream-5-0', 'success', '2K', '{"watermark": true}', NULL,
 '2025-09-01 14:00:00', '2025-09-01 14:02:30'),

('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
 '赛博朋克街头的魔法师',
 'An ancient mage in deep blue robes holding a crystal staff, standing in a neon-lit cyberpunk street with rain reflections, futuristic and fantasy hybrid, volumetric lighting, 4k',
 'doubao-seedream-5-0', 'success', '2K', '{"watermark": false}', NULL,
 '2025-09-02 10:30:00', '2025-09-02 10:33:00'),

('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
 '中世纪城堡前手持火焰剑的骑士',
 'A medieval knight brandishing a flaming sword forged from dragon bone, standing before a stone castle on a misty cliff, dramatic lighting, epic composition, photorealistic, 8k',
 'doubao-seedream-5-0', 'success', '1K', NULL, NULL,
 '2025-09-03 16:00:00', '2025-09-03 16:01:45'),

('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003',
 '雪原上的龙骑士油画风格',
 NULL,
 'doubao-seedream-5-0', 'failed', '2K', NULL, 'model server timeout after 60s',
 '2025-09-04 09:00:00', '2025-09-04 09:01:05'),

('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003',
 '画一把燃烧的巨剑，写实风格',
 NULL,
 'doubao-seedream-5-0', 'pending', '2K', '{"watermark": true}', NULL,
 '2025-09-05 11:00:00', NULL),

('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004',
 '极光下的冰川全景',
 'A breathtaking panoramic view of glaciers under shimmering aurora borealis, snow-covered terrain, photorealistic landscape, ultra wide angle, 8k resolution',
 'doubao-seedream-5-0', 'processing', '2K', NULL, NULL,
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

-- 3.8 生成结果图片
INSERT INTO "generated_images" ("id", "task_id", "image_url", "sort_order", "created_at") VALUES
('11000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'https://placehold.co/1024x1024/1a1a2e/e94560?text=Result1', 0, '2025-09-01 14:02:30'),
('11000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'https://placehold.co/1024x1024/533483/c4e0e5?text=Result2', 0, '2025-09-02 10:33:00'),
('11000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'https://placehold.co/1024x1024/e94560/1a1a2e?text=Result3', 0, '2025-09-03 16:01:45');
