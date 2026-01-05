require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

async function updateSchema() {
    try {
        const client = await pool.connect();
        console.log("Connected to database...");

        // Add review_rating column
        const alterQuery = `
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 10);
        `;
        await client.query(alterQuery);
        console.log("✅ Added review_rating column to clients table.");

        // Ensure other columns exist and are text (idempotent check)
        // type_of_work, case_number, dob
        const ensureColumnsQuery = `
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS type_of_work TEXT,
            ADD COLUMN IF NOT EXISTS case_number TEXT,
            ADD COLUMN IF NOT EXISTS dob TEXT;
        `;
        await client.query(ensureColumnsQuery);
        console.log("✅ Verified type_of_work, case_number, dob columns exist.");

        client.release();
    } catch (err) {
        console.error("❌ Schema update failed:", err);
    } finally {
        pool.end();
    }
}

updateSchema();
