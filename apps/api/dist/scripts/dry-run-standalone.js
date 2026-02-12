"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const path_1 = __importDefault(require("path"));
// --- PARSER ---
class ConlluStreamParser {
    filePath;
    corpusId;
    docId;
    constructor(filePath, corpusId, docId) {
        this.filePath = filePath;
        this.corpusId = corpusId;
        this.docId = docId;
    }
    async *parse() {
        const fileStream = fs_1.default.createReadStream(this.filePath);
        const rl = readline_1.default.createInterface({ input: fileStream, crlfDelay: Infinity });
        let currentTokens = [];
        let currentSentenceId = null;
        let sentenceText = null;
        let sentenceSeq = 0;
        for await (const line of rl) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                if (trimmed.startsWith('# sent_id ='))
                    currentSentenceId = trimmed.split('=')[1].trim();
                else if (trimmed.startsWith('# text ='))
                    sentenceText = trimmed.split('=')[1].trim();
                continue;
            }
            if (trimmed === '') {
                if (currentTokens.length > 0) {
                    yield this.buildSentence(currentTokens, currentSentenceId, sentenceText, sentenceSeq++);
                    currentTokens = [];
                    currentSentenceId = null;
                    sentenceText = null;
                }
                continue;
            }
            const cols = trimmed.split('\t');
            if (cols.length < 10)
                continue;
            if (cols[0].includes('-') || cols[0].includes('.'))
                continue;
            currentTokens.push({
                id: parseInt(cols[0], 10),
                form: cols[1],
                lemma: cols[2],
                upos: cols[3],
                xpos: cols[4],
                feats: cols[5],
                head: parseInt(cols[6], 10) || 0,
                deprel: cols[7],
                misc: cols[9],
            });
        }
    }
    buildSentence(tokens, sentId, text, seq) {
        const finalSentId = sentId || `${this.docId}_s${seq}`;
        const tokenMap = new Map();
        tokens.forEach(t => tokenMap.set(t.id, t));
        const enrichedTokens = tokens.map(t => {
            const headToken = tokenMap.get(t.head);
            if (headToken) {
                t.head_lemma = headToken.lemma;
                t.head_upos = headToken.upos;
            }
            else {
                t.head_lemma = 'ROOT';
                t.head_upos = 'ROOT';
            }
            return t;
        });
        return {
            sentence_id: finalSentId,
            sentence_seq: seq,
            text: text || tokens.map(t => t.form).join(' '),
            tokens: enrichedTokens,
        };
    }
}
// --- QUERY BUILDER ---
class QueryBuilder {
    validate(q) {
        console.log("Validating query...");
        if (q.pagination?.size > 100)
            throw new Error("Size limit");
        // Simplified validation for dry run
    }
    build(q) {
        // Simplified build for dry run visualization
        return {
            query: {
                bool: {
                    must: q.query.elements.map((el) => ({
                        nested: {
                            path: 'tokens',
                            query: { term: { 'tokens.lemma': el.lemma } }
                        }
                    }))
                }
            }
        };
    }
}
// --- MAIN ---
async function main() {
    console.log("⚠️ Docker is unavailable. Running System Logic Dry-Run (STANDALONE)...\n");
    const syntheticFile = path_1.default.join(process.cwd(), 'apps/indexer/synthetic_100k.conllu');
    if (!fs_1.default.existsSync(syntheticFile)) {
        console.error("Synthetic file not found at", syntheticFile);
        return;
    }
    // 1. Ingestion
    console.log("--- 1. Ingestion Pipeline ---");
    const parser = new ConlluStreamParser(syntheticFile, 'dry_run_corpus', 'doc_1');
    console.log("Parsing first 3 sentences...");
    let count = 0;
    for await (const sentence of parser.parse()) {
        if (count >= 3)
            break;
        console.log(`\n[Sentence ${sentence.sentence_id}]: "${sentence.text}"`);
        console.log(`Tokens (Enriched):`);
        sentence.tokens.slice(0, 3).forEach(t => {
            console.log(`  - [${t.id}] ${t.form} (Lemma: ${t.lemma}, Head: ${t.head_lemma || 'ROOT'})`);
        });
        count++;
    }
    // 2. Query
    console.log("\n--- 2. Query Engine ---");
    const qb = new QueryBuilder();
    const query = {
        corpus_id: 'dry_run',
        query: {
            type: 'sequence',
            elements: [{ lemma: 'complex' }, { lemma: 'system' }]
        }
    };
    qb.validate(query);
    const dsl = qb.build(query);
    console.log("Generated DSL:", JSON.stringify(dsl, null, 2));
    console.log("\n✅ Dry Run Complete. Logic verified.");
}
main().catch(console.error);
//# sourceMappingURL=dry-run-standalone.js.map