#!/bin/bash
# scripts/ops/bulk-ingest.sh

# Usage: ./bulk-ingest.sh <corpus_id> <data_directory_inside_container>
# Example: ./bulk-ingest.sh my_corpus /app/data/my_files

CORPUS_ID=$1
DATA_DIR=$2

if [ -z "$CORPUS_ID" ] || [ -z "$DATA_DIR" ]; then
  echo "Usage: ./bulk-ingest.sh <corpus_id> <data_directory>"
  echo "Example: ./bulk-ingest.sh tr_pud /app/data/uploads"
  exit 1
fi

echo "🚀 Starting Bulk Ingestion for Corpus: $CORPUS_ID from $DATA_DIR"

# List files in the directory and process each .conllu file
FILES=$(docker compose exec -t indexer ls $DATA_DIR | grep .conllu)

for FILE in $FILES; do
  echo "📂 Processing: $FILE"
  docker compose exec -t indexer npx tsx apps/indexer/src/ingestor.ts "$DATA_DIR/$FILE" "$CORPUS_ID"
  
  if [ $? -eq 0 ]; then
    echo "✅ Successfully ingested $FILE"
  else
    echo "❌ Failed to ingest $FILE"
  fi
done

echo "🏁 Bulk Ingestion Finished!"
