#!/bin/bash
# scripts/ops/backup-postgres.sh

# Load environment variables
source .env

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/postgres"
FILE_NAME="corpus_db_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "🚀 Starting Postgres Backup..."

# Use pg_dump via docker-compose or direct if installed
docker compose exec -t postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > $BACKUP_DIR/$FILE_NAME

if [ $? -eq 0 ]; then
  echo "✅ Backup Successful: $BACKUP_DIR/$FILE_NAME"
  # Optional: gzip the backup
  gzip $BACKUP_DIR/$FILE_NAME
else
  echo "❌ Backup Failed"
  exit 1
fi
