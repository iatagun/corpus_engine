import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
    },
    ssl: {
        rejectUnauthorized: false, // For local dev with self-signed certs or disabled security
    },
});

const INDEX_NAME = 'corpus_sentences_v1';
const ALIAS_NAME = 'corpus_read';

const indexBody = {
    settings: {
        number_of_shards: 1, // Dev setting, increase for prod
        number_of_replicas: 0, // Dev setting
        analysis: {
            analyzer: {
                standard_text: {
                    type: 'standard',
                },
                lowercase_keyword: {
                    tokenizer: 'keyword',
                    filter: ['lowercase'],
                },
            },
        },
    },
    mappings: {
        dynamic: 'strict',
        properties: {
            corpus_id: { type: 'keyword' },
            document_id: { type: 'keyword' },
            sentence_id: { type: 'keyword' },
            sentence_seq: { type: 'integer' },

            // Metadata (Denormalized for fast filtering)
            meta_year: { type: 'integer' },
            meta_genre: { type: 'keyword' },
            meta_author: { type: 'keyword' },

            // Flattened "Bag of Words" for pre-filtering
            text: { type: 'text', analyzer: 'standard_text' },
            has_lemma: { type: 'keyword' },
            has_upos: { type: 'keyword' },
            has_feats: { type: 'keyword' },

            // Nested Tokens
            tokens: {
                type: 'nested',
                properties: {
                    id: { type: 'integer' },
                    form: {
                        type: 'keyword',
                        fields: { text: { type: 'text', analyzer: 'standard_text' } }
                    },
                    lemma: {
                        type: 'keyword',
                        fields: { text: { type: 'text', analyzer: 'standard_text' } }
                    },
                    upos: { type: 'keyword' },
                    xpos: { type: 'keyword' },
                    feats: { type: 'keyword' },
                    head: { type: 'integer' },
                    deprel: { type: 'keyword' },
                    misc: { type: 'keyword' },

                    // Optimization: Pre-computed head relations
                    head_lemma: { type: 'keyword' },
                    head_upos: { type: 'keyword' }
                },
            },
        },
    },
};

async function main() {
    try {
        const exists = await client.indices.exists({ index: INDEX_NAME });

        if (exists.body) {
            console.log(`Index ${INDEX_NAME} already exists.`);
        } else {
            console.log(`Creating index ${INDEX_NAME}...`);
            await client.indices.create({
                index: INDEX_NAME,
                body: indexBody,
            });
            console.log('Index created.');
        }

        // Setup Alias
        const aliasExists = await client.cat.aliases({ name: ALIAS_NAME }, { ignore: [404] });
        if (aliasExists.statusCode === 404 || (aliasExists.body as any[]).length === 0) {
            console.log(`Creating alias ${ALIAS_NAME}...`);
            await client.indices.putAlias({
                index: INDEX_NAME,
                name: ALIAS_NAME
            });
            console.log('Alias created.');
        }

    } catch (error) {
        console.error('Error initializing index:', error);
        process.exit(1);
    }
}

main();
