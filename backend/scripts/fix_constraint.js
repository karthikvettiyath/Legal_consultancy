require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function fix() {
    try {
        console.log("Dropping constraint clients_review_rating_check...");
        await pool.query("ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_review_rating_check");
        console.log("✅ Constraint dropped.");

        console.log("Adding less restrictive constraint (0-5)...");
        await pool.query("ALTER TABLE clients ADD CONSTRAINT clients_review_rating_check CHECK (review_rating >= 0 AND review_rating <= 5)");
        console.log("✅ New constraint added.");
    } catch (err) {
        console.error("Fix failed:", err);
    } finally {
        pool.end();
    }
}
fix();
