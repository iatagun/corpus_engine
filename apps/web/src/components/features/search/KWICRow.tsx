import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useState } from 'react';

interface Token {
    id: number;
    form: string;
    lemma: string;
    upos: string;
    feats: string;
    deprel: string;
    misc: string;
}

interface KWICRowProps {
    tokens: Token[];
    matches: Token[];
    sentenceId: string;
    corpusId: string;
}

export function KWICRow({ tokens, matches, sentenceId, corpusId }: KWICRowProps) {
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);

    // 1. Identify "Center" (First match for now)
    const matchIds = new Set(matches.map(m => m.id));
    const firstMatchIndex = tokens.findIndex(t => matchIds.has(t.id));

    // Pivot around the first match, or middle if no match
    const pivotIndex = firstMatchIndex >= 0 ? firstMatchIndex : Math.floor(tokens.length / 2);

    // 2. Define Window
    const WINDOW_SIZE = 10;
    const start = Math.max(0, pivotIndex - WINDOW_SIZE);
    const end = Math.min(tokens.length, pivotIndex + WINDOW_SIZE + 1);

    const leftContext = tokens.slice(start, pivotIndex);
    const keyword = tokens[pivotIndex]; // The pivot token
    const rightContext = tokens.slice(pivotIndex + 1, end);

    // Helper to render token
    const renderToken = (t: Token, isMatch: boolean) => (
        <span
            key={t.id}
            onClick={() => setSelectedToken(selectedToken?.id === t.id ? null : t)}
            className={`
        inline-block px-1 rounded cursor-pointer transition-colors relative
        ${isMatch ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30' : 'hover:bg-white/10 text-gray-300'}
        ${selectedToken?.id === t.id ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500' : ''}
      `}
        >
            {t.form}
            {/* Popover */}
            {selectedToken?.id === t.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 glass-panel text-xs text-left z-50">
                    <div className="font-bold text-white mb-1 border-b border-white/10 pb-1">{t.form}</div>
                    <div className="grid grid-cols-[60px_1fr] gap-1 text-gray-400">
                        <span>Lemma:</span> <span className="text-sky-300">{t.lemma}</span>
                        <span>POS:</span> <span className="text-emerald-300">{t.upos}</span>
                        <span>Dep:</span> <span className="text-orange-300">{t.deprel}</span>
                        {t.feats !== '_' && (
                            <div className="col-span-2 mt-1 italic text-[10px] text-gray-500 break-words">
                                {t.feats}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
                </div>
            )}
        </span>
    );

    return (
        <div className="group relative flex items-center w-full hover:bg-white/[0.02] transition-colors">
            {/* View Button (Appears on Hover) */}
            <div className="absolute left-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 -translate-x-2 group-hover:translate-x-0">
                <Link
                    href={`/corpus/${corpusId}/document/${sentenceId}`}
                    className="p-1.5 bg-indigo-500/80 text-white rounded-full hover:bg-indigo-500 shadow-lg backdrop-blur-sm flex items-center justify-center border border-white/10"
                    title="View Document Details"
                >
                    <Eye size={14} />
                </Link>
            </div>

            <div className="font-mono text-sm leading-8 whitespace-nowrap overflow-x-auto flex items-center justify-center w-full py-2 border-b border-white/5 last:border-0 pl-10">
                {/* Left Context (Align Right) */}
                <div className="w-1/2 text-right pr-4 text-gray-400 overflow-hidden text-ellipsis">
                    {/* ... (render left tokens) */}
                    {leftContext.map(t => renderToken(t, matchIds.has(t.id)))}
                </div>

                {/* Keyword (Center) */}
                <div className="shrink-0 font-bold text-white relative z-0">
                    {/* ... (render keyword) */}
                    {renderToken(keyword, matchIds.has(keyword.id))}
                </div>

                {/* Right Context (Align Left) */}
                <div className="w-1/2 text-left pl-4 text-gray-400 overflow-hidden text-ellipsis">
                    {/* ... (render right tokens) */}
                    {rightContext.map(t => renderToken(t, matchIds.has(t.id)))}
                </div>
            </div>
        </div>
    );
}
