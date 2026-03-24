import 'dotenv/config';
import { runMigration } from '../src/lib/migrations-manager';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    try {
        const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/20260324_add_bio_publicado.sql'), 'utf-8');
        await runMigration('20260324_add_bio_publicado', sql);
        console.log('Migration executed successfully.');
    } catch (err) {
        console.error('Error running migration:', err);
    }
    process.exit(0);
}

migrate();
