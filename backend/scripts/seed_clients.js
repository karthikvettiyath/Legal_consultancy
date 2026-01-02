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

async function seedClients() {
    try {
        const client = await pool.connect();
        console.log("✅ Connected to database.");

        // Clear existing data to avoid duplicates during re-seed (optional, but good for fresh sync)
        await client.query("TRUNCATE clients RESTART IDENTITY");
        console.log("⚠️  Truncated 'clients' table for fresh import.");

        const files = fs.readdirSync(CLIENT_DATA_DIR);
        console.log(`📂 Found ${files.length} files in directory.`);

        for (const file of files) {
            if (!file.toUpperCase().includes("CLIENT DATA") || !file.endsWith(".xlsx")) {
                console.log(`Skipping file: ${file}`);
                continue;
            }
            if (file.includes("FORMATE")) {
                console.log(`Skipping format file: ${file}`);
                continue;
            }

            console.log(`\n📄 Processing file: ${file} ...`);
            const filePath = path.join(CLIENT_DATA_DIR, file);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            let successCount = 0;
            let failCount = 0;

            // Iterate rows. Skip header (row 0) usually.
            // We will look for a row that has data.
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                let name = null;
                let phone = null;
                let address = null; // Usually not in these simple sheets, but we'll leave null

                // Heuristic to find Phone (looks for 10digit pattern in any cell)
                // Default to column 3 if it looks like a phone

                // Strategy: normalization
                // 1. Identify Phone
                // 2. Identify Name from remaining

                // 1. Find Phone
                let phoneIndex = -1;
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j] || '').replace(/[^\d]/g, ''); // Digits only
                    if (cell.length >= 10 && cell.length <= 13) {
                        // E.g. 9876543210 or 919876543210
                        phone = row[j];
                        phoneIndex = j;
                        break;
                    }
                }

                // If no phone found by regex, verify Column 3 (index 3)
                if (!phone && row[3]) {
                    // Maybe it has spaces or formatting we missed
                    phone = row[3];
                    phoneIndex = 3;
                }

                // 2. Find Name
                // Typically Index 1 (if Index 0 is SlNo) or Index 0.
                // If Index 0 is a number, try Index 1.

                const col0 = row[0];
                const col1 = row[1];

                const isCol0Number = (typeof col0 === 'number') || (String(col0).trim().match(/^\d+$/));

                if (isCol0Number && col1 && typeof col1 === 'string') {
                    name = col1.trim();
                } else if (col0 && typeof col0 === 'string' && !isCol0Number) {
                    name = col0.trim();
                } else {
                    // Fallback: If Col 1 is string, take it?
                    if (col1 && typeof col1 === 'string') name = col1.trim();
                }

                // Validation
                if (!name || name.length < 2) {
                    // console.log(`   ⚠️  Row ${i}: Skipped (No valid name found/Empty)`);
                    continue;
                }

                // 3. New Fields: TypeOfWork, CaseNumber, DOB
                // Based on inspection:
                // JESNA: [Sl, Name, TypeOfWork(2), Mobile(3), DOB(4)]
                // NITHYA: [Sl, Name, TypeOfWork(2), Mobile(3), DOB(4), CaseNum(5)]
                // Generally: 
                // Col 2 -> Type of Work
                // Col 4 -> DOB (if Col 3 is phone) or vice versa?
                // Let's rely on indices roughly for now as they seem consistent in reviewed files.
                // Col 2 is consistently TypeOfWork or "Legal"/"Consultancy"

                const typeOfWork = row[2] ? String(row[2]).trim() : null;

                // DOB is often Col 4 (Index 4)
                // Case Number is often Col 5 (Index 5)

                // However, let's look for Case Number specifically by pattern if possible, or just take index 5
                // Case numbers often look like "AS 35/22" or similar.

                let dob = row[4];
                if (dob && typeof dob === 'number') {
                    // Excel date conversion if needed, or just leave as is?
                    // Excel dates are days since 1900. 
                    // Let's store as string for simplicity unless requested otherwise.
                    // But if it's a number, it might be unreadable.
                    // Simple conversion: new Date((excelDate - (25567 + 2)) * 86400 * 1000)
                    // Let's just keep raw for now or stringify
                    dob = String(dob);
                }

                const caseNumber = row[5] ? String(row[5]).trim() : null;

                // Checking for "Consultancy" vs "Legal" classification if explicit
                // Use typeOfWork for this.

                // Clean phone
                const cleanPhone = phone ? String(phone).replace(/[^\d+\s-]/g, '').trim() : null;

                try {
                    await client.query(
                        `INSERT INTO clients (name, phone, address, type_of_work, case_number, dob, created_at) 
                         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                        [name, cleanPhone, address, typeOfWork, caseNumber, dob]
                    );
                    successCount++;
                } catch (err) {
                    console.error(`   ❌ Row ${i}: Insert failed for ${name} - ${err.message}`);
                    failCount++;
                }
            }
            console.log(`   --> Imported ${successCount} clients. (Failed: ${failCount})`);
        }

        client.release();
    } catch (err) {
        console.error("❌ Fatal Script Error:", err);
    } finally {
        await pool.end();
    }
}

seedClients();
