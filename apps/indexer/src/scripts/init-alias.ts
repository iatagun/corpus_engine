import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.OPENSEARCH_USERNAME || 'admin',
        password: process.env.OPENSEARCH_PASSWORD || 'StrongPassword123!',
    },
    ssl: { rejectUnauthorized: false },
});

async function main() {
    const concreteIndex = 'corpus_sentences_v1';
    const readAlias = 'corpus_read';
    const writeAlias = 'corpus_write';

    console.log(`Setting up aliases for ${concreteIndex}...`);

    try {
        // 1. Check if index exists
        const exists = await client.indices.exists({ index: concreteIndex });
        if (!exists.body) {
            console.error(`Index ${concreteIndex} does not exist! Run init-index first.`);
            process.exit(1);
        }

        // 2. Add Aliases
        await client.indices.updateAliases({
            body: {
                actions: [
                    { add: { index: concreteIndex, alias: readAlias } },
                    { add: { index: concreteIndex, alias: writeAlias } }
                ]
            }
        });

        console.log(`Successfully aliased ${readAlias} and ${writeAlias} to ${concreteIndex}.`);

    } catch (error: any) {
        console.error('Alias setup failed:', error.meta ? error.meta.body : error);
    }
}

main();
