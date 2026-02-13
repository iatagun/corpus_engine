import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import Redis from 'ioredis';
import { Registry, Counter, Histogram } from 'prom-client';
import { searchRoutes } from './routes/search.js';
import { documentRoutes } from './routes/document.js';
import { Client } from '@opensearch-project/opensearch';

// 1. Prometheus Metrics Configuration
const register = new Registry();
const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status']
});
const httpResponseDuration = new Histogram({
    name: 'http_response_duration_seconds',
    help: 'Duration of HTTP responses in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpResponseDuration);

export const buildApp = async (): Promise<FastifyInstance> => {
    const isDev = process.env.NODE_ENV !== 'production';
    const app = Fastify({
        logger: {
            transport: isDev ? {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            } : undefined,
        },
    });

    // 2. Production Security
    await app.register(helmet, {
        contentSecurityPolicy: isDev ? false : undefined, // Disable CSP in dev for easier UI debugging if needed
    });

    await app.register(cors, {
        origin: '*', // For dev
    });

    const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: 1
    });

    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis: redis
    });

    // 3. Metrics Hook
    app.addHook('onResponse', async (request, reply) => {
        const { method, url } = request;
        const status = reply.statusCode.toString();
        const duration = reply.elapsedTime / 1000;

        httpRequestsTotal.inc({ method, path: url, status });
        httpResponseDuration.observe({ method, path: url, status }, duration);
    });

    // 4. Health & Readiness
    app.get('/health', async () => {
        return {
            status: 'ok',
            version: '1.0.0',
            uptime: process.uptime()
        };
    });

    const osClient = new Client({
        node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
        auth: {
            username: process.env.OPENSEARCH_USERNAME || 'admin',
            password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
        },
        ssl: { rejectUnauthorized: false },
    });

    app.get('/ready', async (request, reply) => {
        try {
            // Check Redis
            await redis.ping();
            // Check OpenSearch
            await osClient.info();
            return { status: 'ready', dependencies: { redis: 'up', opensearch: 'up' } };
        } catch (err: any) {
            app.log.error({ msg: 'Readiness Check Failed', error: err.message });
            return reply.code(503).send({
                status: 'not_ready',
                error: 'Dependency unreachable',
                details: isDev ? err.message : undefined
            });
        }
    });

    app.get('/metrics', async (request, reply) => {
        reply.header('Content-Type', register.contentType);
        return await register.metrics();
    });

    // 5. Root Route
    app.get('/', async () => {
        return {
            service: 'Corpus Engine API',
            version: '1.0.0',
            endpoints: {
                health: 'GET /health',
                ready: 'GET /ready',
                metrics: 'GET /metrics',
                search_info: 'GET /search',
                search_query: 'POST /search'
            }
        };
    });

    // Register Routes
    app.register(searchRoutes);
    app.register(documentRoutes);

    return app;
};
