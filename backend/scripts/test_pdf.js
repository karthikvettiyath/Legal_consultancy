const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const directoryPath = path.join(__dirname, '../../'); // Root of d:\Legal_consultancy

async function readPdfs() {
    try {
        const files = fs.readdirSync(directoryPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDF files.`);

        // Read first 3 to test
        for (const file of pdfFiles.slice(0, 3)) {
            const filePath = path.join(directoryPath, file);
            const dataBuffer = fs.readFileSync(filePath);

            try {
                const data = await pdf(dataBuffer);
                console.log(`\n--- File: ${file} ---`);
                console.log(`Preview: ${data.text.substring(0, 200).replace(/\n/g, ' ')}...`);
            } catch (err) {
                console.error(`Error reading ${file}:`, err.message);
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

readPdfs();
