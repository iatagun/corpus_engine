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
    // Goal: Find what "Trump" is the subject of.
    // In the corpus: "5	Trump ... 31	nsubj" where head 31 is "açıkladı"
    const query: CorpusQuery = {
        corpus_id: 'corpus_pud_1',
        query: {
            type: 'dependency',
            relation: 'nsubj',
            head: { type: 'token', lemma: 'açıkla' },
            dependent: { type: 'token', form: 'Trump' }
        }
    };

    const dsl = qb.build(query);
    console.log("DSL:", JSON.stringify(dsl, null, 2));

    try {
        const result = await client.search({
            index: 'corpus_sentences_v1',
            body: dsl
        });

        console.log(`Hits: ${result.body.hits.total.value}`);

        const hit = result.body.hits.hits[0];
        if (hit) {
            const snippet = highlighter.generate(hit._source, hit.inner_hits);
            console.log("\n--- Dependency Snippet ---");
            console.log(snippet);
            console.log("--------------------------");
        } else {
            console.log("No hits found for dependency query.");
        }

    } catch (e: any) {
        if (e.meta && e.meta.body) {
            console.error("OS Error:", JSON.stringify(e.meta.body, null, 2));
        } else {
            console.error(e);
        }
    }
}

if (require.main === module) {
    main();
}
