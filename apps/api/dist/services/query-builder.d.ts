import { CorpusQuery } from '@corpus/types';
export declare class QueryBuilder {
    build(q: CorpusQuery): Record<string, any>;
    validate(q: CorpusQuery): void;
    private validateElement;
    private buildElementQuery;
    private buildTokenQuery;
    private buildSequenceQuery;
    private buildDependencyQuery;
}
//# sourceMappingURL=query-builder.d.ts.map