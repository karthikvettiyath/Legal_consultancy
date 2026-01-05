require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

const JSON_PATH = String.raw`d:\Legal_consultancy\client data\.venv\all_data.json`;

async function seed() {
    let client;
    try {
        client = await pool.connect();
        console.log("✅ Connected to database.");

        await client.query("TRUNCATE clients RESTART IDENTITY");
        console.log("⚠️ Truncated 'clients' table.");

        let raw = fs.readFileSync(JSON_PATH, 'utf8');
        // Strip BOM if present
        if (raw.charCodeAt(0) === 0xFEFF) {
            raw = raw.slice(1);
        }

        console.log("Raw Start:", raw.substring(0, 50).replace(/\n/g, '\\n'));

        let data;
        try {
            data = JSON.parse(raw);
        } catch (parseErr) {
            console.error("Standard JSON Parse Failed. Trying eval...");
            try {
                // Unsafe but permissive
                data = eval('(' + raw + ')');
            } catch (evalErr) {
                console.error("Eval Failed:", evalErr.message);
                throw parseErr;
            }
        }

        if (!Array.isArray(data)) {
            console.log("Data is not an array. Wrapping.");
            data = [data];
        }

        console.log(`📄 Found ${data.length} records.`);
        if (data.length > 0) {
            console.log("Keys in first record:", Object.keys(data[0]));
        }

        let success = 0;
        let fail = 0;
        const failStats = { phone: 0, case: 0, type: 0, fileNo: 0 };
        const successStats = { phone: 0, case: 0, type: 0, fileNo: 0 };

        for (const item of data) {
            // Flexible Key Matching
            const getVal = (patterns) => {
                for (const key of Object.keys(item)) {
                    const k = key.toUpperCase();
                    for (const p of patterns) {
                        if (k.includes(p)) return item[key];
                    }
                }
                return null;
            };

            // Debug first few records to seeing mapping
            if (success < 5) {
                console.log(`\n--- Mapping Record ${success} ---`);
                console.log("Keys:", Object.keys(item));
            }

            const name = getVal(['NAME', 'CLIENT', 'PARTY']) || '-'; // Added PARTY
            const phoneRaw = getVal(['OBILE', 'PHONE', 'CONTACT', 'PH.']) || '-'; // Added PH.
            const caseNum = getVal(['CASE', 'CN', 'NO. OF CASE']) || '-';
            const fileNoRaw = getVal(['FILE NO', 'FILE NUMBER', 'FILENO', 'FILE  NO']) || '-';
            const fileDateRaw = getVal(['FILE DATE', 'FILEDATE', 'DATE OF FILE']) || '-';
            const dobRaw = getVal(['DOB', 'BIRTH', 'DATE OF BIRTH']) || '-';
            const emailRaw = getVal(['EMAIL', 'MAIL']) || '-';
            const typeOfWorkRaw = getVal(['TYPE', 'WORK', 'NATURE']) || '-'; // Added NATURE

            if (success < 5) {
                console.log(`Mapped: Name=${name}, Phone=${phoneRaw}, File=${fileNoRaw}`);
            }

            // Clean Data
            const cleanStr = (s) => (s && s !== 'null' && s !== 'undefined') ? String(s).trim() : '-';

            const nameClean = cleanStr(name);
            const address = '-'; // Not in JSON usually?
            const typeOfWork = cleanStr(typeOfWorkRaw); // Map this now!

            let phoneClean = cleanStr(phoneRaw);
            // If phone has letters, maybe it's '-'
            if (/[a-zA-Z]/.test(phoneClean)) phoneClean = phoneClean.replace(/[^\d]/g, '') || '-';

            const caseClean = cleanStr(caseNum);
            const fileNoClean = cleanStr(fileNoRaw);
            const fileDateClean = cleanStr(fileDateRaw);
            const dobClean = cleanStr(dobRaw);
            const emailClean = cleanStr(emailRaw);

            // Extract Managed By
            const sourceFileRaw = getVal(['SOURCE', 'FILE']) || '';
            let managedBy = '-';
            if (sourceFileRaw && sourceFileRaw !== '-') {
                let s = String(sourceFileRaw).toUpperCase();
                if (s.includes('JESNA')) managedBy = 'Jesna';
                else if (s.includes('NITHYA')) managedBy = 'Nithya';
                else if (s.includes('SOUMYA')) managedBy = 'Soumya';
                else managedBy = '-';

                // Debug unexpected names
                if (managedBy === '-' && s.includes('PROMISSIONARY')) console.log(`DEBUG: Source='${s}' -> ManagedBy='${managedBy}'`);
                if (managedBy !== '-' && managedBy !== 'Jesna' && managedBy !== 'Nithya' && managedBy !== 'Soumya') {
                    console.log(`CRITICAL: Source='${s}' -> ManagedBy='${managedBy}' (This should not happen)`);
                }
            }

            try {
                // ... matching logic ...
                // Log if critical fields are missing
                if (phoneClean === '-') failStats.phone++;
                else successStats.phone++;

                if (caseClean === '-') failStats.case++;
                else successStats.case++;

                if (typeOfWork === '-') failStats.type++;
                else successStats.type++;

                if (fileNoClean === '-') failStats.fileNo++;
                else successStats.fileNo++;

                await client.query(
                    `INSERT INTO clients (name, phone, address, type_of_work, case_number, dob, review_rating, file_no, file_date, email, is_contacted, managed_by, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, $9, FALSE, $10, NOW())`,
                    [nameClean, phoneClean, address, typeOfWork, caseClean, dobClean, fileNoClean, fileDateClean, emailClean, managedBy]
                );
                success++;
            } catch (err) {
                console.error(`❌ Failed to insert ${nameClean}: ${err.message}`);
                fail++;
            }
        }

        console.log(`\n✅ Seeding complete. Success: ${success}, Fail: ${fail}`);
        console.log("--- Data Quality Stats ---");
        console.log(`Records with VALID Phone: ${successStats.phone} (Missing: ${failStats.phone})`);
        console.log(`Records with VALID CaseNo: ${successStats.case} (Missing: ${failStats.case})`);
        console.log(`Records with VALID FileNo: ${successStats.fileNo} (Missing: ${failStats.fileNo})`);
        // ...
        process.exit(0);

    } catch (err) {
        console.error("Fatal Error:", err);
        process.exit(1);
    } finally {
        if (client) client.release();
    }
}

seed();
