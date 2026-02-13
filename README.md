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

## 🚀 3-Step Setup (For Production)

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Launch Everything (API + Web + DB)
```bash
docker compose -f docker-compose.prod.yml up -d
```
> *Wait ~30 seconds for OpenSearch to wake up.*

### 3. Initialize Data
```bash
docker compose exec api npm run migrate
docker compose exec api npm run init-index
```

---

## 🖥️ Access Points
- **Frontend (UI)**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

---

## �🔍 API Usage

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