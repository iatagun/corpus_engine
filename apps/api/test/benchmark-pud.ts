import autocannon from 'autocannon';
import dotenv from 'dotenv';
import { CorpusQuery } from '@corpus/types';

dotenv.config();

const queries: CorpusQuery[] = [
    { corpus_id: 'corpus_pud_1', query: { type: 'token', lemma: 'git' } },
    { corpus_id: 'corpus_pud_1', query: { type: 'token', upos: 'NOUN' } },
    {
        corpus_id: 'corpus_pud_1',
        query: {
            type: 'sequence',
            elements: [
                { type: 'token', upos: 'ADJ' },
                { type: 'token', upos: 'NOUN' }
            ]
        }
    }
];

function startBenchmark() {
    const instance = autocannon({
        url: 'http://localhost:3000/search',
        method: 'POST',
        connections: 50, // Concurrent users
        duration: 10,    // Seconds
        headers: {
            'content-type': 'application/json'
        },
        requests: queries.map(q => ({
            method: 'POST',
            path: '/search',
            body: JSON.stringify(q) // Autocannon will rotate these bodies
        }))
    }, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            console.log(autocannon.printResult(result));
        }
    });

    autocannon.track(instance, { renderProgressBar: true });
}

startBenchmark();
