#!/bin/bash
# scripts/ops/rotate-index.sh

# Load environment variables
source .env

NEW_INDEX=$1
ALIAS_NAME="corpus_read"
OS_URL=${OPENSEARCH_NODE:-"http://localhost:9200"}

if [ -z "$NEW_INDEX" ]; then
  echo "Usage: ./rotate-index.sh <new_index_name>"
  exit 1
fi

echo "🚀 Rotating Alias '$ALIAS_NAME' to '$NEW_INDEX'..."

# Atomic swap of the alias
curl -X POST "$OS_URL/_aliases" -H "Content-Type: application/json" -d "{
  \"actions\": [
    { \"remove\": { \"index\": \"*\", \"alias\": \"$ALIAS_NAME\" } },
    { \"add\": { \"index\": \"$NEW_INDEX\", \"alias\": \"$ALIAS_NAME\" } }
  ]
}"

if [ $? -eq 0 ]; then
  echo "✅ Alias Rotation Successful"
else
  echo "❌ Alias Rotation Failed"
  exit 1
fi
