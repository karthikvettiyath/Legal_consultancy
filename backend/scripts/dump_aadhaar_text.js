const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function main() {
    // The user path: d:\Legal_consultancy\certificate-list-for-aadhaar-update (1).pdf
    // Accessing from backend/scripts, which is d:\Legal_consultancy\backend\scripts
    const filePath = path.join(__dirname, '../../certificate-list-for-aadhaar-update (1).pdf');

    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        try {
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();

            fs.writeFileSync('aadhaar_full_text.txt', data.text);
            console.log('Text saved to aadhaar_full_text.txt');
        } catch (e) {
            console.error('Error:', e);
        }
    } else {
        console.error('File not found:', filePath);
        // Try looking in public/docs just in case it was moved
        const movedPath = path.join(__dirname, '../../frontend/public/docs/certificate-list-for-aadhaar-update (1).pdf');
        if (fs.existsSync(movedPath)) {
            console.log('Found in public/docs instead.');
            const buffer = fs.readFileSync(movedPath);
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            fs.writeFileSync('aadhaar_full_text.txt', data.text);
            console.log('Text saved to aadhaar_full_text.txt');
        }
    }
}
main();
