import axios from 'axios';

const API_URL = 'http://localhost:3000/search';

const testCases = [
    {
        name: "Valid Token Query",
        query: { type: 'token', lemma: 'git' },
        expectStatus: 200
    },
    {
        name: "Invalid Regex (Too Short)",
        query: { type: 'token', form: '/./' },
        expectStatus: 400
    },
    {
        name: "Invalid Regex (Leading Wildcard)",
        query: { type: 'token', form: '/.*bad/' },
        expectStatus: 400
    },
    {
        name: "Invalid Depth (> 5)",
        query: {
            type: 'dependency',
            relation: 'nsubj',
            head: {
                type: 'dependency',
                relation: 'obj',
                head: {
                    type: 'dependency',
                    relation: 'obl',
                    head: {
                        type: 'dependency',
                        relation: 'advmod',
                        head: {
                            type: 'dependency',
                            relation: 'root',
                            head: {
                                type: 'dependency',
                                relation: 'nested_more',
                                head: { type: 'token', lemma: 'deep' },
                                dependent: { type: 'token', lemma: 'deep' }
                            },
                            dependent: { type: 'token', lemma: 'deep' }
                        },
                        dependent: { type: 'token', lemma: 'deep' }
                    },
                    dependent: { type: 'token', lemma: 'deep' }
                },
                dependent: { type: 'token', lemma: 'deep' }
            },
            dependent: { type: 'token', lemma: 'deep' }
        },
        expectStatus: 400 // Should fail depth check (6 levels here roughly)
    },
    {
        name: "Sequence Limit (> 10)",
        query: {
            type: 'sequence',
            elements: Array(12).fill({ type: 'token', form: 'a' })
        },
        expectStatus: 400
    }
];

async function runTests() {
    console.log("Starting Torture Tests...");

    for (const test of testCases) {
        try {
            await axios.post(API_URL, {
                corpus_id: 'corpus_pud_1',
                query: test.query
            });

            if (test.expectStatus === 200) {
                console.log(`✅ [PASS] ${test.name}`);
            } else {
                console.log(`❌ [FAIL] ${test.name} - Expected ${test.expectStatus}, got 200`);
            }
        } catch (error: any) {
            const status = error.response?.status;
            if (status === test.expectStatus) {
                console.log(`✅ [PASS] ${test.name} (Got expected ${status})`);
            } else {
                console.log(`❌ [FAIL] ${test.name} - Expected ${test.expectStatus}, got ${status}`);
                console.log(`   Error: ${error.response?.data?.error}`);
            }
        }
    }
}

runTests();
