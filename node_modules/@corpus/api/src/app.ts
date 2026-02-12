import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { searchRoutes } from './routes/search.js';

export const buildApp = async (): Promise<FastifyInstance> => {
    const app = Fastify({
        logger: true,
    });

    await app.register(cors, {
        origin: '*', // For dev
    });

    // Health Check
    app.get('/health', async () => {
        return { status: 'ok' };
    });

    // Root Route
    app.get('/', async () => {
        return {
            service: 'Corpus Engine API',
            version: '1.0.0',
            endpoints: {
                health: 'GET /health',
                search_info: 'GET /search',
                search_query: 'POST /search'
            }
        };
    });

    // Register Routes
    app.register(searchRoutes);

    return app;
};
