export interface Token {
    id: number;
    form: string;
    lemma: string;
    upos: string;
    xpos: string;
    feats: string;
    head: number;
    deprel: string;
    misc: string;
    head_lemma?: string;
    head_upos?: string;
}
export interface Sentence {
    sentence_id: string;
    sentence_seq: number;
    text: string;
    tokens: Token[];
    has_lemmas?: string[];
    has_pos?: string[];
}
export interface CorpusDocument {
    document_id: string;
    corpus_id: string;
    meta: Record<string, any>;
    sentences: Sentence[];
}
export interface QueryFilter {
    year?: {
        gte?: number;
        lte?: number;
    };
    genre?: string[];
    author?: string[];
}
export type QueryElementType = 'token' | 'sequence' | 'dependency';
export interface TokenQueryElement {
    type: 'token';
    form?: string;
    lemma?: string;
    upos?: string;
    xpos?: string;
    feats?: Record<string, string>;
    optional?: boolean;
}
export interface DependencyQueryElement {
    type: 'dependency';
    relation: string;
    head: TokenQueryElement;
    dependent: TokenQueryElement;
}
export interface SequenceQuery {
    type: 'sequence';
    elements: TokenQueryElement[];
    slop?: number;
    inOrder?: boolean;
}
export interface CorpusQuery {
    corpus_id: string;
    filters?: QueryFilter;
    query: TokenQueryElement | SequenceQuery | DependencyQueryElement;
    pagination?: {
        from: number;
        size: number;
    };
}
//# sourceMappingURL=index.d.ts.map