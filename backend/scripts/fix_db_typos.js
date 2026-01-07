const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    try {
        const client = await pool.connect();

        // Find services with "Incorporatin"
        const res = await client.query("SELECT id, name FROM service_names WHERE name LIKE '%Incorporatin%'");
        console.log(`Found ${res.rows.length} services with typo.`);

        for (const row of res.rows) {
            const newName = row.name.replace(/Incorporatin/g, 'Incorporation');
            console.log(`Renaming ${row.name} -> ${newName}`);

            // Check if newName already exists
            const conflict = await client.query("SELECT id FROM service_names WHERE name = $1", [newName]);
            if (conflict.rows.length > 0) {
                console.log(`  Target name ${newName} already exists. Deleting typo entry (ID: ${row.id}) to avoid duplicates.`);
                await client.query("BEGIN");
                await client.query("DELETE FROM service_content WHERE service_id = $1", [row.id]);
                await client.query("DELETE FROM service_names WHERE id = $1", [row.id]);
                await client.query("COMMIT");
            } else {
                await client.query("UPDATE service_names SET name = $1 WHERE id = $2", [newName, row.id]);
                console.log("  Renamed successfully.");
            }
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
