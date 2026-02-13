#!/bin/bash
# scripts/ops/restore-opensearch.sh

# Load environment variables
source .env

REPO_NAME="my_backup_repo"
SNAPSHOT_NAME=$1
OS_URL=${OPENSEARCH_NODE:-"http://localhost:9200"}

if [ -z "$SNAPSHOT_NAME" ]; then
  echo "Usage: ./restore-opensearch.sh <snapshot_name>"
  exit 1
fi

echo "🚀 Starting OpenSearch Restore for snapshot: $SNAPSHOT_NAME..."

# Close indices before restore if they exist and are the same
# Or restore with rename
curl -X POST "$OS_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME/_restore?wait_for_completion=true" -H "Content-Type: application/json" -d '{
  "indices": "corpus_*",
  "rename_pattern": "corpus_(.+)",
  "rename_replacement": "restored_corpus_$1"
}'

if [ $? -eq 0 ]; then
  echo "✅ Restore Initiated. Check status at $OS_URL/_cat/indices?v"
  echo "💡 Tip: After restore, update the 'corpus_read' alias to point to the restored index."
else
  echo "❌ Restore Failed"
  exit 1
fi
