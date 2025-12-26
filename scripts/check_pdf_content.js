const fs = require('fs');
const path = require('path');
const pdf = require('../backend/node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs');
console.log('Keys:', Object.keys(pdf));
// process.exit(0);

const servicesPath = path.join(__dirname, '../frontend/public/services.json');
const docsPath = path.join(__dirname, '../frontend/public/docs');

async function checkContent() {
    const servicesRaw = fs.readFileSync(servicesPath, 'utf8');
    const services = JSON.parse(servicesRaw);

    console.log('--- CONTENT VERIFICATION START ---\n');

    for (const service of services) {
        if (!service.details || !service.details.cards) continue;

        let pdfFile = null;
        let jsonKeywords = [];

        // 1. Find the PDF file and collect JSON keywords
        service.details.cards.forEach(card => {
            // Collect keywords from items
            if (card.items) {
                card.items.forEach(item => {
                    // Split into words, ignore small words
                    const words = item.split(/\s+/).filter(w => w.length > 3).map(w => w.toLowerCase());
                    jsonKeywords.push(...words);
                });
            }

            // Find PDF link
            if (card.content && card.content.includes('/docs/')) {
                const match = card.content.match(/href="\/docs\/([^"]+)"/);
                if (match) {
                    pdfFile = decodeURIComponent(match[1]);
                }
            }
        });

        if (pdfFile) {
            const filePath = path.join(docsPath, pdfFile);
            if (fs.existsSync(filePath)) {
                try {
                    const dataBuffer = fs.readFileSync(filePath);
                    const data = await pdf(dataBuffer);
                    const pdfText = data.text.toLowerCase();

                    // 2. Check overlap
                    let matchCount = 0;
                    const uniqueKeywords = [...new Set(jsonKeywords)];

                    if (uniqueKeywords.length === 0) {
                        console.log(`⚠️  Service "${service.name}": No text content in JSON to compare.`);
                        continue;
                    }

                    uniqueKeywords.forEach(word => {
                        if (pdfText.includes(word)) {
                            matchCount++;
                        }
                    });

                    const score = (matchCount / uniqueKeywords.length) * 100;

                    if (score < 10) { // Very low match
                        console.log(`❌ Service "${service.name}" (PDF: ${pdfFile})`);
                        console.log(`   Low content match! Only ${score.toFixed(1)}% of JSON keywords found in PDF.`);
                        console.log(`   (Matched ${matchCount} of ${uniqueKeywords.length} unique words)`);
                    } else if (score < 40) {
                        console.log(`⚠️  Service "${service.name}" (PDF: ${pdfFile})`);
                        console.log(`   Moderate match: ${score.toFixed(1)}%`);
                    } else {
                        // console.log(`✅ Service "${service.name}": Good match (${score.toFixed(1)}%)`);
                    }

                } catch (e) {
                    console.error(`Error reading PDF ${pdfFile}:`, e.message);
                }
            }
        }
    }
    console.log('\n--- CONTENT VERIFICATION END ---');
}

checkContent();
