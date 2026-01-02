require('dotenv').config(); // Defaults to .env in current directory
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4 // Force IPv4
});

async function createClientsTable() {
    try {
        const client = await pool.connect();
        console.log("Connected to database...");

        const query = `
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await client.query(query);
        console.log("✅ Table 'clients' created successfully.");
        client.release();
    } catch (err) {
        console.error("❌ Error creating table:", err);
    } finally {
        pool.end();
    }
}

createClientsTable();
