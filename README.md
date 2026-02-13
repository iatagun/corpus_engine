# Corpus Engine

Production-ready linguistic corpus engine built with:
- **Node.js**: Low-latency API & Stream Indexing
- **OpenSearch**: High-performance token search & KWIC
- **PostgreSQL**: Durable metadata storage
- **Redis**: Distributed cache & request coalescing

Supports:
- Lemma search
- POS pattern queries
- Dependency & Relation queries
- KWIC (Key Word In Context) results

---

## ⚡ Quick Start

Get the system up and running in 5 minutes:

```bash
git clone <repo_url>
cd corpus-engine

# 1. Setup Environment
cp .env.example .env

# 2. Start Infrastructure & Services
docker compose -f docker-compose.prod.yml up -d

# 3. Initialize Data Stores
docker compose exec api npm run migrate
docker compose exec api npm run init-index
```

---

## ✅ Verify Installation

Check if the engine and its dependencies are healthy:

```bash
# Check Process Status
curl http://localhost:3000/health

# Check Dependency Connectivity (Redis, DB, OpenSearch)
curl http://localhost:3000/ready
```

---

## 📥 How to Upload Data (CoNLL-U)

The ingestion process is high-performance and stream-based. To load your linguistic data:

### 1. Prepare your files
Copy your `.conllu` files into the `./data` folder on your host machine. This folder is synchronized with the `indexer` container.

### 2. Run Ingestion
You can ingest a single file or an entire directory:

**Single File:**
```bash
docker compose exec indexer \
  npx tsx apps/indexer/src/ingestor.ts /app/data/my_file.conllu my_corpus_id
```

**Bulk Ingestion (All files in a folder):**
```bash
# Ingest all .conllu files in the data folder to one corpus
./scripts/ops/bulk-ingest.sh my_corpus_id /app/data
```

---

## 🔍 API Usage

### Example Search Query
**POST /search**

```json
{
  "corpus_id": "tr_pud",
  "query": {
    "type": "token",
    "lemma": "git"
  }
}
```

---

## 🛠️ Operations

### Backup
- **Postgres**: `scripts/ops/backup-postgres.sh`
- **OpenSearch**: `scripts/ops/backup-opensearch.sh`

### Restore
- **Recovery**: `scripts/ops/restore-opensearch.sh`

### Maintenance
- **Index Rotation**: `scripts/ops/rotate-index.sh` (Zero-downtime mapping updates)

---

## 🩺 Troubleshooting

**OpenSearch Not Ready?**
Wait 30–60 seconds after `docker compose` for the Java nodes to initialize.

**Check Logs:**
```bash
docker logs corpus-api
docker logs corpus-opensearch
```

---

## � System Requirements
- **RAM**: 8–16 GB recommended (OpenSearch takes ~4GB)
- **Engine**: Docker + Docker Compose
- **Platform**: Linux server / Windows with WSL2 recommended

---
*Built for scale. Optimized for linguists.*