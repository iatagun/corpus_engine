
import { Client } from '@opensearch-project/opensearch';
import { ConlluStreamParser } from '@corpus/utils/src/conllu-parser';
import { Sentence } from '@corpus/types';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export class BulkIndexer {
    private client: Client;
    private indexName: string;
    private batchSize = 2000;

    constructor(targetIndexName: string = 'corpus_sentences_v1') {
        this.indexName = targetIndexName;
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

        // @ts-ignore
        for await (const sentence of parser.parse()) {
            batch.push(sentence);

            if (batch.length >= this.batchSize) {
                await this.flushBatch(batch, corpusId);
                processedCount += batch.length;
                batch = [];
                this.logProgress(processedCount, start);
            }
        }

        if (batch.length > 0) {
            await this.flushBatch(batch, corpusId);
            processedCount += batch.length;
        }

        console.log(`Ingestion complete! Total Sentences: ${processedCount} in ${(Date.now() - start) / 1000}s`);
    }

    private async flushBatch(sentences: Sentence[], corpusId: string) {
        const body = sentences.flatMap(doc => {
            const uniqueLemmas = new Set<string>();
            const uniqueUpos = new Set<string>();
            const uniqueFeats = new Set<string>();

            const tokenMap = new Map(doc.tokens.map(t => [t.id, t]));

            const enrichedTokens = doc.tokens.map(t => {
                if (t.lemma) uniqueLemmas.add(t.lemma);
                if (t.upos) uniqueUpos.add(t.upos);
                if (t.feats && t.feats !== '_') {
                    t.feats.split('|').forEach(f => uniqueFeats.add(f));
                }

                let headLemma = null;
                let headUpos = null;
                if (t.head && t.head !== 0) {
                    const headToken = tokenMap.get(t.head);
                    if (headToken) {
                        headLemma = headToken.lemma;
                        headUpos = headToken.upos;
                    }
                }

                return { ...t, head_lemma: headLemma, head_upos: headUpos };
            });

            // Sanitize doc to remove old fields that might be in ...doc
            const { has_lemmas, has_pos, ...cleanDoc } = doc as any;

            return [
                { index: { _index: this.indexName, _id: doc.sentence_id } },
                {
                    ...cleanDoc,
                    corpus_id: corpusId,
                    tokens: enrichedTokens,
                    // FIX: Use singular field names to match mapping
                    has_lemma: Array.from(uniqueLemmas),
                    has_upos: Array.from(uniqueUpos),
                    has_feats: Array.from(uniqueFeats)
                },
            ];
        });

        try {
            const response = await this.client.bulk({ body });
            if (response.body.errors) {
                const erroredDocuments: any[] = [];
                response.body.items.forEach((item: any, i: number) => {
                    if (item.index && item.index.error) {
                        erroredDocuments.push({ status: item.index.status, error: item.index.error, docId: sentences[i].sentence_id });
                    }
                });
                console.error('Bulk errors:', JSON.stringify(erroredDocuments.slice(0, 3), null, 2));
            }
        } catch (error) {
            console.error('Critical Bulk Error:', error);
            throw error;
        }
    }

    private logProgress(count: number, start: number) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = Math.round(count / elapsed);
        console.log(`Processed ${count} sentences. Rate: ${rate} sent/sec`);
    }
}

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
