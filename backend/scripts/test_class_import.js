const { PDFParse } = require('pdf-parse');
console.log('PDFParse import:', PDFParse);
try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../Sales Agreement format.pdf');
    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        // Try intended usage
        try {
            const parser = new PDFParse({ data: buffer }); // Assuming this constructor signature
            parser.getText().then(data => {
                console.log('Text extracted successfully:', data.text.substring(0, 100));
            }).catch(e => console.error('getText error:', e));
        } catch (e) {
            console.error('Constructor error:', e);
        }
    }
} catch (e) {
    console.error('File read error', e);
}
