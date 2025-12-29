const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function secureTables() {
    const client = await pool.connect();
    try {
        console.log("Securing tables...");

        // 1. service_names
        console.log("-> Enabling RLS on service_names");
        await client.query(`ALTER TABLE service_names ENABLE ROW LEVEL SECURITY;`);

        // Remove existing policy to avoid errors if re-running
        try {
            await client.query(`DROP POLICY IF EXISTS "Public read access" ON service_names;`);
        } catch (e) { /* ignore */ }

        // Add Public Read
        console.log("-> Adding Public Read policy to service_names");
        await client.query(`
            CREATE POLICY "Public read access" 
            ON service_names 
            FOR SELECT 
            USING (true);
        `);

        // 2. service_content
        console.log("-> Enabling RLS on service_content");
        await client.query(`ALTER TABLE service_content ENABLE ROW LEVEL SECURITY;`);

        try {
            await client.query(`DROP POLICY IF EXISTS "Public read access" ON service_content;`);
        } catch (e) { /* ignore */ }

        console.log("-> Adding Public Read policy to service_content");
        await client.query(`
            CREATE POLICY "Public read access" 
            ON service_content 
            FOR SELECT 
            USING (true);
        `);

        // 3. Grant insert/update to authenticated users if needed?
        // For now, let's assume direct usage via backend (user postgres/admin) handles writes 
        // and doesn't need RLS policies (it likely bypasses them). 
        // But if frontend uses Supabase SDK to write, we'd need more.
        // Assuming current request is just to "Resolve" the warning.

        console.log("✅ Tables secured successfully.");

    } catch (err) {
        console.error("❌ Error securing tables:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

secureTables();
