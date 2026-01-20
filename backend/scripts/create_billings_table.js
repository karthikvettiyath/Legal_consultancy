require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4 // Force IPv4
});

async function createBillingsTable() {
    try {
        const client = await pool.connect();
        console.log("Connected to database...");

        const query = `
      CREATE TABLE IF NOT EXISTS billings (
        id SERIAL PRIMARY KEY,
        invoice_no VARCHAR(50),
        client_name VARCHAR(255),
        date VARCHAR(50),
        amount VARCHAR(50),
        type VARCHAR(20),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await client.query(query);
        console.log("✅ Table 'billings' created successfully.");
        client.release();
    } catch (err) {
        console.error("❌ Error creating table:", err);
    } finally {
        pool.end();
    }
}

createBillingsTable();
