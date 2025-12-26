const fs = require('fs');
const path = require('path');

const servicesPath = path.join(__dirname, '../frontend/public/services.json');
const data = JSON.parse(fs.readFileSync(servicesPath));

const ids = data.map(s => s.id).sort((a, b) => a - b);
console.log('Total services:', ids.length);
console.log('ID range:', ids[0], 'to', ids[ids.length - 1]);

let expected = 1;
const missing = [];
for (const id of ids) {
    if (id !== expected) {
        while (expected < id) {
            missing.push(expected);
            expected++;
        }
    }
    expected++;
}

if (missing.length > 0) {
    console.log('Missing IDs:', missing);
} else {
    console.log('No missing IDs in sequence.');
}

// Check if any PDFs in docs/ are NOT used
const docsPath = path.join(__dirname, '../frontend/public/docs');
const files = fs.readdirSync(docsPath);
const usedFiles = new Set();

data.forEach(s => {
    if (s.details && s.details.cards) {
        s.details.cards.forEach(c => {
            if (c.content && c.content.includes('/docs/')) {
                const match = c.content.match(/href="\/docs\/([^"]+)"/);
                if (match) usedFiles.add(decodeURIComponent(match[1]).toLowerCase());
            }
        });
    }
});

const unused = files.filter(f => !usedFiles.has(f.toLowerCase()));
console.log('Unused PDFs:', unused);
