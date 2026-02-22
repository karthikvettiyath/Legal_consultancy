require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = (process.env.DATABASE_URL || '').replace(/^"|"$/g, '').trim();

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

(async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'create_license_tables.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ License & Agreement tables created successfully!');
    } catch (err) {
        console.error('❌ Error creating tables:', err.message);
    } finally {
        pool.end();
    }
})();
