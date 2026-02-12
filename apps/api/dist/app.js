"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const search_js_1 = require("./routes/search.js");
const buildApp = async () => {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    await app.register(cors_1.default, {
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
    app.register(search_js_1.searchRoutes);
    return app;
};
exports.buildApp = buildApp;
//# sourceMappingURL=app.js.map