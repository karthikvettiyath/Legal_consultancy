require("dotenv").config();
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is missing in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

(async () => {
    try {
        const client = await pool.connect();
        console.log("Connected to DB.");

        console.log("Checking if 'category' column exists in 'billings'...");
        const catRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'billings' AND column_name = 'category';
    `);

        if (catRes.rows.length === 0) {
            console.log("Adding 'category' column...");
            await client.query("ALTER TABLE billings ADD COLUMN category TEXT;");
        } else {
            console.log("'category' column already exists.");
        }

        console.log("Checking if 'authorities' column exists in 'billings'...");
        const authRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'billings' AND column_name = 'authorities';
    `);

        if (authRes.rows.length === 0) {
            console.log("Adding 'authorities' column...");
            await client.query("ALTER TABLE billings ADD COLUMN authorities TEXT;");
        } else {
            console.log("'authorities' column already exists.");
        }

        client.release();
        console.log("Done.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
})();
