const { Pool } = require('pg');
require('dotenv').config();

// Support Railway's DATABASE_URL or individual env vars
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'srif_2026',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});

// Query helper
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed:', { text: text.substring(0, 50), duration: `${duration}ms`, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        throw error;
    }
};

// Get single row
const getOne = async (text, params) => {
    const result = await query(text, params);
    return result.rows[0];
};

// Get all rows
const getAll = async (text, params) => {
    const result = await query(text, params);
    return result.rows;
};

module.exports = {
    pool,
    query,
    getOne,
    getAll
};
