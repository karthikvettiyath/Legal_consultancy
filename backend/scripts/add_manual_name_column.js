require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = (process.env.DATABASE_URL || '').replace(/^"|"$/g, '').trim();

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

(async () => {
    try {
        await pool.query('ALTER TABLE client_licenses ADD COLUMN IF NOT EXISTS manual_client_name VARCHAR(255);');
        console.log('✅ Column manual_client_name added to client_licenses');
    } catch (err) {
        console.error('❌ Error updating table:', err.message);
    } finally {
        pool.end();
    }
})();
