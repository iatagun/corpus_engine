import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';
import { INDEX_SETTINGS } from './create-index';
import { BulkIndexer } from './ingestor';

dotenv.config();

const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
    },
    ssl: { rejectUnauthorized: false },
});

const ALIAS_NAME = 'corpus_read';
const CORPUS_FILE = "c:\\Users\\user\\OneDrive\\Belgeler\\GitHub\\corpus_engine\\tr_pud-ud-test.conllu";

async function rotateIndex() {
    console.log("🚀 Starting Zero-Downtime Index Rotation...");

    // 1. Generate new index name
    const timestamp = Date.now();
    const newIndexName = `corpus_sentences_v${timestamp}`;
    console.log(`1. Creating new index: ${newIndexName}`);

    await client.indices.create({
        index: newIndexName,
        body: INDEX_SETTINGS
    });

    // 2. Ingest Data into New Index 
    // (Injecting override to ingestor would be cleaner, but for now we manually use BulkIndexer 
    // or we just trick it by instantiating it with the new index name if it allowed injection.
    // The current BulkIndexer has hardcoded 'corpus_sentences_v1'. We need to fix that or subclass it.
    // Let's modify BulkIndexer to accept indexName in constructor)

    console.log(`2. Ingesting data into ${newIndexName}...`);
    // NOTE: I am assuming I will fix BulkIndexer to accept indexName. 
    // If not, I'll need to do it now.
    const indexer = new BulkIndexer(newIndexName);
    await indexer.processFile(CORPUS_FILE, 'corpus_pud_1', 'pud_doc');

    // 3. Perform Atomic Alias Swap
    console.log("3. Switching Alias...");

    // Get current index pointed to by alias
    const aliasCheck = await client.cat.aliases({ name: ALIAS_NAME, format: 'json' });
    const oldIndices = aliasCheck.body.map((a: any) => a.index);

    const actions: any[] = [
        { add: { index: newIndexName, alias: ALIAS_NAME } }
    ];

    for (const oldIndex of oldIndices) {
        actions.push({ remove: { index: oldIndex, alias: ALIAS_NAME } });
    }

    await client.indices.updateAliases({
        body: { actions }
    });

    console.log(`✅ Rotation Complete! Alias '${ALIAS_NAME}' now points to '${newIndexName}'.`);
    console.log(`Old indices removed from alias: ${oldIndices.join(', ')}`);

    // Optional: Delete old indices after a safe delay
    // await client.indices.delete({ index: oldIndices });
}

rotateIndex().catch(console.error);
