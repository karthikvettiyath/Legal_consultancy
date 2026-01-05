const fs = require('fs');
const path = require('path');

const JSON_PATH = String.raw`d:\Legal_consultancy\client data\.venv\all_data.json`;

try {
    let raw = fs.readFileSync(JSON_PATH, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        data = eval('(' + raw + ')');
    }

    if (Array.isArray(data)) {
        console.log("Total Records:", data.length);
        console.log("First 3 Records Keys & Values:");
        data.slice(0, 3).forEach((item, i) => {
            console.log(`\n--- Record ${i} ---`);
            console.log(JSON.stringify(item, null, 2));
        });

        const allKeys = new Set();
        data.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)));

        console.log("All Unique Keys Found:");
        console.log(Array.from(allKeys).sort());

        let missingPhone = 0;
        let missingCase = 0; // "CASE NUMBER" or "CN"
        let missingType = 0; // "TYPE OF WORK"
        let missingFile = 0; // "FILE NO" / "FILE NUMBER"

        const checks = data.map(item => {
            const k = Object.keys(item).map(key => key.toUpperCase().trim());
            const hasPhone = k.some(key => key.includes('PHONE') || key.includes('MOBILE') || key.includes('CONTACT'));
            const hasCase = k.some(key => key.includes('CASE') || key.includes('CN') || key.includes('NUMBER'));
            // wait, "MOBILE NUMBER" includes "NUMBER", so "CASE NUMBER" logic needs care.
            // Better:
            const hasCaseSpecific = k.some(key => key.includes('CASE'));
            const hasFile = k.some(key => key.includes('FILE') && (key.includes('NO') || key.includes('NUM')));
            const hasType = k.some(key => key.includes('TYPE') || key.includes('WORK'));

            if (!hasPhone) missingPhone++;
            if (!hasCaseSpecific) missingCase++;
            if (!hasFile) missingFile++;
            if (!hasType) missingType++;

            return { hasPhone, hasCase: hasCaseSpecific, hasFile, hasType };
        });

        console.log("\n--- One-Line Stats ---");
        console.log(`Missing Phone Keys: ${missingPhone}`);
        console.log(`Missing Case Keys: ${missingCase}`);
        console.log(`Missing File Keys: ${missingFile}`);
        console.log(`Missing Type Keys: ${missingType}`);

        // Check finding values for missing ones
        // Maybe keys exist but values are null/empty?
        let emptyPhoneVal = 0;
        data.forEach(item => {
            // quick check on val
            const vals = Object.values(item).map(v => String(v).trim());
            // if no value looks like a phone...
        });

    } else {
        console.log("Not an array");
    }
} catch (err) {
    console.error(err);
}
