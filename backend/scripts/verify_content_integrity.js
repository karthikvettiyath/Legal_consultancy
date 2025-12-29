const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const rootDir = path.join(__dirname, '../../');
const servicesPath = path.join(rootDir, 'frontend/public/services.json');
const docsDir = path.join(rootDir, 'frontend/public/docs');
const reportPath = path.join(__dirname, 'integrity_report.txt');

async function main() {
    fs.writeFileSync(reportPath, '--- INTEGRITY CHECK START ---\n');

    // Check if services file exists
    if (!fs.existsSync(servicesPath)) {
        fs.appendFileSync(reportPath, 'Services file not found\n');
        return;
    }

    const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));

    for (const service of services) {
        if (!service.details || !service.details.cards) continue;

        const downloadCard = service.details.cards.find(c => c.title === 'Download');
        const checklistCard = service.details.cards.find(c => c.title === 'Document Checklist');

        if (!downloadCard || !checklistCard) continue;

        const items = checklistCard.items || [];
        const jsonText = items.join(' ').toLowerCase();

        if (items.length < 2) {
            fs.appendFileSync(reportPath, `⚠️  Service "${service.name}": Very few items (${items.length}). Might be empty.\n`);
            continue;
        }

        const match = downloadCard.content.match(/href="\/docs\/([^"]+)"/);
        if (match) {
            const filename = decodeURIComponent(match[1]);
            const pdfPath = path.join(docsDir, filename);

            if (fs.existsSync(pdfPath)) {
                try {
                    const buffer = fs.readFileSync(pdfPath);
                    const parser = new PDFParse({ data: buffer });
                    const data = await parser.getText();
                    const pdfText = data.text.toLowerCase();

                    const jsonTokens = jsonText.split(/\s+/).filter(w => w.length > 4);
                    const uniqueTokens = [...new Set(jsonTokens)];

                    let found = 0;
                    uniqueTokens.forEach(token => {
                        if (pdfText.includes(token)) found++;
                    });

                    const score = uniqueTokens.length > 0 ? (found / uniqueTokens.length) : 0;

                    if (score < 0.4) {
                        fs.appendFileSync(reportPath, `❌ MISMATCH SUSPECTED: "${service.name}"\n`);
                        fs.appendFileSync(reportPath, `   PDF: ${filename}\n`);
                        fs.appendFileSync(reportPath, `   Match Score: ${(score * 100).toFixed(1)}%\n`);
                        fs.appendFileSync(reportPath, `   JSON Tokens: ${uniqueTokens.length}\n`);
                    } else if (score < 0.6) {
                        fs.appendFileSync(reportPath, `⚠️  Low Match: "${service.name}" (${(score * 100).toFixed(1)}%)\n`);
                    }

                } catch (e) {
                    fs.appendFileSync(reportPath, `Error reading ${filename}: ${e.message}\n`);
                }
            } else {
                fs.appendFileSync(reportPath, `PDF not found: ${filename}\n`);
            }
        }
    }
    fs.appendFileSync(reportPath, '\n--- INTEGRITY CHECK END ---\n');
}

main();
