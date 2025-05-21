CREATE TABLE album_image (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  folder_name TEXT DEFAULT 'album',
  uploaded_by VARCHAR REFERENCES users(uuid),
  description TEXT,
  alt_text TEXT,
  tags TEXT[],
  storage_provider TEXT NOT NULL DEFAULT 'cloudflare_r2',
  group_id INTEGER REFERENCES album_groups(id),
  bucket_name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE album_groups (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at timestamptz,
  updated_at timestamptz,
  author_name VARCHAR(255)
);