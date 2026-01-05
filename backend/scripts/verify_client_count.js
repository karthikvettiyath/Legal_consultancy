require('dotenv').config();
const { Pool } = require('pg');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

const CLIENT_DATA_DIR = String.raw`d:\Legal_consultancy\client data`;

async function verifyClients() {
    try {
        const client = await pool.connect();
        console.log("✅ (Verify) Connected to database.");

        const files = fs.readdirSync(CLIENT_DATA_DIR);

        let excelTotal = 0;
        let excelNames = [];

        console.log("--- Scanning Excel Files ---");
        for (const file of files) {
            if (!file.toUpperCase().includes("CLIENT DATA") || !file.endsWith(".xlsx")) continue;
            if (file.includes("FORMATE")) continue;

            const filePath = path.join(CLIENT_DATA_DIR, file);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            let fileCount = 0;
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                // Logic must match seed_clients.js exactly
                let name = null;
                const col0 = row[0];
                const col1 = row[1];
                const isCol0Number = (typeof col0 === 'number') || (String(col0).trim().match(/^\d+$/));

                if (isCol0Number && col1 && typeof col1 === 'string') {
                    name = col1.trim();
                } else if (col0 && typeof col0 === 'string' && !isCol0Number) {
                    name = col0.trim();
                } else {
                    if (col1 && typeof col1 === 'string') name = col1.trim();
                }

                if (name && name.length >= 2) {
                    excelTotal++;
                    fileCount++;
                    excelNames.push(name);
                }
            }
            console.log(`${file}: Found ${fileCount} valid clients.`);
        }
        console.log(`\n📊 Total Valid Clients in Excel: ${excelTotal}`);

        console.log("\n--- Checking Database ---");
        const res = await client.query("SELECT COUNT(*) FROM clients");
        const dbCount = parseInt(res.rows[0].count, 10);
        console.log(`📊 Total Clients in Database: ${dbCount}`);

        console.log("\n--- Result ---");
        if (dbCount === excelTotal) {
            console.log("✅ SUCCESS: Database count matches Excel count exactly.");
        } else {
            console.log("❌ DISCREPANCY: Counts do not match!");
            const diff = excelTotal - dbCount;
            console.log(`Missing/Extra in DB: ${-diff}`);

            // Should we list missing?
            // Fetch all names
            const allDbRes = await client.query("SELECT name FROM clients");
            const dbNames = new Set(allDbRes.rows.map(r => r.name.trim()));

            const missingInDb = excelNames.filter(n => !dbNames.has(n));
            if (missingInDb.length > 0) {
                console.log("Potential Missing in DB (by exact name match):");
                missingInDb.forEach(n => console.log(` - ${n}`));
            }
        }

        client.release();
    } catch (err) {
        console.error("❌ Verification Error:", err);
    } finally {
        pool.end();
    }
}

verifyClients();
