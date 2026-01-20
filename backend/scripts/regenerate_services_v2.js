const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR_OLD = path.join(__dirname, '../../services1');
const DIR_NEW = path.join(__dirname, '../../new checklist');
const OUT_JSON = path.join(__dirname, '../../frontend/public/services.json');
const PUBLIC_DOCS_DIR = path.join(__dirname, '../../frontend/public/docs');

// Helper: Clean and Organize Text
function processTextContent(rawText) {
    const lines = rawText.split('\n');
    const sections = [];
    let currentSection = {
        title: "Document Checklist",
        items: [],
        icon: "List"
    };

    // Regex for Noise
    const rePage = /--\s*\d+\s*of\s*\d+\s*--|Page\s*\d+/i;
    const reBullet = /^[\d]+\.|^•|^-|^|^\*/;

    for (let line of lines) {
        line = line.trim();

        // Skip empty or noise
        if (!line || line.length < 3 || rePage.test(line)) continue;
        if (line.match(/^\d+$/)) continue; // Stray numbers

        // Heuristic for Section Header:
        // 1. All Caps (mostly) AND length < 60 AND no bullet AND doesn't look like a sentence ending in '.'
        // 2. Or ends with ':'
        const isUpperCase = line === line.toUpperCase() && /[A-Z]/.test(line);
        const isHeader = (isUpperCase && line.length < 60 && !reBullet.test(line)) || line.endsWith(':');

        if (isHeader) {
            // Push old section if it has items
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
            }
            // Start new section
            let title = line.replace(':', '').trim();
            // Normalize title
            title = title.charAt(0) + title.slice(1).toLowerCase(); // Sentence case for display? 
            // Actually, let's keep it Title Case
            title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

            currentSection = {
                title: title,
                items: [],
                icon: "Folder" // Default icon for subsections
            };
        } else {
            // It's an item
            // Clean bullet
            let cleanLine = line.replace(reBullet, '').trim();
            if (cleanLine) {
                currentSection.items.push(cleanLine);
            }
        }
    }

    // Push last section
    if (currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    // If we only have "Document Checklist" and we found other sections, maybe merge or re-curate
    // Or just return the list
    if (sections.length === 0) {
        sections.push({ title: "Details", items: ["Please refer to the document."], icon: "AlertCircle" });
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

    try {
        const buffer = fs.readFileSync(filePath);
        // Clean Parsing
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        cards = processTextContent(data.text);
    } catch (err) {
        cards = [{ title: "Error", items: ["Failed to parse document."], icon: "AlertTriangle" }];
    }

    // Add Download Card
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
                    "a": "Please refer to the Document Checklist section for a complete list of requirements."
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
    console.log("Regenerating Services v2...");

    if (!fs.existsSync(PUBLIC_DOCS_DIR)) fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });

    let services = [];
    let idCounter = 2; // Start from 2, reserving 1 for Name Change

    const processedNames = new Set();

    // Add Name Change First
    services.push(NAME_CHANGE_SERVICE);
    processedNames.add("NAME CHANGE");

    // Collect all files
    const allFiles = new Map(); // Name -> FullPath (Prefer New)

    // 1. Old Files
    if (fs.existsSync(DIR_OLD)) {
        fs.readdirSync(DIR_OLD).forEach(f => {
            if (f.toLowerCase().endsWith('.pdf')) {
                const name = f.toLowerCase();
                allFiles.set(name, path.join(DIR_OLD, f));
            }
        });
    }

    // 2. New Files (Overwrite Old)
    if (fs.existsSync(DIR_NEW)) {
        fs.readdirSync(DIR_NEW).forEach(f => {
            if (f.toLowerCase().endsWith('.pdf')) {
                const name = f.toLowerCase();
                allFiles.set(name, path.join(DIR_NEW, f));
            }
        });
    }

    console.log(`Processing ${allFiles.size} unique documents...`);

    // Process
    for (const [key, filePath] of allFiles) {
        const s = await processFile(filePath, idCounter++);

        // Skip if it conflicts with Name Change (unlikely unless file named Name Change.pdf)
        if (processedNames.has(s.name)) continue;

        services.push(s);
        processedNames.add(s.name);

        // Copy File
        const fileName = path.basename(filePath);
        fs.copyFileSync(filePath, path.join(PUBLIC_DOCS_DIR, fileName));
    }

    // Save
    fs.writeFileSync(OUT_JSON, JSON.stringify(services, null, 2));
    console.log(`Generated ${services.length} services.`);
}

main();
