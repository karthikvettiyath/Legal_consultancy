const path = require('path');
const envPath = path.join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
console.log('File exists:', require('fs').existsSync(envPath));
require("dotenv").config({ path: envPath });
const fs = require('fs');

const { Pool } = require("pg");
const pdf = require('pdf-parse');

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

        // Find PDFs in root
        const files = fs.readdirSync(rootDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDFs to process.`);

        const client = await pool.connect();

        for (const file of pdfFiles) {
            console.log(`Processing: ${file}`);
            const filePath = path.join(rootDir, file);

            // 1. Read PDF Context
            let pdfText = "";
            let items = [];
            try {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                pdfText = data.text;

                // Naive extraction: Split by newlines, filter empty, take first 10-15 meaningful lines as "Items"
                items = pdfText
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 3 && !l.toLowerCase().includes('page')) // basic noise filter
                    .slice(0, 15); // limit items

            } catch (err) {
                console.error(`  -> Failed to read PDF text: ${err.message}`);
                items = ["Please refer to the document for details."];
            }

            // 2. Move file (Copy first)
            const newPath = path.join(destDir, file);
            fs.copyFileSync(filePath, newPath);

            // 3. Prepare DB Data
            // Title cleanup
            const title = file.replace(/\.pdf$/i, '')
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/CHECKLIST/i, '')
                .trim();

            const name = title.toUpperCase(); // Internal ID
            const description = `Requirements and checklist for ${title}.`;
            const docUrl = `/docs/${encodeURIComponent(file)}`;

            // Create "Smart" content based on PDF extraction
            const details = JSON.stringify({
                cards: [
                    {
                        title: "Document Checklist",
                        content: "",
                        items: items, // Using extracted lines as list items
                        icon: "List"
                    },
                    {
                        title: "Download",
                        content: `Download the official document here: <a href="${docUrl}" target="_blank" class="text-blue-500 underline">View PDF</a>`,
                        items: [],
                        icon: "Download"
                    }
                ],
                faqs: [
                    {
                        q: "What is this service?",
                        a: `This service covers ${title}. Please review the checklist above for required documents.`
                    }
                ]
            });

            // 4. Insert into DB
            try {
                await client.query("BEGIN");

                const nameRes = await client.query(
                    "INSERT INTO service_names (name) VALUES ($1) RETURNING id",
                    [name]
                );
                const serviceId = nameRes.rows[0].id;

                await client.query(
                    `INSERT INTO service_content (service_id, title, description, details, image_path)
                     VALUES ($1, $2, $3, $4, '')`,
                    [serviceId, title + " Checklist", description, details]
                );

                await client.query("COMMIT");
                console.log(`  -> Added service ID: ${serviceId}, extracted ${items.length} items from PDF.`);

            } catch (err) {
                await client.query("ROLLBACK");
                console.error(`  -> Database extraction failed for ${file}:`, err.message);
            }
        }

        client.release();
        await pool.end();
        console.log("Processing complete.");

    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

main();
