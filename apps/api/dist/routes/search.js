"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRoutes = searchRoutes;
const opensearch_1 = require("@opensearch-project/opensearch");
const query_builder_js_1 = require("../services/query-builder.js");
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
const queryBuilder = new query_builder_js_1.QueryBuilder();
async function searchRoutes(app) {
    app.get('/search', async () => {
        return {
            status: 'ok',
            message: 'Use POST /search to query the corpus.',
            example_body: {
                corpus_id: 'corpus_synth_1',
                query: { type: 'token', lemma: 'run' }
            }
        };
    });
    app.post('/search', async (request, reply) => {
        const corpusQuery = request.body;
        try {
            queryBuilder.validate(corpusQuery); // Validation
            const osQuery = queryBuilder.build(corpusQuery);
            // Execute Search
            const result = await client.search({
                index: 'corpus_sentences_v1', // Should be dynamic based on corpusId alias
                body: osQuery,
            });
            // Basic Response Transformation
            const hits = result.body.hits.hits.map((hit) => ({
                sentence_id: hit._id,
                score: hit._score,
                text: hit._source.text,
                // TODO: Transform inner_hits into KWIC snippets
                matches: hit.inner_hits?.tokens?.hits?.hits.map((t) => t._source) || []
            }));
            return {
                total: result.body.hits.total.value,
                hits: hits,
            };
        }
        catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Search execution failed' });
        }
    });
}
//# sourceMappingURL=search.js.map