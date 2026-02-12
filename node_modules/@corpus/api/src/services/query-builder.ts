import {
    CorpusQuery,
    TokenQueryElement,
    SequenceQuery,
    DependencyQueryElement,
    QueryElementType
} from '@corpus/types';

export class QueryBuilder {

    public build(q: CorpusQuery): Record<string, any> {
        const boolQuery: any = {
            must: [],
            filter: [
                { term: { corpus_id: q.corpus_id } }
            ]
        };

        // 1. Metadata Filters
        if (q.filters) {
            if (q.filters.year) {
                boolQuery.filter.push({ range: { meta_year: q.filters.year } });
            }
            if (q.filters.genre && q.filters.genre.length > 0) {
                boolQuery.filter.push({ terms: { meta_genre: q.filters.genre } });
            }
            if (q.filters.author && q.filters.author.length > 0) {
                boolQuery.filter.push({ terms: { meta_author: q.filters.author } });
            }
        }

        // 2. Main Query Logic
        const mainQuery = this.buildElementQuery(q.query);
        boolQuery.must.push(mainQuery);

        return {
            query: { bool: boolQuery },
            size: q.pagination?.size || 20,
            from: q.pagination?.from || 0,
        };
    }

    public validate(q: CorpusQuery): void {
        // 1. Pagination Limit
        if (q.pagination && q.pagination.size > 100) {
            throw new Error("Pagination size exceeds limit (100). Use search_after for deep pagination.");
        }

        // 2. Query Complexity Analysis
        this.validateElement(q.query, 0);
    }

    private validateElement(el: TokenQueryElement | SequenceQuery | DependencyQueryElement, depth: number) {
        if (depth > 5) { // Max nesting depth
            throw new Error("Query is too complex (max depth 5)");
        }

        if (el.type === 'sequence') {
            const seq = el as SequenceQuery;
            if (seq.elements.length > 10) {
                throw new Error("Sequence too long (max 10 tokens)");
            }
            seq.elements.forEach(e => this.validateElement(e, depth + 1));
        } else if (el.type === 'dependency') {
            const dep = el as DependencyQueryElement;
            this.validateElement(dep.head, depth + 1);
            this.validateElement(dep.dependent, depth + 1);
        } else if (el.type === 'token') {
            const tok = el as TokenQueryElement;
            // Regex Safety Check (Basic)
            if (tok.form && tok.form.startsWith('/') && tok.form.endsWith('/')) {
                const regexBody = tok.form.slice(1, -1);
                if (regexBody.startsWith('.*') || regexBody.length < 2) {
                    throw new Error("Dangerous regex detected. Start with specific characters.");
                }
            }
        }
    }

    private buildElementQuery(element: TokenQueryElement | SequenceQuery | DependencyQueryElement): any {
        switch (element.type) {
            case 'token':
                return this.buildTokenQuery(element as TokenQueryElement);
            case 'sequence':
                return this.buildSequenceQuery(element as SequenceQuery);
            case 'dependency':
                return this.buildDependencyQuery(element as DependencyQueryElement);
            default:
                throw new Error(`Unknown query type: ${(element as any).type}`);
        }
    }

    private buildTokenQuery(token: TokenQueryElement): any {
        const nestedBool: any = { must: [] };

        if (token.form) nestedBool.must.push({ term: { "tokens.form": token.form } });
        if (token.lemma) nestedBool.must.push({ term: { "tokens.lemma": token.lemma } });
        if (token.upos) nestedBool.must.push({ term: { "tokens.upos": token.upos } });
        if (token.xpos) nestedBool.must.push({ term: { "tokens.xpos": token.xpos } });

        if (token.feats) {
            for (const [k, v] of Object.entries(token.feats)) {
                nestedBool.must.push({ term: { "tokens.feats": `${k}=${v}` } });
            }
        }

        return {
            nested: {
                path: 'tokens',
                query: { bool: nestedBool },
                inner_hits: { size: 100 } // Return matched tokens for highlighting/verification
            }
        };
    }

    // Strategy: For sequences, we first strictly require ALL elements to be present in the sentence.
    // The precise ordering check is done in the "rescore" phase or client-side for MVE.
    // Ideally, we would use a `span` query here if tokens were not nested, or a script.
    private buildSequenceQuery(seq: SequenceQuery): any {
        const mustClauses = seq.elements.map(el => this.buildTokenQuery(el));

        // Simple AND: Sentence must contain Token A AND Token B ...
        return {
            bool: {
                must: mustClauses
            }
        };
    }

    private buildDependencyQuery(dep: DependencyQueryElement): any {
        // Optimization: We use the denormalized fields on the dependent
        // Dependent has `head_lemma`, `head_upos`, `deprel`.

        const nestedBool: any = { must: [] };

        // 1. Dependent Constraints
        if (dep.dependent.lemma) nestedBool.must.push({ term: { "tokens.lemma": dep.dependent.lemma } });
        if (dep.dependent.upos) nestedBool.must.push({ term: { "tokens.upos": dep.dependent.upos } });

        // 2. Relation Constraint
        nestedBool.must.push({ term: { "tokens.deprel": dep.relation } });

        // 3. Head Constraints (using denormalized fields)
        if (dep.head.lemma) nestedBool.must.push({ term: { "tokens.head_lemma": dep.head.lemma } });
        if (dep.head.upos) nestedBool.must.push({ term: { "tokens.head_upos": dep.head.upos } });

        return {
            nested: {
                path: 'tokens',
                query: { bool: nestedBool },
                inner_hits: {}
            }
        };
    }
}
