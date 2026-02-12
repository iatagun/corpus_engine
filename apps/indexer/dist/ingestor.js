"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkIndexer = void 0;
const opensearch_1 = require("@opensearch-project/opensearch");
const conllu_parser_1 = require("@corpus/utils/src/conllu-parser"); // Uses path mapping now
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
class BulkIndexer {
    client;
    indexName = 'corpus_sentences_v1';
    batchSize = 2000;
    constructor() {
        this.client = new opensearch_1.Client({
            node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
            auth: {
                username: process.env.OPENSEARCH_USERNAME || 'admin',
                password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
            },
            ssl: { rejectUnauthorized: false },
        });
    }
    async processFile(filePath, corpusId, docId) {
        console.log(`Starting ingestion for ${filePath}...`);
        const parser = new conllu_parser_1.ConlluStreamParser(filePath, corpusId, docId);
        let batch = [];
        let processedCount = 0;
        const start = Date.now();
        // Iterate through the async generator
        // @ts-ignore - Parser likely needs fixing to export properly or be compiled
        for await (const sentence of parser.parse()) {
            batch.push(sentence);
            if (batch.length >= this.batchSize) {
                await this.flushBatch(batch, corpusId);
                processedCount += batch.length;
                batch = [];
                this.logProgress(processedCount, start);
            }
        }
        // Flush remaining
        if (batch.length > 0) {
            await this.flushBatch(batch, corpusId);
            processedCount += batch.length;
        }
        console.log(`Ingestion complete! Total Sentences: ${processedCount} in ${(Date.now() - start) / 1000}s`);
    }
    async flushBatch(sentences, corpusId) {
        const body = sentences.flatMap(doc => [
            { index: { _index: this.indexName, _id: doc.sentence_id } },
            doc,
        ]);
        try {
            const response = await this.client.bulk({ body });
            if (response.body.errors) {
                const erroredDocuments = [];
                // Extract error details (simplified)
                response.body.items.forEach((item, i) => {
                    if (item.index && item.index.error) {
                        erroredDocuments.push({ status: item.index.status, error: item.index.error, docId: sentences[i].sentence_id });
                    }
                });
                console.error('Bulk errors:', JSON.stringify(erroredDocuments.slice(0, 3), null, 2));
            }
        }
        catch (error) {
            console.error('Critical Bulk Error:', error);
            throw error; // Retry logic usually goes here (BullMQ)
        }
    }
    logProgress(count, start) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = Math.round(count / elapsed);
        console.log(`Processed ${count} sentences. Rate: ${rate} sent/sec`);
    }
}
exports.BulkIndexer = BulkIndexer;
// CLI Execution if called directly
if (require.main === module) {
    const [, , file, corpusId, docId] = process.argv;
    if (!file || !corpusId) {
        console.error('Usage: ts-node src/ingestor.ts <file> <corpusId> [docId]');
        process.exit(1);
    }
    const indexer = new BulkIndexer();
    indexer.processFile(file, corpusId, docId || path_1.default.basename(file))
        .then(() => process.exit(0))
        .catch(e => { console.error(e); process.exit(1); });
}
//# sourceMappingURL=ingestor.js.map