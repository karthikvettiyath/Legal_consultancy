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

        console.log("Checking if 'billings' table exists...");
        const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'billings'
      );
    `);

        if (res.rows[0].exists) {
            console.log("'billings' table exists. Enabling RLS...");
            await client.query("ALTER TABLE billings ENABLE ROW LEVEL SECURITY;");
            console.log("RLS enabled for 'billings'.");

            // Optionally create a policy if needed, but for now just enabling RLS to satisfy the warning.
            // Since backend uses 'postgres' user, it bypasses RLS by default.

        } else {
            console.log("'billings' table does not exist.");
        }

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
})();
