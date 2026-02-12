import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { searchRoutes } from './routes/search';

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

    // Register Routes
    app.register(searchRoutes);

    return app;
};
