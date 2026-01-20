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
        // 1. Load Local "Source of Truth"
        if (!fs.existsSync(SERVICES_JSON_PATH)) {
            console.error("services.json not found");
            process.exit(1);
        }
        const localServices = JSON.parse(fs.readFileSync(SERVICES_JSON_PATH, 'utf8'));
        const localNames = new Set(localServices.map(s => s.name.toUpperCase().trim()));

        console.log(`Local JSON has ${localServices.length} distinct services.`);

        // 2. Load DB Services
        const client = await pool.connect();
        const res = await client.query(`
            SELECT sn.id, sn.name, sc.title 
            FROM service_names sn
            LEFT JOIN service_content sc ON sn.id = sc.service_id
        `);
        client.release();

        const dbServices = res.rows;
        console.log(`Database has ${dbServices.length} services.`);

        // 3. Compare
        const toDelete = [];
        const seenNames = new Map(); // Name -> ID
        const duplicates = [];

        for (const s of dbServices) {
            const dbName = s.name.toUpperCase().trim();

            // Check if valid (exists in local JSON)
            if (!localNames.has(dbName)) {
                toDelete.push(s);
                continue;
            }

            // Check for duplicates in DB
            if (seenNames.has(dbName)) {
                duplicates.push(s);
            } else {
                seenNames.set(dbName, s.id);
            }
        }

        console.log(`\n--- Redundancy Analysis ---`);
        console.log(`Services in DB but NOT in Folders (to be deleted): ${toDelete.length}`);
        if (toDelete.length > 0) {
            console.log("Samples:");
            toDelete.slice(0, 5).forEach(s => console.log(` - [${s.id}] ${s.name}`));
        }

        console.log(`Duplicate services in DB (same name, to be deleted): ${duplicates.length}`);
        if (duplicates.length > 0) {
            duplicates.forEach(s => console.log(` - [${s.id}] ${s.name} (Duplicate of ${seenNames.get(s.name.toUpperCase().trim())})`));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

main();
