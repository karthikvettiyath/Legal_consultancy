const fs = require('fs');
const JSON_PATH = String.raw`d:\Legal_consultancy\client data\.venv\all_data.json`;
let raw = fs.readFileSync(JSON_PATH, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = eval('(' + raw + ')');

console.log("--- RECORD 0 ---");
const rec = data[0];
Object.keys(rec).forEach(k => {
    console.log(`[${k}]: ${JSON.stringify(rec[k])}`);
});

console.log("\n--- RECORD 1 ---");
const rec1 = data[1];
Object.keys(rec1).forEach(k => {
    console.log(`[${k}]: ${JSON.stringify(rec1[k])}`);
});
