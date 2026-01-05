require('dotenv').config();
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const CLIENT_DATA_DIR = String.raw`d:\Legal_consultancy\client data`;

async function looseCount() {
    try {
        const files = fs.readdirSync(CLIENT_DATA_DIR);

        let looseTotal = 0;
        let strictTotal = 0;

        console.log("--- Scanning Excel Files (Loose Mode) ---");
        for (const file of files) {
            if (!file.toUpperCase().includes("CLIENT DATA") || !file.endsWith(".xlsx")) continue;
            if (file.includes("FORMATE")) continue;

            const filePath = path.join(CLIENT_DATA_DIR, file);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            let fileLoose = 0;
            let fileStrict = 0;

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                // Loose check: Just needs SOMETHING in col 0 or 1 that looks like a name
                const col0 = row[0];
                const col1 = row[1];

                let hasPossibleName = false;
                if (col0 && typeof col0 === 'string' && col0.trim().length > 1 && !String(col0).match(/^\d+$/)) hasPossibleName = true;
                if (col1 && typeof col1 === 'string' && col1.trim().length > 1) hasPossibleName = true;

                if (hasPossibleName) {
                    looseTotal++;
                    fileLoose++;

                    // Strict logic mirroring seed script for comparison
                    let name = null;
                    const isCol0Number = (typeof col0 === 'number') || (String(col0).trim().match(/^\d+$/));
                    if (isCol0Number && col1 && typeof col1 === 'string') name = col1.trim();
                    else if (col0 && typeof col0 === 'string' && !isCol0Number) name = col0.trim();
                    else if (col1 && typeof col1 === 'string') name = col1.trim();

                    if (name && name.length >= 2) {
                        fileStrict++;
                        strictTotal++;
                    } else {
                        console.log(`[${file}] Row ${i} skipped by strict but found by loose. Values: [${col0}, ${col1}]`);
                    }
                }
            }
            console.log(`${file}: Loose=${fileLoose}, Strict=${fileStrict}`);
        }
        console.log(`\n📊 Total Loose: ${looseTotal}`);
        console.log(`📊 Total Strict: ${strictTotal}`);
        console.log(`Difference: ${looseTotal - strictTotal}`);

    } catch (err) {
        console.error("Error:", err);
    }
}

looseCount();
