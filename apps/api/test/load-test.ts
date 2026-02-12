import autocannon from 'autocannon';

const target = 'http://localhost:3000/search';

const queryComplex = {
    corpus_id: 'corpus_synth_1',
    query: {
        type: 'sequence',
        elements: [
            { type: 'token', lemma: 'the' },
            { type: 'token', lemma: 'quick' },
            { type: 'token', lemma: 'brown' }
        ]
    }
};

const querySimple = {
    corpus_id: 'corpus_synth_1',
    query: { type: 'token', lemma: 'cat' }
};

console.log('Running Load Test...');

const instance = autocannon({
    url: target,
    connections: 20, // 20 concurrent users
    pipelining: 1,
    duration: 10, // 10 seconds
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryComplex)
}, (err, result) => {
    if (err) {
        console.error(err);
    } else {
        console.log('--- Load Test Results ---');
        console.log(`Stat      | 2.5% | 50%  | 97.5% | 99%`);
        console.log(`Latency   | ${result.latency.p2_5} | ${result.latency.p50} | ${result.latency.p97_5} | ${result.latency.p99} ms`);
        console.log(`Req/Sec   | ${result.requests.p2_5} | ${result.requests.p50} | ${result.requests.p97_5} | ${result.requests.p99}`);
        console.log(`Total Req | ${result.requests.total}`);
    }
});

autocannon.track(instance, { renderProgressBar: true });
