const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function main() {
    const filePath = path.join(__dirname, '../../certificate-list-for-aadhaar-update (1).pdf');
    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        try {
            // pdf-parse v1 style or v2 style? Wrapper...
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            console.log('--- RAW TEXT START ---');
            console.log(data.text);
            console.log('--- RAW TEXT END ---');
        } catch (e) {
            console.error('Error:', e);
        }
    } else {
        console.error('File not found:', filePath);
    }
}
main();
