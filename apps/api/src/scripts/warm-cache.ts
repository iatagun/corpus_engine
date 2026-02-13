import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://127.0.0.1:3000';
const TARGET_CORPUS = 'corpus_pud_1';

const COMMON_TERMS = [
    'bir', 've', 'bu', 'da', 'de', 'için', 'ne', 'o', 'kadar', 'bi',
    'olan', 'olarak', 'ile', 'ama', 'çok', 'onun', 'en', 'gibi', 'daha', 'var'
];

async function warmCache() {
    console.log(`🔥 Starting Cache Warming for ${TARGET_CORPUS}...`);
    console.log(`Target API: ${API_URL}`);

    let count = 0;
    for (const lemma of COMMON_TERMS) {
        try {
            const query = {
                corpus_id: TARGET_CORPUS,
                query: { type: 'token', lemma }
            };

            console.log(`[${count + 1}/${COMMON_TERMS.length}] Warming: ${lemma}`);
            const start = Date.now();
            await axios.post(`${API_URL}/search`, query);
            const took = Date.now() - start;
            console.log(`   ✅ Success (${took}ms)`);
            count++;
        } catch (err: any) {
            console.error(`   ❌ Failed to warm ${lemma}:`, err.message);
        }
    }

    console.log(`\n✨ Cache Warming Complete. ${count}/${COMMON_TERMS.length} terms pre-loaded.`);
}

warmCache().catch(console.error);
