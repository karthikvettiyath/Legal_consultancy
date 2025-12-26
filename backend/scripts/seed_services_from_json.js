const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ No DATABASE_URL found in .env");
    console.error("Please ensure backend/.env contains DATABASE_URL");
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// We'll read from the frontend public file which contains the big JSON
const jsonPath = path.join(__dirname, '../../frontend/public/services.json');

async function main() {
    try {
        console.log(`Reading services from: ${jsonPath}`);
        if (!fs.existsSync(jsonPath)) {
            console.error("JSON file not found!");
            process.exit(1);
        }

        const raw = fs.readFileSync(jsonPath, 'utf8');
        const services = JSON.parse(raw);
        console.log(`Found ${services.length} services to process in JSON.`);

        const client = await pool.connect();

        let successCount = 0;
        let failCount = 0;

        for (const service of services) {

            // 1. Prepare Content - REMOVE "Download" section
            let processedDetails = service.details;
            if (processedDetails && processedDetails.cards) {
                // Filter out cards with title containing 'Download'
                processedDetails.cards = processedDetails.cards.filter(c =>
                    !c.title.toLowerCase().includes('download')
                );
            }

            // 2. Insert into DB
            try {
                await client.query("BEGIN");

                // Optional: Check if already exists to avoid duplicates or duplicate key errors
                // We'll treat 'name' as unique identifier for this purpose
                const checkRes = await client.query("SELECT id FROM service_names WHERE name = $1", [service.name.substring(0, 45)]);

                let serviceId;
                if (checkRes.rows.length > 0) {
                    console.log(`  - Update existing service: ${service.name}`);
                    // console.log("Name len:", service.name.length, "Title len:", service.title.length);
                    serviceId = parseInt(checkRes.rows[0].id, 10);

                    // Update content
                    console.log("Updating title length:", service.title.length);
                    await client.query(
                        `UPDATE service_content 
                         SET title = $1, description = $2, details = $3, image_path = $4
                         WHERE service_id = $5`,
                        [service.title.substring(0, 100), service.description, JSON.stringify(processedDetails), service.image_path || '', serviceId]
                    );

                } else {
                    console.log(`  - Insert new service: ${service.name}`);
                    const nameRes = await client.query(
                        "INSERT INTO service_names (name) VALUES ($1) RETURNING id",
                        [service.name.substring(0, 45)]
                    );
                    serviceId = parseInt(nameRes.rows[0].id, 10);

                    await client.query(
                        `INSERT INTO service_content (service_id, title, description, details, image_path)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [serviceId, service.title.substring(0, 100), service.description, JSON.stringify(processedDetails), service.image_path || '']
                    );
                }

                await client.query("COMMIT");
                successCount++;
            } catch (err) {
                await client.query("ROLLBACK");
                console.error(`❌ Failed to process ${service.name}:`);
                console.error(`Error code: ${err.code}, Detail: ${err.detail}, Message: ${err.message}`);
                failCount++;
            }
        }

        console.log(`\n--- Summary ---`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`----------------`);

        client.release();
    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        await pool.end();
    }
}

main();
