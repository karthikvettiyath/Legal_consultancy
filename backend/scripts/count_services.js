const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("No DATABASE_URL found.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4,
});

async function main() {
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT COUNT(*) FROM service_names");
        console.log(`Total Services in DB: ${res.rows[0].count}`);

        const contentRes = await client.query("SELECT COUNT(*) FROM service_content");
        console.log(`Total Service Content in DB: ${contentRes.rows[0].count}`);

        client.release();
        await pool.end();
    } catch (err) {
        console.error("Error querying DB:", err);
    }
}

main();
