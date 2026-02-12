import fs from 'fs';
import readline from 'readline';
import { Sentence, Token } from '@corpus/types';
import crypto from 'crypto';

export class ConlluStreamParser {
    private filePath: string;
    private corpusId: string;
    private docId: string;

    constructor(filePath: string, corpusId: string, docId: string) {
        this.filePath = filePath;
        this.corpusId = corpusId;
        this.docId = docId;
    }

    async *parse(): AsyncIterableIterator<Sentence> {
        const fileStream = fs.createReadStream(this.filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let currentTokens: Token[] = [];
        let currentSentenceId: string | null = null;
        let sentenceText: string | null = null;
        let sentenceSeq = 0;

        for await (const line of rl) {
            const trimmed = line.trim();

            // Comment or Metadata line
            if (trimmed.startsWith('#')) {
                if (trimmed.startsWith('# sent_id =')) {
                    currentSentenceId = trimmed.split('=')[1].trim();
                } else if (trimmed.startsWith('# text =')) {
                    sentenceText = trimmed.split('=')[1].trim();
                }
                continue;
            }

            // Empty line = End of Sentence
            if (trimmed === '') {
                if (currentTokens.length > 0) {
                    yield this.buildSentence(currentTokens, currentSentenceId, sentenceText, sentenceSeq++);
                    currentTokens = [];
                    currentSentenceId = null;
                    sentenceText = null;
                }
                continue;
            }

            // Token Line
            const cols = trimmed.split('\t');
            if (cols.length < 10) continue; // Skip malformed lines

            // Handle multi-word tokens (1-2) or empty nodes (1.1) - Skip for now or handle?
            // For strictly searchable corpus, we usually index the expanded words, not the range.
            if (cols[0].includes('-') || cols[0].includes('.')) continue;

            const token: Token = {
                id: parseInt(cols[0], 10),
                form: cols[1],
                lemma: cols[2],
                upos: cols[3],
                xpos: cols[4],
                feats: cols[5],
                head: parseInt(cols[6], 10) || 0, // Root is 0
                deprel: cols[7],
                misc: cols[9],
            };

            currentTokens.push(token);
        }

        // Flush last sentence if no newline at end of file
        if (currentTokens.length > 0) {
            yield this.buildSentence(currentTokens, currentSentenceId, sentenceText, sentenceSeq++);
        }
    }

    private buildSentence(tokens: Token[], sentId: string | null, text: string | null, seq: number): Sentence {
        // 1. Generate ID if missing
        const finalSentId = sentId || `${this.docId}_s${seq}`;

        // 2. Denormalize Dependencies (The "Secret Sauce" for performance)
        // We map head_id -> Token to quickly find head attributes
        const tokenMap = new Map<number, Token>();
        tokens.forEach(t => tokenMap.set(t.id, t));

        const enrichedTokens = tokens.map(t => {
            const headToken = tokenMap.get(t.head);
            if (headToken) {
                t.head_lemma = headToken.lemma;
                t.head_upos = headToken.upos;
            } else {
                t.head_lemma = 'ROOT'; // or null
                t.head_upos = 'ROOT';
            }
            return t;
        });

        // 3. Compute Flattened Sets for fast filtering
        const has_lemmas = Array.from(new Set(tokens.map(t => t.lemma)));
        const has_pos = Array.from(new Set(tokens.map(t => t.upos)));

        return {
            sentence_id: finalSentId,
            sentence_seq: seq,
            text: text || tokens.map(t => t.form).join(' '),
            tokens: enrichedTokens,
            has_lemmas,
            has_pos
        };
    }
}
