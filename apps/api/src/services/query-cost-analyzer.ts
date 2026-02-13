import {
    CorpusQuery,
    TokenQueryElement,
    SequenceQuery,
    DependencyQueryElement
} from '@corpus/types';

export class QueryCostAnalyzer {

    // Configurable weights
    private readonly WEIGHTS = {
        TOKEN: 1,
        SEQUENCE: 5,
        DEPENDENCY: 5,
        REGEX: 10,
        BASE_TIMEOUT_MS: 2000,
        SCORE_TIMEOUT_MULTIPLIER_MS: 100,
        MAX_TIMEOUT_MS: 30000
    };

    /**
     * Calculates the complexity score of a query.
     * Higher score = more expensive.
     */
    public calculateScore(q: CorpusQuery): number {
        let score = 0;

        // Base cost for pagination depth
        if (q.pagination?.from) {
            score += Math.floor(q.pagination.from / 100);
        }

        score += this.analyzeElement(q.query);
        return score;
    }

    /**
     * Calculates an adaptive timeout based on complexity score.
     */
    public calculateTimeout(score: number): number {
        const timeout = this.WEIGHTS.BASE_TIMEOUT_MS + (score * this.WEIGHTS.SCORE_TIMEOUT_MULTIPLIER_MS);
        return Math.min(timeout, this.WEIGHTS.MAX_TIMEOUT_MS);
    }

    private analyzeElement(el: TokenQueryElement | SequenceQuery | DependencyQueryElement): number {
        let cost = 0;

        switch (el.type) {
            case 'sequence':
                cost += this.WEIGHTS.SEQUENCE;
                const seq = el as SequenceQuery;
                // Sequences are expensive if they are long or contain expensive elements
                cost += seq.elements.reduce((acc, e) => acc + this.analyzeElement(e), 0);
                break;

            case 'dependency':
                cost += this.WEIGHTS.DEPENDENCY;
                const dep = el as DependencyQueryElement;
                cost += this.analyzeElement(dep.head);
                cost += this.analyzeElement(dep.dependent);
                break;

            case 'token':
                cost += this.WEIGHTS.TOKEN;
                const tok = el as TokenQueryElement;
                if (tok.form && /^\/.*\/$/.test(tok.form)) {
                    cost += this.WEIGHTS.REGEX;
                    // Penalty for complexity within regex could be added here
                }
                break;
        }

        return cost;
    }
}
