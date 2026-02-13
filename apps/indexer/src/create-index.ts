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

export const INDEX_SETTINGS = {
    settings: {
        number_of_shards: 1, // Dev/Small Corpus
        number_of_replicas: 0,
        refresh_interval: "30s", // Prod setting
        translog: {
            durability: "async"
        }
    },
    mappings: {
        properties: {
            corpus_id: { type: 'keyword' },
            sentence_id: { type: 'keyword' },
            text: { type: 'text' },

            // Denormalized Fields for Fast Filtering
            has_lemma: { type: 'keyword' },
            has_upos: { type: 'keyword' },
            has_feats: { type: 'keyword' }, // e.g., "Case=Nom"

            tokens: {
                type: 'nested',
                properties: {
                    id: { type: 'integer' },
                    form: { type: 'keyword' }, // Keyword for exact match
                    lemma: { type: 'keyword' },
                    upos: { type: 'keyword' },
                    xpos: { type: 'keyword' },
                    feats: { type: 'keyword' }, // "Case=Nom|Number=Sing" - strict keyword? Or text?
                    // flexible feats handling: perhaps standard text for now or keyword
                    head: { type: 'integer' },
                    deprel: { type: 'keyword' },
                    misc: { type: 'text' },

                    // Denormalized Head Info on Token (for Dependency Query Optimization)
                    head_lemma: { type: 'keyword' },
                    head_upos: { type: 'keyword' }
                }
            },
            meta_year: { type: 'integer' },
            meta_genre: { type: 'keyword' },
            meta_author: { type: 'keyword' }
        }
    }
};

async function createIndex() {
    console.log(`Checking if index ${indexName} exists...`);
    const exists = await client.indices.exists({ index: indexName });

    if (exists.body) {
        console.log(`Index ${indexName} exists. Deleting...`);
        await client.indices.delete({ index: indexName });
    }

    console.log(`Creating index ${indexName} with optimized mapping...`);
    await client.indices.create({
        index: indexName,
        body: INDEX_SETTINGS
    });

    console.log(`Index ${indexName} created successfully.`);

    console.log(`Creating alias 'corpus_read' for ${indexName}...`);
    await client.indices.putAlias({ index: indexName, name: 'corpus_read' });
    console.log(`Alias 'corpus_read' created.`);
}

if (require.main === module) {
    createIndex().catch(console.error);
}
