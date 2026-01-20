const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR_OLD = path.join(__dirname, '../../services1');
const DIR_NEW = path.join(__dirname, '../../new checklist');
const OUT_JSON = path.join(__dirname, '../../frontend/public/services.json');
const APPROVED_MAP = path.join(__dirname, '../approved_files_map.json');

// Helper: Smart text extraction
async function extractTextSmart(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const data = await new PDFParse({ data: buffer }).getText();
        let text = data.text;

        if (!text || text.trim().length < 50) {
            console.log(` ! Low text content for ${path.basename(filePath)} (${text ? text.length : 0} chars)`);
            return null;
        }
        return text;
    } catch (e) {
        console.error(` ! Error reading ${path.basename(filePath)}: ${e.message}`);
        return null;
    }
}

// Helper: Clean Text
function cleanText(rawText) {
    // Remove Page Footers
    const rePage = /--\s*\d+\s*of\s*\d+\s*--|Page\s*\d+/gi;
    return rawText.replace(rePage, '');
}

// Helper: Process Text into Sections
function processText(text) {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = {
        title: "Document Checklist",
        items: [],
        icon: "List"
    };

    const reBulletStart = /^[\W\d]+/;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.length < 3) continue;

        if (line.match(/^CHECKLIST$/i)) continue;

        // Header Detection
        const isEndsColon = line.endsWith(':');
        const isAllCap = (line === line.toUpperCase() && /[A-Z]/.test(line));
        const isShort = line.length < 80;
        const hasBullet = reBulletStart.test(line) && !line.match(/^\d{4}/);

        const isHeader = isEndsColon || (isAllCap && isShort && !hasBullet);

        if (isHeader) {
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
            }

            let title = line.replace(/[:]/g, '').trim();
            title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLocaleLowerCase()).join(' ');

            currentSection = {
                title: title,
                items: [],
                icon: "Folder"
            };
        } else {
            let content = line.replace(/^[\d+•\->*)]+\s*/, '').trim();
            if (content.length > 2) {
                currentSection.items.push(content);
            }
        }
    }

    if (currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    return sections;
}

async function main() {
    console.log("Analyzing services for incomplete content...");

    if (!fs.existsSync(APPROVED_MAP)) {
        console.error("Approved map not found.");
        process.exit(1);
    }

    const approvedFiles = JSON.parse(fs.readFileSync(APPROVED_MAP, 'utf8'));
    const services = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));

    let updatedCount = 0;

    const serviceMap = new Map();
    services.forEach((s, idx) => serviceMap.set(s.name, idx));

    for (const fileObj of approvedFiles) {
        const dbName = fileObj.name.toUpperCase().trim();
        const index = serviceMap.get(dbName);

        if (index === undefined) continue;

        const s = services[index];
        const firstItem = s.details.cards[0].items[0];

        // Check for "Please refer..." or very short content
        if (firstItem && (firstItem.includes("refer to the document") || s.details.cards[0].items.length < 2)) {
            console.log(`Processing incomplete service: ${s.name}`);

            const rawText = await extractTextSmart(fileObj.path);

            if (rawText) {
                const cleaned = cleanText(rawText);
                const sections = processText(cleaned);

                // Capture the download card correctly before modifying s.details.cards
                const downloadCard = s.details.cards.find(c => c.title === "Download");

                if (sections.length > 0 && sections[0].items.length > 0) {
                    s.details.cards = [...sections];
                    if (downloadCard) s.details.cards.push(downloadCard);

                    s.details.faqs[0].a = "Please refer to the Document Checklist section for a complete list of requirements.";

                    console.log(`  -> Recovered ${sections.length} sections, ${sections[0].items.length} items.`);
                    updatedCount++;
                } else {
                    console.log(`  -> Structuring failed, falling back to line dump.`);
                    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 5);

                    if (lines.length > 0) {
                        s.details.cards = [{
                            title: "Document Requirements",
                            items: lines,
                            icon: "List"
                        }];

                        // Re-add download card if it exists
                        if (downloadCard) s.details.cards.push(downloadCard);

                        console.log(`  -> Fallback: Dumped ${lines.length} lines.`);
                        updatedCount++;
                    }
                }
            } else {
                console.log(`  -> PDF extraction failed completely.`);
            }
        }
    }

    console.log(`Updated ${updatedCount} services.`);
    fs.writeFileSync(OUT_JSON, JSON.stringify(services, null, 2));
}

main();
