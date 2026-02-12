import { Client } from '@opensearch-project/opensearch';
import { ConlluStreamParser } from '@corpus/utils/src/conllu-parser'; // Uses path mapping now
import { Sentence } from '@corpus/types';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export class BulkIndexer {
    private client: Client;
    private indexName = 'corpus_sentences_v1';
    private batchSize = 2000;

    constructor() {
        this.client = new Client({
            node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
            auth: {
                username: process.env.OPENSEARCH_USERNAME || 'admin',
                password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
            },
            ssl: { rejectUnauthorized: false },
        });
    }

    async processFile(filePath: string, corpusId: string, docId: string) {
        console.log(`Starting ingestion for ${filePath}...`);
        const parser = new ConlluStreamParser(filePath, corpusId, docId);

        let batch: Sentence[] = [];
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

    private async flushBatch(sentences: Sentence[], corpusId: string) {
        const body = sentences.flatMap(doc => [
            { index: { _index: this.indexName, _id: doc.sentence_id } },
            { ...doc, corpus_id: corpusId }, // Inject corpus_id
        ]);

        try {
            const response = await this.client.bulk({ body });
            if (response.body.errors) {
                const erroredDocuments: any[] = [];
                // Extract error details (simplified)
                response.body.items.forEach((item: any, i: number) => {
                    if (item.index && item.index.error) {
                        erroredDocuments.push({ status: item.index.status, error: item.index.error, docId: sentences[i].sentence_id });
                    }
                });
                console.error('Bulk errors:', JSON.stringify(erroredDocuments.slice(0, 3), null, 2));
            }
        } catch (error) {
            console.error('Critical Bulk Error:', error);
            throw error; // Retry logic usually goes here (BullMQ)
        }
    }

    private logProgress(count: number, start: number) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = Math.round(count / elapsed);
        console.log(`Processed ${count} sentences. Rate: ${rate} sent/sec`);
    }
}

// CLI Execution if called directly
if (require.main === module) {
    const [, , file, corpusId, docId] = process.argv;
    if (!file || !corpusId) {
        console.error('Usage: ts-node src/ingestor.ts <file> <corpusId> [docId]');
        process.exit(1);
    }

    const indexer = new BulkIndexer();
    indexer.processFile(file, corpusId, docId || path.basename(file))
        .then(() => process.exit(0))
        .catch(e => { console.error(e); process.exit(1); });
}
