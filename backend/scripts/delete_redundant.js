const fs = require('fs');
const path = require('path');
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, '../.env') });

const SERVICES_JSON_PATH = path.join(__dirname, '../../frontend/public/services.json');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    try {
        const services = JSON.parse(fs.readFileSync(SERVICES_JSON_PATH, 'utf8'));
        const validNames = new Set(services.map(s => s.name.toUpperCase().trim())); // Normalize

        console.log(`Valid Services (JSON): ${validNames.size}`);

        const client = await pool.connect();

        // Fetch All
        const res = await client.query("SELECT id, name FROM service_names");
        const allDb = res.rows;

        console.log(`Total DB Services: ${allDb.length}`);

        const toDeleteIds = [];
        for (const s of allDb) {
            // Very loose matching if needed, but 'generate_union' used the same logic
            const dbName = s.name.toUpperCase().trim();
            if (!validNames.has(dbName)) {
                toDeleteIds.push(s.id);
                console.log(`Marking for deletion: [${s.id}] ${s.name}`);
            }
        }

        console.log(`Deleting ${toDeleteIds.length} redundant services...`);

        if (toDeleteIds.length > 0) {
            await client.query("BEGIN");
            const idsList = toDeleteIds.join(',');

            // Delete content first (FK)
            await client.query(`DELETE FROM service_content WHERE service_id IN (${idsList})`);

            // Delete names
            await client.query(`DELETE FROM service_names WHERE id IN (${idsList})`);

            await client.query("COMMIT");
            console.log("Deletion Complete.");
        } else {
            console.log("No redundant services found.");
        }

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

main();
