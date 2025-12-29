const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function main() {
    const filePath = path.join(__dirname, '../../frontend/public/docs/trade_lisence_form.pdf');
    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        try {
            // pdf-parse v1 style or v2 style? Wrapper...
            // Since previous script worked with { PDFParse }, sticking to that.
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            console.log('--- RAW TEXT START ---');
            console.log(data.text);
            console.log('--- RAW TEXT END ---');
        } catch (e) {
            console.error('Error:', e);
        }
    } else {
        console.error('File not found');
    }
}
main();
