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

async function main() {
    const indexName = 'corpus_sentences_v1';

    console.log(`Configuring slow logs for ${indexName}...`);

    try {
        await client.indices.putSettings({
            index: indexName,
            body: {
                "index.search.slowlog.threshold.query.warn": "100ms",
                "index.search.slowlog.threshold.query.info": "50ms",
                "index.search.slowlog.threshold.fetch.warn": "100ms",
                "index.search.slowlog.level": "info"
            }
        });

        console.log(`Slow logs configured: Warn > 100ms, Info > 50ms.`);

    } catch (error: any) {
        console.error('Configuration failed:', error.meta ? error.meta.body : error);
    }
}

main();
