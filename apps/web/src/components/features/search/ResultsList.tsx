import { Card } from '@/components/ui/Card';
import { KWICRow } from './KWICRow';

interface Result {
    sentence_id: string;
    text: string;
    snippet: string;
    score: number;
    tokens?: any[]; // Full tokens
    matches?: any[];
    corpus_id?: string; // Add corpus_id
}

interface ResultsListProps {
    results: Result[];
    isLoading?: boolean;
    corpusId?: string; // Fallback or global context
}

export function ResultsList({ results, isLoading, corpusId }: ResultsListProps) {
    if (isLoading && results.length === 0) {
        return <div className="text-center p-8 text-white/50 animate-pulse">Searching the corpus...</div>;
    }

    if (!isLoading && results.length === 0) {
        return <div className="text-center p-8 text-white/50">No results found.</div>;
    }

    return (
        <div className="space-y-2">
            {results.map((result) => (
                <Card key={result.sentence_id} className="p-0 overflow-visible transition-colors hover:bg-white/5">
                    {result.tokens ? (
                        <KWICRow
                            tokens={result.tokens}
                            matches={result.matches || []}
                            sentenceId={result.sentence_id}
                            corpusId={result.corpus_id || corpusId || 'unknown'}
                        />
                    ) : (
                        <div
                            className="p-4 text-lg leading-relaxed text-gray-200"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                    )}
                </Card>
            ))}
            {isLoading && (
                <div className="text-center p-4 text-white/30 text-sm">Loading more...</div>
            )}
        </div>
    );
}
