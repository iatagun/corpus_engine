'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchBox } from '@/components/features/search/SearchBox';
import { ResultsList } from '@/components/features/search/ResultsList';
import Link from 'next/link';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const initialType = searchParams.get('type') || 'lemma'; // 'lemma' | 'exact'
    const initialGenre = searchParams.get('genre') || '';
    const initialYear = searchParams.get('year') || '';

    const [results, setResults] = useState<any[]>([]);
    const [aggregations, setAggregations] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [stats, setStats] = useState({ total: 0, took: 0 });
    const [lastSort, setLastSort] = useState<any[] | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Effect for INITIAL search only when params change
    useEffect(() => {
        if (!initialQuery) return;

        // Reset state for new query
        setResults([]);
        setLastSort(null);
        setHasSearched(true);
        loadResults(true);
    }, [initialQuery, initialType, initialGenre, initialYear]);

    const loadResults = async (isInitial: boolean = false) => {
        const isLoadMore = !isInitial;
        if (isLoadMore && !lastSort && results.length > 0) return; // Prevent loading more if no lastSort and results already exist

        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        try {
            const queryBody: any = { type: 'token' };
            if (initialType === 'exact') {
                queryBody.form = initialQuery;
            } else {
                queryBody.lemma = initialQuery;
            }

            const filters: any = {};
            if (initialGenre) filters.genre = [initialGenre];
            if (initialYear) filters.year = { gte: parseInt(initialYear), lte: parseInt(initialYear) };

            const body: any = {
                corpus_id: 'corpus_pud_1',
                query: queryBody,
                filters: filters,
                pagination: { size: 20 }
            };

            if (isLoadMore && lastSort) {
                body.pagination.sort = lastSort;
            }

            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            const newHits = data.hits || [];

            if (isInitial) {
                setResults(newHits);
                setStats({ total: data.total || 0, took: data.took || 0 });
                setAggregations(data.aggregations);
            } else {
                setResults(prev => [...prev, ...newHits]);
            }

            // Update lastSort for next page
            if (newHits.length > 0) {
                setLastSort(newHits[newHits.length - 1].sort);
            } else {
                setLastSort(null); // End of results
            }

        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            if (isInitial) setLoading(false);
            else setLoadingMore(false);
        }
    };

    const handleSearch = (val: string) => {
        router.push(`/search?q=${encodeURIComponent(val)}&type=${initialType}`);
    };

    const toggleType = (newType: string) => {
        if (newType === initialType) return;
        updateParams({ type: newType });
    };

    const updateParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) params.delete(key);
            else params.set(key, value);
        });
        router.push(`/search?${params.toString()}`);
    };

    return (
        <main className="min-h-screen px-4 pb-20">
            {/* Header: Centered Logo & Search */}
            <div className="pt-8 pb-6 flex flex-col items-center gap-6 sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50">
                <Link href="/" className="group flex items-center justify-center gap-3 decoration-none hover:opacity-80 transition-opacity">
                    <div className="text-2xl font-black tracking-tighter text-white">
                        Corpus<span className="text-white/40 font-light">Engine</span>
                    </div>
                </Link>

                <div className="w-full max-w-lg space-y-3">
                    <SearchBox initialValue={initialQuery} onSearch={handleSearch} />

                    {/* Search Type Toggles - Ultra Minimal */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => toggleType('lemma')}
                            className={`text-xs font-mono tracking-widest uppercase transition-all ${initialType === 'lemma' ? 'text-indigo-400 font-bold border-b border-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            Lemma
                        </button>
                        <button
                            onClick={() => toggleType('exact')}
                            className={`text-xs font-mono tracking-widest uppercase transition-all ${initialType === 'exact' ? 'text-indigo-400 font-bold border-b border-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            Exact Form
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Container */}
            <div className="max-w-4xl mx-auto mt-8 space-y-4">
                {/* Stats Line & Filter Toggle */}
                {!loading && hasSearched && (
                    <div className="flex justify-between items-end px-2 pb-2 border-b border-white/5">
                        <div className="text-xs font-mono text-gray-500">
                            <span>{stats.total.toLocaleString()} matches</span>
                            <span className="ml-4">{stats.took}ms</span>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`text-xs font-mono uppercase tracking-widest hover:text-white transition-colors ${showFilters || initialGenre || initialYear ? 'text-indigo-400' : 'text-gray-500'}`}
                        >
                            {(initialGenre || initialYear) ? 'Filters Active' : 'Filters'} {showFilters ? '[-]' : '[+]'}
                        </button>
                    </div>
                )}

                {/* Filter Panel */}
                {showFilters && aggregations && (
                    <div className="glass-panel p-6 animate-fade-in space-y-6">
                        {/* Selected Filters (Active) */}
                        {(initialGenre || initialYear) && (
                            <div className="flex gap-2 flex-wrap pb-4 border-b border-white/5">
                                {initialGenre && (
                                    <span
                                        onClick={() => updateParams({ genre: null })}
                                        className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                    >
                                        Genre: {initialGenre} ✕
                                    </span>
                                )}
                                {initialYear && (
                                    <span
                                        onClick={() => updateParams({ year: null })}
                                        className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-mono cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                    >
                                        Year: {initialYear} ✕
                                    </span>
                                )}
                                <span
                                    onClick={() => updateParams({ genre: null, year: null })}
                                    className="px-2 py-1 text-gray-500 text-xs font-mono cursor-pointer hover:text-white transition-colors underline decoration-dotted"
                                >
                                    Clear All
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Genres */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Genre</h3>
                                <div className="flex flex-wrap gap-2">
                                    {aggregations.genres?.buckets?.map((bucket: any) => (
                                        <button
                                            key={bucket.key}
                                            onClick={() => updateParams({ genre: bucket.key })}
                                            className={`px-2 py-1 rounded text-xs transition-colors border ${initialGenre === bucket.key ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:border-white/10'}`}
                                        >
                                            {bucket.key} <span className="opacity-50 ml-1">({bucket.doc_count})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Years */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Year</h3>
                                <div className="flex flex-wrap gap-2">
                                    {aggregations.years?.buckets?.map((bucket: any) => (
                                        <button
                                            key={bucket.key}
                                            onClick={() => updateParams({ year: bucket.key.toString() })}
                                            className={`px-2 py-1 rounded text-xs transition-colors border ${initialYear === bucket.key.toString() ? 'bg-sky-500 text-white border-sky-500' : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:border-white/10'}`}
                                        >
                                            {bucket.key} <span className="opacity-50 ml-1">({bucket.doc_count})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ResultsList results={results} isLoading={loading} corpusId="corpus_pud_1" />

                {/* Load More / Footer */}
                {!loading && results.length > 0 && results.length < stats.total && (
                    <div className="text-center py-8">
                        <button
                            onClick={() => loadResults(false)}
                            disabled={loadingMore}
                            className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-all disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading...' : 'Load More Results'}
                        </button>
                    </div>
                )}

                {!loading && results.length > 0 && results.length >= stats.total && (
                    <div className="text-center py-10 opacity-30 text-xs font-mono">
                        End of results
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Loading search...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
