const fs = require('fs');
const JSON_PATH = String.raw`d:\Legal_consultancy\client data\.venv\all_data.json`;
let raw = fs.readFileSync(JSON_PATH, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = eval('(' + raw + ')');

const valid = data.find(item => {
    const keys = Object.keys(item);
    const fileKey = keys.find(k => k.toUpperCase().includes('FILE') && (k.toUpperCase().includes('NO') || k.toUpperCase().includes('NUM')));
    return fileKey && item[fileKey] && String(item[fileKey]).trim() !== '-' && String(item[fileKey]).trim() !== '';
});

if (valid) {
    console.log("Found Record with File No:");
    console.log(JSON.stringify(valid, null, 2));
} else {
    console.log("No record with valid File No found via script check.");
}
