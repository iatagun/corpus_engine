import {
    CorpusQuery,
    TokenQueryElement,
    SequenceQuery,
    DependencyQueryElement,
    QueryElementType
} from '@corpus/types';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class QueryValidator {

    private readonly MAX_DEPTH = 5;
    private readonly MAX_SEQUENCE_LENGTH = 10;
    private readonly MAX_REGEX_LENGTH = 50;

    public validate(q: CorpusQuery): void {
        // 1. Pagination Limit
        if (q.pagination && q.pagination.size > 100) {
            throw new ValidationError("Pagination size exceeds limit (100). Use search_after for deep pagination.");
        }

        // 2. Query Complexity Analysis
        this.validateElement(q.query, 0);
    }

    private validateElement(el: TokenQueryElement | SequenceQuery | DependencyQueryElement, depth: number) {
        if (depth > this.MAX_DEPTH) {
            throw new ValidationError(`Query is too complex (max depth ${this.MAX_DEPTH})`);
        }

        switch (el.type) {
            case 'sequence':
                this.validateSequence(el as SequenceQuery, depth);
                break;
            case 'dependency':
                this.validateDependency(el as DependencyQueryElement, depth);
                break;
            case 'token':
                this.validateToken(el as TokenQueryElement);
                break;
            default:
                throw new ValidationError(`Unknown query element type: ${(el as any).type}`);
        }
    }

    private validateSequence(seq: SequenceQuery, depth: number) {
        if (seq.elements.length > this.MAX_SEQUENCE_LENGTH) {
            throw new ValidationError(`Sequence too long (max ${this.MAX_SEQUENCE_LENGTH} tokens)`);
        }
        seq.elements.forEach(e => this.validateElement(e, depth + 1));
    }

    private validateDependency(dep: DependencyQueryElement, depth: number) {
        this.validateElement(dep.head, depth + 1);
        this.validateElement(dep.dependent, depth + 1);
    }

    private validateToken(tok: TokenQueryElement) {
        // Regex Safety Check
        if (tok.form && tok.form.startsWith('/') && tok.form.endsWith('/')) {
            const regexBody = tok.form.slice(1, -1);

            // 1. Length Check
            if (regexBody.length > this.MAX_REGEX_LENGTH) {
                throw new ValidationError(`Regex pattern too long (max ${this.MAX_REGEX_LENGTH} chars).`);
            }

            // 2. Leading Wildcards (Performance killer)
            if (regexBody.startsWith('.*') || regexBody.startsWith('.+')) {
                throw new ValidationError("Dangerous regex: Leading wildcards (.* or .+) are not allowed.");
            }

            // 3. Min Length
            if (regexBody.length < 2) {
                throw new ValidationError("Regex too short. Must be at least 2 characters.");
            }

            // 4. Catastrophic Backtracking Heuristic (Simple)
            // Avoid nested quantifiers like (a+)+
            if (/\([^)]+\+.*\)\+/.test(regexBody) || /\([^)]+\*.*\)\*/.test(regexBody)) {
                throw new ValidationError("Dangerous regex: Potential catastrophic backtracking detected.");
            }
        }
    }
}
