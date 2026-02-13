import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration SQL path. 
 * In production (dist), this will be relative to the built js file.
 * In dev, this is relative to the source.
 */
const sqlPath = path.resolve(process.cwd(), 'apps/indexer/src/migrations/init.sql');

const pool = new pg.Pool({
    user: process.env.POSTGRES_USER || 'corpus_user',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'corpus_db',
    password: process.env.POSTGRES_PASSWORD || 'StrongPassword123!',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

async function run() {
    console.log('🚀 Running Postgres Migrations...');
    try {
        const sqlPath = path.resolve(process.cwd(), 'apps/indexer/src/migrations/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Migrations Successful');
    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await pool.end();
    }
}

run();
