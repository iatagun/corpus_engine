'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Token {
    id: number;
    form: string;
    lemma: string;
    upos: string;
    xpos: string;
    feats: string;
    head: number;
    deprel: string;
    misc: string;
}

interface DocumentData {
    id: string;
    sentence_id: string;
    text: string;
    corpus_id: string;
    tokens: Token[];
    meta_year?: number;
    meta_genre?: string;
    meta_author?: string;
}

export default function DocumentPage() {
    const params = useParams();
    const corpusId = params.corpusId as string;
    const docId = params.docId as string;

    const [data, setData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!corpusId || !docId) return;

        setLoading(true);
        // Assuming API is proxied or CORS allows
        fetch(`http://localhost:3000/corpus/${corpusId}/document/${docId}`)
            .then(res => {
                if (!res.ok) throw new Error('Document not found');
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [corpusId, docId]);

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen pt-20 container text-center">
                <div className="glass-panel p-8 inline-block text-red-400">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error || 'Document not found'}</p>
                    <Link href="/" className="mt-4 inline-block btn-primary">Back to Search</Link>
                </div>
            </div>
        );
    }

    const doc = data!; // Non-null assertion for TS

    return (
        <main className="min-h-screen pt-20 pb-20 px-4">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Minimal Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <Link href="/" className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors">
                        &larr; Back to Search
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        <span className="opacity-50 font-light mr-2">Sentence</span>
                        <span className="font-mono text-indigo-400">{doc.sentence_id}</span>
                    </h1>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                        <span>Corpus: {doc.corpus_id}</span>
                        {doc.meta_year && <span>Year: {doc.meta_year}</span>}
                        {doc.meta_genre && <span>Genre: {doc.meta_genre}</span>}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-12">

                    {/* Full Text - Central & Prominent */}
                    <div className="relative group text-center">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                        <p className="relative text-2xl md:text-4xl leading-relaxed font-serif text-white/90">
                            "{doc.text}"
                        </p>
                    </div>

                    {/* Analysis Table - Clean & Compact */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Linguistic Analysis</h2>
                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-white/5 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Form</th>
                                        <th className="px-4 py-3 font-medium">Lemma</th>
                                        <th className="px-4 py-3 font-medium">UPOS</th>
                                        <th className="px-4 py-3 font-medium">Features</th>
                                        <th className="px-4 py-3 font-medium">DepRel</th>
                                        <th className="px-4 py-3 font-medium text-right">Head</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {doc.tokens.map((token) => (
                                        <tr key={token.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-2 font-bold text-white">{token.form}</td>
                                            <td className="px-4 py-2 text-indigo-300 font-mono text-xs">{token.lemma}</td>
                                            <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono">{token.upos}</span></td>
                                            <td className="px-4 py-2 text-gray-500 text-xs break-all max-w-[200px] font-mono">{token.feats === '_' ? '' : token.feats}</td>
                                            <td className="px-4 py-2 text-orange-300 text-xs font-mono">{token.deprel}</td>
                                            <td className="px-4 py-2 text-gray-600 font-mono text-xs text-right group-hover:text-gray-400">{token.head}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Raw JSON - Collapsed/Subtle */}
                    <details className="group">
                        <summary className="cursor-pointer text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors select-none">
                            ▶ VIEW RAW JSON DATA
                        </summary>
                        <div className="mt-4 p-4 rounded-xl bg-black/50 border border-white/5 overflow-auto max-h-[400px]">
                            <pre className="text-xs text-gray-500 font-mono">
                                {JSON.stringify(doc, null, 2)}
                            </pre>
                        </div>
                    </details>

                </div>
            </div>
        </main>
    );
}
