require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

async function updateConstraint() {
    try {
        const client = await pool.connect();
        console.log("Connected to database...");

        // We need to drop the old constraint name. 
        // Postgres auto-generates names like 'clients_review_rating_check'.
        // Let's try to drop that specific name if it exists, or find it.
        // For simplicity, we can just alter the column type or drop constraint by name if we know it.
        // Usually 'clients_review_rating_check'.

        await client.query("ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_review_rating_check;");
        console.log("✅ Dropped old constraint.");

        // Add new constraint
        await client.query("ALTER TABLE clients ADD CONSTRAINT clients_review_rating_check CHECK (review_rating >= 1 AND review_rating <= 5);");
        console.log("✅ Added new constraint (1-5).");

        client.release();
    } catch (err) {
        console.error("❌ Constraint update failed (Check if any existing data violates new constraint!):", err);
    } finally {
        pool.end();
    }
}

updateConstraint();
