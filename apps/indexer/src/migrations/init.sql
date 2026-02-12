-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Corpora Table
CREATE TABLE IF NOT EXISTS corpora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}'::jsonb, -- dynamic config for corpus-specific fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL, -- The ID from the source file (e.g., <doc id="123">)
    title TEXT,
    meta JSONB DEFAULT '{}'::jsonb, -- Flexible metadata: year, author, genre
    token_count INT DEFAULT 0,
    sentence_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(corpus_id, external_id)
);

-- 3. Export Jobs Table
CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corpus_id UUID REFERENCES corpora(id),
    query_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed
    progress INT DEFAULT 0,
    result_url TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ingestion Jobs Table (for tracking file progress)
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corpus_id UUID REFERENCES corpora(id),
    filename TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    processed_sentences INT DEFAULT 0,
    total_sentences INT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_corpus_id ON documents(corpus_id);
CREATE INDEX IF NOT EXISTS idx_documents_meta ON documents USING GIN (meta);
