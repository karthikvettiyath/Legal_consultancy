require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function diagnose() {
    try {
        console.log("--- Checking Schema ---");
        // Check columns
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clients';
        `);
        console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));

        console.log("\n--- Checking Record 267 ---");
        const res = await pool.query("SELECT * FROM clients WHERE id = 267");
        if (res.rows.length) {
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("Record 267 not found.");
        }

        console.log("\n--- Test Update ---");
        try {
            await pool.query("UPDATE clients SET is_contacted = true WHERE id = 267");
            console.log("Update success!");
        } catch (e) {
            console.log("Update FAILED:", e.message);
        }

    } catch (err) {
        console.error("Diagnosis Error:", err);
    } finally {
        pool.end();
    }
}
diagnose();
