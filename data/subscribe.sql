CREATE TABLE subscribe (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
);