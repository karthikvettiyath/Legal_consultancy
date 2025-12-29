const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const rootDir = path.join(__dirname, '../../');
const servicesPath = path.join(rootDir, 'frontend/public/services.json');
const docsDir = path.join(rootDir, 'frontend/public/docs');

async function main() {
    if (!fs.existsSync(servicesPath)) {
        console.error("services.json not found");
        return;
    }

    const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    let updatedCount = 0;

    for (const service of services) {
        // Skip if no details or cards
        if (!service.details || !service.details.cards) continue;

        const downloadCard = service.details.cards.find(c => c.title === 'Download');
        const checklistCard = service.details.cards.find(c => c.title === 'Document Checklist');

        if (!downloadCard || !checklistCard) continue;

        // Check if items need update (empty or generic)
        const items = checklistCard.items || [];
        const isGeneric = items.length === 0 ||
            (items.length === 1 && items[0].includes("Please refer to"));

        // Find PDF path
        const match = downloadCard.content.match(/href="\/docs\/([^"]+)"/);
        if (!match) continue;

        const filename = decodeURIComponent(match[1]);
        const pdfPath = path.join(docsDir, filename);

        if (fs.existsSync(pdfPath)) {
            try {
                const buffer = fs.readFileSync(pdfPath);
                const parser = new PDFParse({ data: buffer });
                const data = await parser.getText();
                const text = data.text;
                const pdfTextLower = text.toLowerCase();

                let shouldUpdate = true; // Always try to extract more from PDF

                // If not generic, we still check integrity but we want to ENRICH the content
                // So we disregard 'isGeneric' check and run extraction logic always. 
                // We will only overwrite if we find MORE lines or BETTER lines.
                // But for now, let's just force update if we can read the PDF because current items are likely truncated (previous script capped at 20 lines)

                // Keep the mismatch log for info
                if (!isGeneric) {
                    const jsonText = items.join(' ').toLowerCase();
                    const jsonTokens = jsonText.split(/\s+/).filter(w => w.length > 4);
                    const uniqueTokens = [...new Set(jsonTokens)];

                    let found = 0;
                    uniqueTokens.forEach(token => {
                        if (pdfTextLower.includes(token)) found++;
                    });

                    const score = uniqueTokens.length > 0 ? (found / uniqueTokens.length) : 0;

                    if (uniqueTokens.length <= 3 || (uniqueTokens.length > 3 && score < 0.3)) {
                        console.log(`⚠️  Mismatch/Sparse found for "${service.name}" (Tokens: ${uniqueTokens.length}, Score: ${(score * 100).toFixed(1)}%). Re-extracting.`);
                    } else {
                        console.log(`ℹ️  Service "${service.name}" seems okay, but re-extracting to ensure full detail.`);
                    }
                }

                if (shouldUpdate) {
                    const lines = text.split('\n')
                        .map(l => l.trim())
                        .filter(l => l.length > 2) // Ignore very short
                        .filter(l => !l.toLowerCase().includes('page')) // Ignore page numbers
                        .filter(l => !l.toLowerCase().includes('scanned by'))
                        .filter(l => !/^--\s*\d+\s*of\s*\d+\s*--$/.test(l)) // Ignore "-- 1 of 2 --"
                        // Remove lines that are just the Service Name (heuristic)
                        .filter(l => l.toLowerCase() !== service.name.toLowerCase());

                    let extractedItems = [];
                    let notesItems = [];

                    // Separate Notes and Items
                    lines.forEach(line => {
                        const lower = line.toLowerCase();
                        if (lower.startsWith('note:') || lower.startsWith('nb:') || lower.startsWith('important:')) {
                            notesItems.push(line);
                        } else {
                            extractedItems.push(line);
                        }
                    });

                    // Strategy where to start items
                    const startIdx = extractedItems.findIndex(l => l.toLowerCase().includes('check list') || l.toLowerCase().includes('checklist'));
                    if (startIdx !== -1 && startIdx < 5) {
                        extractedItems = extractedItems.slice(startIdx + 1);
                    }

                    // Limit checks
                    extractedItems = extractedItems.slice(0, 100);

                    if (extractedItems.length === 0) {
                        // Fallback for image-only or empty text
                        extractedItems = ["Please refer to the downloadable document for the complete checklist."];
                    }

                    checklistCard.items = extractedItems;
                    console.log(`✅ Updated checklist for: ${service.name}`);
                    updatedCount++;

                    // Add Notes Card if found and doesn't exist
                    if (notesItems.length > 0) {
                        let notesCard = service.details.cards.find(c => c.title === 'Important Notes');
                        if (!notesCard) {
                            notesCard = {
                                title: "Important Notes",
                                content: "",
                                items: notesItems,
                                icon: "AlertCircle" // Assuming this icon exists or generic
                            };
                            // Insert before Download card
                            const downloadIdx = service.details.cards.findIndex(c => c.title === 'Download');
                            if (downloadIdx !== -1) {
                                service.details.cards.splice(downloadIdx, 0, notesCard);
                            } else {
                                service.details.cards.push(notesCard);
                            }
                            console.log(`   + Added "Important Notes" section.`);
                        } else {
                            // Update existing notes? Maybe.
                            notesCard.items = notesItems;
                            console.log(`   * Updated "Important Notes" section.`);
                        }
                    }
                }

            } catch (e) {
                console.error(`❌ Error reading ${filename}: ${e.message}`);
            }
        } else {
            console.error(`❌ PDF not found: ${filename}`);
        }
    }

    if (updatedCount > 0) {
        fs.writeFileSync(servicesPath, JSON.stringify(services, null, 2));
        console.log(`\nSuccess! Updated ${updatedCount} services.`);
    } else {
        console.log("\nNo services needed updates.");
    }
}

main();
