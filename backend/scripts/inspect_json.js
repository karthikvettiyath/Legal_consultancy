const fs = require('fs');
const path = require('path');

const jsonPath = String.raw`d:\Legal_consultancy\client data\.venv\all_data.json`;

try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    console.log("First 500 chars:", raw.substring(0, 500));
    const data = JSON.parse(raw);
    console.log(`Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    console.log(`Length: ${data.length}`);
    if (Array.isArray(data) && data.length > 0) {
        console.log('Sample Record Keys:', Object.keys(data[0]));
        console.log('Sample Record:', JSON.stringify(data[0], null, 2));
    }
} catch (err) {
    console.error(err);
}
