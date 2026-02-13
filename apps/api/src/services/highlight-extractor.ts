import { Sentence, Token } from '@corpus/types';

export class HighlightExtractor {

    /**
     * Generates a KWIC (Key Word in Context) snippet.
     * @param source The full sentence source object.
     * @param innerHits The inner_hits from OpenSearch response.
     * @param contextSize Number of tokens to show before and after the match.
     */
    public generate(source: Sentence, innerHits: any, contextSize: number = 7): string {
        if (!innerHits || !source.tokens) {
            return source.text || '';
        }

        // 1. Identify Matched Token IDs
        // inner_hits can be from 'tokens' (token query) or nested (dependency)
        const matchedIds = new Set<number>();

        // Helper to traverse inner_hits structure
        const collectIds = (hits: any) => {
            if (hits?.hits?.hits) {
                hits.hits.hits.forEach((h: any) => {
                    const src = h._source as Token;
                    if (src && src.id) matchedIds.add(src.id);
                });
            }
        };

        // Iterate over all keys in innerHits (e.g. tokens, token_0, token_1)
        Object.values(innerHits).forEach((hitGroup) => collectIds(hitGroup));

        // If no specific tokens matched (e.g. pure metadata query), return full text
        if (matchedIds.size === 0) return source.text;

        // 2. Determine Window (Center around the first match group)
        const sortedIds = Array.from(matchedIds).sort((a, b) => a - b);
        const minId = sortedIds[0];
        const maxId = sortedIds[sortedIds.length - 1];

        // Try to center the window around the match cluster
        // For now, simpler approach: Start from (MinId - context) to (MaxId + context)
        const userMinIdx = Math.max(0, minId - 1 - contextSize);
        const userMaxIdx = Math.min(source.tokens.length - 1, maxId - 1 + contextSize);

        // 3. Reconstruct Snippet
        const snippetTokens = source.tokens.slice(userMinIdx, userMaxIdx + 1).map(t => {
            // Highlight if ID is in matched set
            if (matchedIds.has(t.id)) {
                return `<mark>${t.form}</mark>`;
            }
            return t.form;
        });

        let snippet = snippetTokens.join(' ');

        // Add ellipses if truncated
        if (userMinIdx > 0) snippet = '... ' + snippet;
        if (userMaxIdx < source.tokens.length - 1) snippet = snippet + ' ...';

        return snippet;
    }
}
