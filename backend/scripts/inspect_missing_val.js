const fs = require('fs');
const JSON_PATH = String.raw`d:\Legal_consultancy\client data\.venv\all_data.json`;
let raw = fs.readFileSync(JSON_PATH, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = eval('(' + raw + ')');

const missing = data.filter(item => {
    // Find key for file no
    const keys = Object.keys(item);
    const fileKey = keys.find(k => k.toUpperCase().includes('FILE') && (k.toUpperCase().includes('NO') || k.toUpperCase().includes('NUM')));
    const val = fileKey ? item[fileKey] : undefined;

    // Check if "missing"
    return !val || String(val).trim() === '-' || String(val).trim() === '';
});

console.log(`Found ${missing.length} records with missing File No.`);
console.log("Sample Missing Record:");
if (missing.length > 0) {
    console.log(JSON.stringify(missing[0], null, 2));
}
