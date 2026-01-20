const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR_OLD = path.join(__dirname, '../../services1');
const DIR_NEW = path.join(__dirname, '../../new checklist');
const OUT_JSON = path.join(__dirname, '../../frontend/public/services.json');
const PUBLIC_DOCS_DIR = path.join(__dirname, '../../frontend/public/docs');
const APPROVED_MAP = path.join(__dirname, '../approved_files_map.json');

// Helper: Clean and Organize Text
function processTextContent(rawText) {
    // 1. Basic Filters
    const lines = rawText.split('\n');
    const sections = [];
    let currentSection = {
        title: "Document Checklist",
        items: [],
        icon: "List"
    };

    // Regex for Noise
    const rePage = /--\s*\d+\s*of\s*\d+\s*--|Page\s*\d+/i;
    // const reBullet = /^[\d]+\.|^•|^-|^|^\*/; // Stricter? 
    const reBullet = /^(\d+[\.\)]\s*|•\s*|-\s*|\s*|\*\s*)/;

    for (let line of lines) {
        line = line.trim();

        // Skip empty or noise or just numbers
        if (!line || line.length < 3 || rePage.test(line)) continue;
        if (line.match(/^\d+$/)) continue;

        // Heuristic for Section Header:
        // 1. All Caps (mostly) AND length < 80 AND no bullet AND doesn't look like a sentence ending in '.'
        // 2. Or ends with ':'
        const isUpperCase = line === line.toUpperCase() && /[A-Z]/.test(line);
        const isHeader = (isUpperCase && line.length < 80 && !reBullet.test(line)) || line.endsWith(':');

        if (isHeader) {
            // Push old section if it has items
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
            }
            // Start new section
            let title = line.replace(':', '').trim();
            // Title Case
            title = title.split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');

            currentSection = {
                title: title,
                items: [],
                icon: "Folder"
            };
        } else {
            // It's an item
            // Clean bullet
            let cleanLine = line.replace(reBullet, '').trim();
            if (cleanLine.length > 1) {
                // Check if it's junk like "Signature of applicant" if that appears a lot or form placeholders?
                // For now, accept it.
                currentSection.items.push(cleanLine);
            }
        }
    }

    // Push last section
    if (currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    // Fallback
    if (sections.length === 0) {
        return [{ title: "Details", items: ["Please refer to the document."], icon: "AlertCircle" }];
    }

    return sections;
}

// Name Change Service Definition
const NAME_CHANGE_SERVICE = {
    id: 1, // Will force to top
    name: "NAME CHANGE",
    title: "Name Change Checklist",
    description: "Requirements and checklist for Name Change via Gazette.",
    image_path: "",
    details: {
        cards: [
            {
                title: "Process Overview",
                content: "Changing your name involves three main steps: Affidavit, Newspaper Publication, and Gazette Notification.",
                items: [],
                icon: "Info"
            },
            {
                title: "Documents Required",
                items: [
                    "Affidavit on Non-Judicial Stamp Paper (min. value)",
                    "Original Newspaper Advertisement (one English, one Regional)",
                    "Performance Proforma (in duplicate)",
                    "Passport size photographs (2)",
                    "Self-attested copy of ID Proof (Aadhaar/PAN/Passport)",
                    "CD containing the soft copy of the application (in MS Word)",
                    "Request letter to the Controller of Publications",
                    "Demand Draft for the required fee"
                ],
                icon: "List"
            }
        ],
        faqs: [
            {
                q: "How long does it take?",
                a: "The Gazette publication usually takes 15-30 days after submission."
            }
        ]
    }
};

async function processFile(filePath, idCounter) {
    const fileName = path.basename(filePath);
    let cards = [];
    let itemsFound = false;

    try {
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        cards = processTextContent(data.text);

        // Check if actually empty cards
        if (cards.length === 1 && cards[0].items[0] === "Please refer to the document.") {
            // It failed parsing or was empty
        } else {
            itemsFound = true;
        }

    } catch (err) {
        cards = [{ title: "Error", items: ["Failed to parse document."], icon: "AlertTriangle" }];
    }

    // Add Download Card - THIS MUST BE THERE regardless of parsing success
    const docUrl = `/docs/${encodeURIComponent(fileName)}`;
    cards.push({
        title: "Download",
        content: `Download the official document here: <a href="${docUrl}" target="_blank" class="text-blue-500 underline">View PDF</a>`,
        items: [],
        icon: "Download"
    });

    const rawName = fileName.replace(/\.pdf$/i, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        id: idCounter,
        name: rawName.toUpperCase(),
        title: rawName + " Checklist",
        description: `Requirements and checklist for ${rawName}.`,
        image_path: "",
        details: {
            cards: cards,
            faqs: [
                {
                    "q": `What is needed for ${rawName}?`,
                    "a": itemsFound ? "Please refer to the Document Checklist section for a complete list of requirements." : "Please download the PDF to view requirements."
                },
                {
                    "q": "How long does the process take?",
                    "a": "Timelines vary based on government processing. Please contact us for an estimate."
                }
            ]
        }
    };
}

async function main() {
    console.log("Regenerating Services v3 (Filtered & Cleaned)...");

    if (!fs.existsSync(PUBLIC_DOCS_DIR)) fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });

    let services = [];
    let idCounter = 2; // Start from 2

    // 1. Add Name Change
    services.push(NAME_CHANGE_SERVICE);

    // 2. Load Approved List (from Step 1)
    if (!fs.existsSync(APPROVED_MAP)) {
        console.error("Approved map not found! Run analyze_content_deep.js first.");
        process.exit(1);
    }

    const approvedFiles = JSON.parse(fs.readFileSync(APPROVED_MAP, 'utf8'));
    console.log(`Processing ${approvedFiles.length} approved documents...`);

    const processedNames = new Set();
    processedNames.add("NAME CHANGE"); // Reserve

    for (const fileObj of approvedFiles) {
        // Skip purely based on name conflict (though analysis step should have handled most)
        // But let's be safe against Case differences
        const dbName = fileObj.name.toUpperCase().trim();
        if (processedNames.has(dbName)) continue;

        // Process
        const s = await processFile(fileObj.path, idCounter++);
        services.push(s);
        processedNames.add(s.name);

        // Copy File
        fs.copyFileSync(fileObj.path, path.join(PUBLIC_DOCS_DIR, fileObj.fileName));
    }

    // Save
    fs.writeFileSync(OUT_JSON, JSON.stringify(services, null, 2));
    console.log(`Generated ${services.length} services.`);
}

main();
