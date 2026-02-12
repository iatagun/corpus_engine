"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const opensearch_1 = require("@opensearch-project/opensearch");
const query_builder_1 = require("../services/query-builder");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new opensearch_1.Client({
    node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
    },
    ssl: { rejectUnauthorized: false },
});
const qb = new query_builder_1.QueryBuilder();
const INDEX = 'corpus_sentences_v1';
async function runTest(name, query, expectedValidator) {
    console.log(`\n--- Test: ${name} ---`);
    try {
        const body = qb.build(query);
        const result = await client.search({ index: INDEX, body });
        const hits = result.body.hits.hits;
        if (expectedValidator(hits)) {
            console.log('✅ PASSED');
        }
        else {
            console.error('❌ FAILED');
            console.log('Hits:', JSON.stringify(hits.map((h) => h._source.text), null, 2));
        }
    }
    catch (e) {
        console.error('❌ ERROR:', e);
    }
}
async function main() {
    // 1. Lemma Search
    await runTest('Lemma Search (run)', {
        corpus_id: 'corpus_synth_1',
        query: { type: 'token', lemma: 'run' }
    }, (hits) => hits.length > 0 && hits.some(h => h._source.text.includes('run') || h._source.text.includes('ran')));
    // 2. Sequence Search (Needle)
    // "The complex system fails debug"
    await runTest('Sequence: complex system', {
        corpus_id: 'corpus_synth_1',
        query: {
            type: 'sequence',
            elements: [
                { type: 'token', lemma: 'complex' },
                { type: 'token', lemma: 'system' }
            ]
        }
    }, (hits) => hits.length > 0 && hits[0]._source.text.includes('complex system'));
    // 3. Dependency Search (Denormalized)
    // Find NOUN which is nsubj of VERB 'fail'
    await runTest('Dependency: nsubj of fail', {
        corpus_id: 'corpus_synth_1',
        query: {
            type: 'dependency',
            relation: 'nsubj',
            head: { type: 'token', lemma: 'fail', upos: 'VERB' },
            dependent: { type: 'token', upos: 'NOUN' }
        }
    }, (hits) => hits.length > 0 && hits[0]._source.text.includes('system fails')); // system is nsubj of fails
    console.log('\nFunctional Tests Complete.');
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=functional-test.js.map