// Core Linguistic Types

export interface Token {
    id: number; // 1-based index in sentence
    form: string;
    lemma: string;
    upos: string;
    xpos: string;
    feats: string; // "Case=Nom|Number=Sing"
    head: number;
    deprel: string;
    misc: string;

    // Computed/Denormalized fields for simple search
    head_lemma?: string;
    head_upos?: string;
}

export interface Sentence {
    sentence_id: string; // Unique ID (hash or file_pos)
    sentence_seq: number; // Sequence number in document
    text: string; // Reconstructed text or raw text
    tokens: Token[];

    // Flattened metadata for fast filtering
    has_lemmas?: string[];
    has_pos?: string[];
}

export interface CorpusDocument {
    document_id: string;
    corpus_id: string;
    meta: Record<string, any>; // { author: "Orwell", year: 1984 }
    sentences: Sentence[];
}
// Query DSL Types

export interface QueryFilter {
    year?: { gte?: number; lte?: number };
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
    feats?: Record<string, string>; // { Case: "Nom" }
    optional?: boolean; // For sequences
}

export interface DependencyQueryElement {
    type: 'dependency';
    relation: string; // "nsubj"
    head: TokenQueryElement;
    dependent: TokenQueryElement;
}

export interface SequenceQuery {
    type: 'sequence';
    elements: TokenQueryElement[];
    slop?: number; // Distance
    inOrder?: boolean;
}

export interface CorpusQuery {
    corpus_id: string;
    filters?: QueryFilter;
    query: TokenQueryElement | SequenceQuery | DependencyQueryElement;
    pagination?: { from: number; size: number };
}
