export declare class BulkIndexer {
    private client;
    private indexName;
    private batchSize;
    constructor();
    processFile(filePath: string, corpusId: string, docId: string): Promise<void>;
    private flushBatch;
    private logProgress;
}
//# sourceMappingURL=ingestor.d.ts.map