# Linguistic Corpus Engine

A production-grade, distributed corpus engine designed to handle 1B+ tokens with linguistic query capabilities.

## Architecture
- **API**: Fastify + TypeScript (Handles search & DSL translation).
- **Indexer**: Node.js Stream Processing (Handles CONLLU/VRT ingestion).
- **Storage**: OpenSearch (Vectors & Nested Tokens), PostgreSQL (Metadata), Redis (Queues-Ready).

## Prerequisites
- Node.js v18+
- Docker & Docker Compose

## Quick Start

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Initialize Data Stores
```bash
# Install Dependencies & Build
npm install
npm run build

# Initialize OpenSearch Index
npm run init-index --workspace=apps/indexer
```

### 3. Generate & Ingest Data
```bash
# Generate 100k synthetic sentences
npm run gen-synth --workspace=apps/indexer

# Ingest into OpenSearch
npm run ingest-synth --workspace=apps/indexer
```

### 4. Run Services
```bash
# Terminal 1: API
npm start --workspace=apps/api

# Terminal 2: Indexer (if running background jobs)
npm start --workspace=apps/indexer
```

## Testing
- **Functional**: `npx ts-node apps/api/src/scripts/functional-test.ts`
- **Load**: `npx ts-node apps/api/test/load-test.ts`

## Query Example
POST `
`
```json
{
  "corpus_id": "corpus_synth_1",
  "query": {
    "type": "sequence",
    "elements": [
      { "type": "token", "lemma": "complex" },
      { "type": "token", "lemma": "system" }
    ]
  }
}
```