
const http = require('http');

const options = {
    hostname: 'api',
    port: 3000,
    path: '/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify({
    corpus_id: 'corpus_pud_1',
    query: { type: 'token', lemma: 'bir' },
    pagination: { size: 5 }
}));
req.end();
