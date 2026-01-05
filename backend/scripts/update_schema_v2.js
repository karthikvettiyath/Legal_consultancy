require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        console.log("Connected to database.");

        await client.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS is_contacted BOOLEAN DEFAULT FALSE;
        `);
        console.log("Added 'is_contacted' column.");

        // Ensure file_no and file_date exist (user might have thought they deleted them from DB but check anyway)
        await client.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS file_no TEXT,
            ADD COLUMN IF NOT EXISTS file_date TEXT;
        `);
        console.log("Ensured 'file_no' and 'file_date' exist.");

        client.release();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
