-- 添加缩略图URL字段
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 如果宽高字段不存在，则添加
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS height INTEGER;

-- 更新注释
COMMENT ON COLUMN image_uploads.thumbnail_url IS '图片缩略图URL';
COMMENT ON COLUMN image_uploads.width IS '图片宽度（像素）';
COMMENT ON COLUMN image_uploads.height IS '图片高度（像素）'; 