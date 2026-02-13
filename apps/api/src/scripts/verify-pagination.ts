import { Client } from '@opensearch-project/opensearch';
import { QueryBuilder } from '../services/query-builder';
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

async function main() {
    console.log("--- Testing Pagination ---");

    // 1. First Page
    const query1: CorpusQuery = {
        corpus_id: 'corpus_pud_1',
        query: { type: 'token', lemma: 've' }, // Common conjunction
        pagination: { from: 0, size: 2 }
    };

    try {
        const dsl1 = qb.build(query1);
        const res1 = await client.search({ index: 'corpus_read', body: dsl1 });
        const hits1 = res1.body.hits.hits;

        console.log(`Page 1 Hits: ${hits1.length}`);
        hits1.forEach((h: any) => console.log(` - [${h._id}] Sort: ${JSON.stringify(h.sort)}`));

        if (hits1.length < 2) {
            console.log("Not enough hits to test pagination.");
            return;
        }

        const lastSort = hits1[hits1.length - 1].sort;
        console.log(`\nCursor for Page 2: ${JSON.stringify(lastSort)}`);

        // 2. Second Page (using cursor)
        const query2: CorpusQuery = {
            corpus_id: 'corpus_pud_1',
            query: { type: 'token', lemma: 've' },
            pagination: {
                from: 0,
                size: 2,
                sort: lastSort
            }
        };

        const dsl2 = qb.build(query2);
        // console.log("DSL Page 2:", JSON.stringify(dsl2, null, 2));

        const res2 = await client.search({ index: 'corpus_read', body: dsl2 });
        const hits2 = res2.body.hits.hits;

        console.log(`\nPage 2 Hits: ${hits2.length}`);
        hits2.forEach((h: any) => console.log(` - [${h._id}] Sort: ${JSON.stringify(h.sort)}`));

        // Validation
        if (hits1[0]._id !== hits2[0]._id) {
            console.log("\nSUCCESS: Page 2 is different from Page 1.");
        } else {
            console.error("\nFAIL: Page 2 duplicates Page 1.");
        }

    } catch (e) {
        console.error(e);
    }
}

main();
