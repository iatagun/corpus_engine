import { Sentence } from '@corpus/types';
export declare class ConlluStreamParser {
    private filePath;
    private corpusId;
    private docId;
    constructor(filePath: string, corpusId: string, docId: string);
    parse(): AsyncIterableIterator<Sentence>;
    private buildSentence;
}
//# sourceMappingURL=conllu-parser.d.ts.map