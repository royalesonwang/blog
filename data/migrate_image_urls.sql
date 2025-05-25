-- 修改album_image表，移除public_url和thumbnail_url字段
ALTER TABLE album_image DROP COLUMN IF EXISTS public_url;
ALTER TABLE album_image DROP COLUMN IF EXISTS thumbnail_url;

-- 修改image_uploads表，移除public_url和thumbnail_url字段
ALTER TABLE image_uploads DROP COLUMN IF EXISTS public_url;
ALTER TABLE image_uploads DROP COLUMN IF EXISTS thumbnail_url;

-- 确保file_path字段存在且不为空
ALTER TABLE album_image ALTER COLUMN file_path SET NOT NULL;
ALTER TABLE image_uploads ALTER COLUMN file_path SET NOT NULL;
