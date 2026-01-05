require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
    try {
        console.log("Checking if managed_by exists...");
        const res = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'managed_by'
        `);

        if (res.rowCount === 0) {
            console.log("Adding managed_by column...");
            await pool.query("ALTER TABLE clients ADD COLUMN managed_by TEXT");
            console.log("✅ Column added.");
        } else {
            console.log("✅ Column already exists.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}
migrate();
