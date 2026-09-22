import { createLogger } from '@unsa/logger';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from '@/config';

const logger = createLogger('slides');

const sql = postgres(config.databaseUrl, { max: 1 });
const db = drizzle(sql);

logger.info('Running slides database migrations...');
await migrate(db, {
  migrationsFolder: process.env.MIGRATIONS_DIR || './src/db/migrations',
});
logger.info('Slides database migrations completed successfully.');
await sql.end();
