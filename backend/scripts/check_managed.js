require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const res = await pool.query("SELECT DISTINCT managed_by FROM clients");
        console.log("Unique Managed By Values:");
        res.rows.forEach(r => console.log(`- ${r.managed_by}`));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}
check();
