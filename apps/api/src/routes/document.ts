import { FastifyInstance } from 'fastify';
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

interface DocumentParams {
    corpusId: string;
    docId: string;
}

export async function documentRoutes(app: FastifyInstance) {
    app.get<{ Params: DocumentParams }>('/corpus/:corpusId/document/:docId', async (request, reply) => {
        const { corpusId, docId } = request.params;

        try {
            // We search by _id. corpusId is used to verify the document belongs to the corpus
            // or effectively we just get by ID if ID is unique across indices (which they are in single index).
            // But we can filter by corpus_id to be safe.

            const result = await client.get({
                index: 'corpus_read',
                id: docId
            });

            if (!result.body.found) {
                return reply.code(404).send({ error: 'Document not found' });
            }

            const source = result.body._source as any;

            // Optional: Check if corpus_id matches
            if (source.corpus_id !== corpusId) {
                // If it doesn't match, technically it's not "in" this corpus view, 
                // but since IDs are unique, we might just return it or 404. 
                // Let's return 404 to be strict.
                return reply.code(404).send({ error: 'Document not found in this corpus' });
            }

            request.log.info({ msg: 'Document Fetched', docId, corpusId });

            return {
                id: result.body._id,
                ...source
            };

        } catch (error: any) {
            request.log.error({ msg: 'Document Fetch Failed', error });
            if (error.meta && error.meta.statusCode === 404) {
                return reply.code(404).send({ error: 'Document not found' });
            }
            return reply.code(500).send({ error: 'Failed to fetch document' });
        }
    });
}
