const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function fixPolicies() {
    const client = await pool.connect();
    try {
        console.log("Fixing RLS policies...");

        const tables = ['service_content', 'service_names'];

        for (const table of tables) {
            console.log(`\nTable: ${table}`);

            // 1. Drop known duplicated policies
            // The user report mentions "Public Read Access " and "Public read access"
            const policiesToDrop = [
                "Public Read Access",
                "Public Read Access ",
                "Public read access",
                "Enable read access for all users" // common default
            ];

            for (const policy of policiesToDrop) {
                try {
                    await client.query(`DROP POLICY IF EXISTS "${policy}" ON ${table};`);
                    console.log(`  - Dropped policy: "${policy}"`);
                } catch (e) {
                    console.log(`  - Failed to drop "${policy}": ${e.message}`);
                }
            }

            // 2. Re-create single clean policy
            console.log(`  + Creating clean "Public Read Access" policy`);
            await client.query(`
                CREATE POLICY "Public Read Access" 
                ON ${table} 
                FOR SELECT 
                USING (true);
            `);
        }

        console.log("\n✅ Policies deduplicated and fixed.");

    } catch (err) {
        console.error("❌ Error fixing policies:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixPolicies();
