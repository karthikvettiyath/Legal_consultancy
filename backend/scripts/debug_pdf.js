const fs = require('fs');
const path = require('path');
const pdfLibrary = require('pdf-parse');

console.log('Type of pdfLibrary:', typeof pdfLibrary);
console.log('Keys:', Object.keys(pdfLibrary));

const directoryPath = path.join(__dirname, '../../');

async function readPdfs() {
    try {
        const files = fs.readdirSync(directoryPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        // Just one file
        if (pdfFiles.length > 0) {
            const file = pdfFiles[0];
            const filePath = path.join(directoryPath, file);
            const dataBuffer = fs.readFileSync(filePath);

            try {
                // Try direct call or default
                let data;
                if (typeof pdfLibrary === 'function') {
                    data = await pdfLibrary(dataBuffer);
                } else if (typeof pdfLibrary.default === 'function') {
                    data = await pdfLibrary.default(dataBuffer);
                } else {
                    console.error("Unknown library structure");
                    return;
                }

                console.log(`\n--- File: ${file} ---`);
                console.log(`Preview: ${data.text.substring(0, 200).replace(/\n/g, ' ')}...`);
            } catch (err) {
                console.error(`Error reading ${file}:`, err);
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

readPdfs();
