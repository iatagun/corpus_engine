import { FastifyInstance } from 'fastify';
import { Client } from '@opensearch-project/opensearch';
import { QueryBuilder } from '../services/query-builder.js';
import { QueryValidator } from '../services/query-validator.js';
import { HighlightExtractor } from '../services/highlight-extractor.js';
import { CorpusQuery } from '@corpus/types';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// 

const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
    },
    ssl: { rejectUnauthorized: false },
});

import { QueryCostAnalyzer } from '../services/query-cost-analyzer.js';
import { SmartQueryCache } from '../services/smart-cache.js';

const queryBuilder = new QueryBuilder();
const queryValidator = new QueryValidator();
const highlightExtractor = new HighlightExtractor();
const queryCostAnalyzer = new QueryCostAnalyzer();
const smartCache = new SmartQueryCache();

export async function searchRoutes(app: FastifyInstance) {
    app.get('/search', async () => {
        return {
            status: 'ok',
            message: 'Use POST /search to query the corpus.',
        };
    });

    app.post<{ Body: CorpusQuery }>('/search', async (request, reply) => {
        const corpusQuery = request.body;

        try {
            // 1. Static Validation (Safety Guards)
            // 
            queryValidator.validate(corpusQuery);

            // 2. Dynamic Cost Analysis (Optimization)
            const costScore = queryCostAnalyzer.calculateScore(corpusQuery);
            // 
            const adaptiveTimeout = queryCostAnalyzer.calculateTimeout(costScore);

            if (costScore > 100) {
                // Reject extremely expensive queries even if they pass static validation
                request.log.warn({ msg: 'Query Rejected: Too Expensive', costScore, query: corpusQuery.query });
                return reply.code(400).send({ error: 'Query too expensive (Complexity Score > 100). Please simplify.' });
            }

            // 3. Smart Caching & Coalescing
            // 
            const { data: finalResponse, cached } = await smartCache.fetchOrGet(corpusQuery, costScore, async () => {
                // 
                // 4. Build & Execute (Only runs if not cached/coalesced)
                const osQuery = queryBuilder.build(corpusQuery);

                const result = await client.search({
                    index: 'corpus_read',
                    body: osQuery,
                }, {
                    requestTimeout: adaptiveTimeout // Transport timeout
                });

                // 5. Response Transformation
                const hits = result.body.hits.hits.map((hit: any) => {
                    const source = hit._source as any;
                    const snippet = highlightExtractor.generate(source, hit.inner_hits);

                    return {
                        sentence_id: hit._id,
                        score: hit._score,
                        sort: hit.sort,
                        text: source.text,
                        tokens: source.tokens,
                        snippet: snippet,
                        matches: hit.inner_hits?.tokens?.hits?.hits.map((t: any) => t._source) || []
                    };
                });

                return {
                    took: result.body.took,
                    total: result.body.hits.total.value,
                    hits: hits,
                    aggregations: result.body.aggregations
                };
            });

            if (cached) {
                request.log.info({ msg: 'Cache/Coalesce Hit', costScore, corpus_id: corpusQuery.corpus_id });
                return { ...finalResponse, cached: true };
            }

            request.log.info({
                msg: 'Search Executed',
                corpus_id: corpusQuery.corpus_id,
                query_type: corpusQuery.query.type,
                cost_score: costScore,
                timeout_limit_ms: adaptiveTimeout,
                took_ms: finalResponse.took,
                total_hits: finalResponse.total,
                hits_returned: finalResponse.hits.length
            });

            return finalResponse;

        } catch (error) {
            request.log.error({ msg: 'Search Failed', error });
            if (error instanceof Error && error.name === 'ValidationError') {
                return reply.code(400).send({ error: error.message });
            }
            // Handle Timeout Errors specifically if needed
            if (error instanceof Error && error.message.includes('Timeout')) {
                return reply.code(504).send({ error: 'Search timed out. Try simplifying your query.' });
            }
            return reply.code(500).send({ error: 'Search execution failed' });
        }
    });
}
