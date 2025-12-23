require("dotenv").config({ path: '../.env' }); // Load from backend root
const fs = require('fs');
const path = require('path');
const { Pool } = require("pg");

const rootDir = path.join(__dirname, '../../');
const destDir = path.join(rootDir, 'frontend/public/docs');

// DB Setup
function stripSurroundingQuotes(value) {
    if (!value) return value;
    const trimmed = String(value).trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

const DATABASE_URL = stripSurroundingQuotes(process.env.DATABASE_URL);

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
        // Ensure dest dir exists
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Find PDFs
        const files = fs.readdirSync(rootDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDFs to process.`);

        const client = await pool.connect();

        for (const file of pdfFiles) {
            console.log(`Processing: ${file}`);

            // 1. Move file
            const oldPath = path.join(rootDir, file);
            const newPath = path.join(destDir, file);
            // Copy instead of move to be safe first? No, user said "uploaded". Move is cleaner.
            fs.copyFileSync(oldPath, newPath); // Copy first
            // fs.unlinkSync(oldPath); // Delete after success

            // 2. Prepare Data
            const title = file.replace(/\.pdf$/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
            const name = title.toUpperCase(); // Internal name
            const description = `Checklist and requirements for ${title}.`;
            const docUrl = `/docs/${encodeURIComponent(file)}`; // URL encoded for browser

            const details = JSON.stringify({
                cards: [
                    {
                        title: "Download Checklist",
                        content: `Please download the required document checklist here: <a href="${docUrl}" target="_blank" class="text-blue-500 underline">Download PDF</a>`,
                        items: [],
                        icon: "FileText"
                    }
                ],
                faqs: [
                    {
                        q: "What documents are needed?",
                        a: "Please refer to the downloadable PDF checklist for a complete list of required documents."
                    }
                ]
            });

            // 3. Insert into DB
            try {
                await client.query("BEGIN");

                // Check if exists to avoid duplicates?
                // Just insert blindly for now as requested.
                const nameRes = await client.query(
                    "INSERT INTO service_names (name) VALUES ($1) RETURNING id",
                    [name]
                );
                const serviceId = nameRes.rows[0].id;

                await client.query(
                    `INSERT INTO service_content (service_id, title, description, details, image_path)
                     VALUES ($1, $2, $3, $4, '')`,
                    [serviceId, title, description, details]
                );

                await client.query("COMMIT");
                console.log(`  -> Added service ID: ${serviceId}`);

            } catch (err) {
                await client.query("ROLLBACK");
                console.error(`  -> Failed to insert ${file}:`, err.message);
            }
        }

        client.release();
        await pool.end();
        console.log("Done!");

    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

main();
