import { Client } from '@opensearch-project/opensearch';
import { QueryBuilder } from '../services/query-builder';
import { HighlightExtractor } from '../services/highlight-extractor';
import { CorpusQuery } from '@corpus/types';
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

const qb = new QueryBuilder();
const highlighter = new HighlightExtractor();

async function main() {
    const query: CorpusQuery = {
        corpus_id: 'corpus_synth_1',
        query: {
            type: 'sequence',
            elements: [
                { type: 'token', lemma: 'complex' },
                { type: 'token', lemma: 'system' }
            ]
        }
    };

    const dsl = qb.build(query);
    console.log("DSL:", JSON.stringify(dsl, null, 2));

    try {
        const result = await client.search({
            index: 'corpus_sentences_v1',
            body: dsl
        });

        const hit = result.body.hits.hits[0];
        if (!hit) {
            console.error("No hits found!");
            return;
        }

        console.log("Raw Inner Hits Keys:", Object.keys(hit.inner_hits || {}));
        // Check if we have 'tokens' or multiple keys

        // Test Extractor
        const snippet = highlighter.generate(hit._source, hit.inner_hits);
        console.log("\n--- KWIC Snippet ---");
        console.log(snippet);
        console.log("--------------------");

        // Print full text for comparison
        console.log("Full Text:", hit._source.text);

    } catch (e: any) {
        if (e.meta && e.meta.body) {
            console.error("OpenSearch Error Body:", JSON.stringify(e.meta.body, null, 2));
        } else {
            console.error(e);
        }
    }
}

if (require.main === module) {
    main();
}
