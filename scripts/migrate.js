const { pool } = require('../database/db');
require('dotenv').config();

// Migration registry
const migrations = [
    {
        version: '1.0.0',
        name: 'initial_setup',
        up: `
            -- This migration is handled by init-db.js
            -- It creates the initial database schema
            SELECT 1;
        `
    },
    {
        version: '1.1.0',
        name: 'add_contact_messages',
        up: `
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(500),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                replied_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(is_read, created_at);
        `
    },
    {
        version: '1.2.0',
        name: 'add_submission_tracking',
        up: `
            ALTER TABLE research_submissions ADD COLUMN IF NOT EXISTS track VARCHAR(100);
            ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
        `
    }
];

async function runMigrations() {
    console.log('🔄 Running database migrations...\n');

    try {
        // Create migrations table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Get applied migrations
        const applied = await pool.query('SELECT version FROM migrations');
        const appliedVersions = applied.rows.map(r => r.version);

        for (const migration of migrations) {
            if (!appliedVersions.includes(migration.version)) {
                console.log(`📦 Applying migration ${migration.version}: ${migration.name}`);

                await pool.query(migration.up);
                await pool.query(
                    'INSERT INTO migrations (version, name) VALUES ($1, $2)',
                    [migration.version, migration.name]
                );

                console.log(`   ✅ Applied successfully\n`);
            } else {
                console.log(`   ⏭️  Skipping ${migration.version}: ${migration.name} (already applied)`);
            }
        }

        console.log('\n🎉 All migrations applied successfully!\n');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
