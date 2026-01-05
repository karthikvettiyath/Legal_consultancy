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

        // Clear existing data to avoid duplicates during re-seed
        await client.query("TRUNCATE clients RESTART IDENTITY");
        console.log("⚠️  Truncated 'clients' table for fresh import.");

        const files = fs.readdirSync(CLIENT_DATA_DIR);
        console.log(`📂 Found ${files.length} files in directory.`);

        for (const file of files) {
            if (!file.toUpperCase().includes("CLIENT") || !file.endsWith(".xlsx")) {
                console.log(`Skipping file (No 'CLIENT' or not .xlsx): ${file}`);
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

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                let name = null;
                let phone = null;
                let address = null;

                // 1. Find Phone
                let phoneIndex = -1;
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j] || '').replace(/[^\d]/g, ''); // Digits only
                    if (cell.length >= 10 && cell.length <= 13) {
                        phone = row[j];
                        phoneIndex = j;
                        break;
                    }
                }

                if (!phone && row[3]) {
                    phone = row[3];
                    phoneIndex = 3;
                }

                // 2. Find Name
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

                if (!name || name.length < 2) {
                    console.log(`   ⚠️  Row ${i}: Skipped (No valid name found/Empty). Col0: ${col0}, Col1: ${col1}`);
                    continue;
                }

                // 3. New Fields & Mapping
                function getTypeFromCode(code) {
                    const c = String(code).trim();
                    if (c === '1') return 'Legal';
                    if (c === '2') return 'Consultancy';
                    return code;
                }

                let typeCode = row[2] ? row[2] : null;
                const typeOfWork = typeCode ? getTypeFromCode(typeCode) : null;

                // Date Formatting
                function excelDateToJSDate(serial) {
                    var utc_days = Math.floor(serial - 25569);
                    var utc_value = utc_days * 86400;
                    var date_info = new Date(utc_value * 1000);
                    var fractional_day = serial - Math.floor(serial) + 0.0000001;
                    var total_seconds = Math.floor(86400 * fractional_day);
                    var seconds = total_seconds % 60;
                    total_seconds -= seconds;
                    var hours = Math.floor(total_seconds / (60 * 60));
                    var minutes = Math.floor(total_seconds / 60) % 60;
                    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
                }

                function formatDateDDMMYY(dateObj) {
                    if (!dateObj || isNaN(dateObj.getTime())) return null;
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = String(dateObj.getFullYear()).slice(-2);
                    return `${day}-${month}-${year}`;
                }

                let dob = row[4];
                let dobFormatted = null;

                if (dob) {
                    if (typeof dob === 'number') {
                        const jsDate = excelDateToJSDate(dob);
                        dobFormatted = formatDateDDMMYY(jsDate);
                    } else {
                        dobFormatted = String(dob).trim();
                    }
                }

                const caseNumber = row[5] ? String(row[5]).trim() : null;
                const cleanPhone = phone ? String(phone).replace(/[^\d+\s-]/g, '').trim() : null;

                try {
                    await client.query(
                        `INSERT INTO clients (name, phone, address, type_of_work, case_number, dob, created_at, review_rating) 
                         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NULL)`,
                        [name, cleanPhone, address, typeOfWork, caseNumber, dobFormatted]
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
