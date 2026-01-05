require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

async function checkCount() {
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT COUNT(*) FROM clients");
        console.log("Total clients in DB:", res.rows[0].count);

        const sample = await client.query("SELECT * FROM clients LIMIT 5");
        console.log("Sample rows:", sample.rows);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkCount();
