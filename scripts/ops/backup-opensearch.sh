#!/bin/bash
# scripts/ops/backup-opensearch.sh

# Load environment variables
source .env

REPO_NAME="my_backup_repo"
SNAPSHOT_NAME="snapshot_$(date +%Y%m%d_%H%M%S)"
OS_URL=${OPENSEARCH_NODE:-"http://localhost:9200"}

echo "🚀 Registering OpenSearch Snapshot Repository (if not exists)..."
# Note: path.repo must be set in opensearch.yml
curl -X PUT "$OS_URL/_snapshot/$REPO_NAME" -H "Content-Type: application/json" -d '{
  "type": "fs",
  "settings": {
    "location": "/usr/share/opensearch/snapshots"
  }
}'

echo "📸 Creating Snapshot: $SNAPSHOT_NAME..."
curl -X PUT "$OS_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?wait_for_completion=true"

if [ $? -eq 0 ]; then
  echo "✅ Snapshot Successful: $SNAPSHOT_NAME"
else
  echo "❌ Snapshot Failed"
  exit 1
fi
