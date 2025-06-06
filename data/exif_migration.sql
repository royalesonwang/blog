-- 为album_image表添加EXIF主要参数字段：ISO、快门速度、光圈和焦距
ALTER TABLE album_image ADD COLUMN IF NOT EXISTS exif_iso INTEGER DEFAULT NULL;
ALTER TABLE album_image ADD COLUMN IF NOT EXISTS exif_exposure_time FLOAT DEFAULT NULL;
ALTER TABLE album_image ADD COLUMN IF NOT EXISTS exif_f_number FLOAT DEFAULT NULL;
ALTER TABLE album_image ADD COLUMN IF NOT EXISTS exif_focal_length FLOAT DEFAULT NULL;

-- 为image_uploads表添加EXIF主要参数字段：ISO、快门速度、光圈和焦距
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS exif_iso INTEGER DEFAULT NULL;
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS exif_exposure_time FLOAT DEFAULT NULL;
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS exif_f_number FLOAT DEFAULT NULL;
ALTER TABLE image_uploads ADD COLUMN IF NOT EXISTS exif_focal_length FLOAT DEFAULT NULL;
