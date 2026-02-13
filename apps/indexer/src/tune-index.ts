import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
    },
    ssl: { rejectUnauthorized: false },
});

const indexName = 'corpus_sentences_v1';

async function tuneIndex() {
    console.log(`Tuning index ${indexName} for production read-heavy load...`);

    // 1. Refresh Interval: 30s (Default is 1s).
    // Longer interval = faster indexing, less resource usage, but slight delay in visibility.
    // For a corpus that updates rarely, 30s or even -1 (manual refresh) is best.

    try {
        await client.indices.putSettings({
            index: indexName,
            body: {
                index: {
                    refresh_interval: "30s",
                    number_of_replicas: 0, // Single node
                    translog: {
                        durability: "async" // Write speed
                    }
                }
            }
        });
        console.log(`✅ Index settings updated: refresh_interval=30s, replicas=0, translog=async.`);
    } catch (error) {
        console.error("Failed to update index settings:", error);
    }
}

tuneIndex().catch(console.error);
