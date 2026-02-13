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

        const osQuery: any = {
            query: { bool: boolQuery },
            size: q.pagination?.size || 20,
            from: q.pagination?.from || 0,
            sort: [
                { _score: "desc" },
                { sentence_id: "asc" } // Tie-breaker for deterministic sorting
            ],
            aggs: {
                genres: {
                    terms: { field: "meta_genre", size: 20 }
                },
                years: {
                    terms: { field: "meta_year", size: 50, order: { _key: "desc" } }
                }
            }
        };

        if (q.pagination?.sort) {
            osQuery.search_after = q.pagination.sort;
            osQuery.from = 0; // search_after should be used with from=0
            osQuery.track_total_hits = true;
        }

        return osQuery;
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

    private buildTokenQuery(token: TokenQueryElement, index?: number): any {
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

        const hitName = index !== undefined ? `token_${index}` : 'tokens';

        return {
            nested: {
                path: 'tokens',
                query: { bool: nestedBool },
                inner_hits: { name: hitName, size: 100 } // Return matched tokens for highlighting/verification
            }
        };
    }

    // Strategy: For sequences, we first strictly require ALL elements to be present in the sentence.
    // The precise ordering check is done in the "rescore" phase or client-side for MVE.
    // Ideally, we would use a `span` query here if tokens were not nested, or a script.
    private buildSequenceQuery(seq: SequenceQuery): any {
        const mustClauses = seq.elements.map((el, idx) => this.buildTokenQuery(el, idx));

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
