const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR_OLD = path.join(__dirname, '../../services1');
const DIR_NEW = path.join(__dirname, '../../new checklist');
const OUT_JSON = path.join(__dirname, '../../frontend/public/services.json');
const PUBLIC_DOCS_DIR = path.join(__dirname, '../../frontend/public/docs');

async function processFile(dir, file, id) {
    const filePath = path.join(dir, file);
    let items = [];
    try {
        const buffer = fs.readFileSync(filePath);
        const data = await new PDFParse({ data: buffer }).getText();
        items = data.text.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2 && !l.toLowerCase().includes('page') && !l.match(/^\d+$/));
    } catch (e) {
        items = ["Refer to document."];
    }

    const rawName = file.replace(/\.pdf$/i, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const docUrl = `/docs/${encodeURIComponent(file)}`;

    return {
        id: id,
        name: rawName.toUpperCase(),
        title: rawName + " Checklist",
        description: `Requirements and checklist for ${rawName}.`,
        image_path: "",
        details: {
            cards: [
                { title: "Document Checklist", items: items, icon: "List" },
                { title: "Download", content: `Download: <a href="${docUrl}" target="_blank">View PDF</a>`, icon: "Download" }
            ],
            faqs: [
                { q: `Requirements for ${rawName}?`, a: "See checklist." }
            ]
        }
    };
}

async function main() {
    if (!fs.existsSync(PUBLIC_DOCS_DIR)) fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });

    let services = [];
    let idCounter = 1;
    const names = new Set();

    // 1. Old Files
    if (fs.existsSync(DIR_OLD)) {
        const files = fs.readdirSync(DIR_OLD).filter(f => f.toLowerCase().endsWith('.pdf'));
        console.log(`Processing ${files.length} files from services1...`);
        for (const f of files) {
            const s = await processFile(DIR_OLD, f, idCounter++);
            if (!names.has(s.name)) {
                services.push(s);
                names.add(s.name);
                fs.copyFileSync(path.join(DIR_OLD, f), path.join(PUBLIC_DOCS_DIR, f));
            }
        }
    }

    // 2. New Files (Only if not exists)
    if (fs.existsSync(DIR_NEW)) {
        const files = fs.readdirSync(DIR_NEW).filter(f => f.toLowerCase().endsWith('.pdf'));
        console.log(`Processing ${files.length} files from new checklist...`);
        for (const f of files) {
            // Check name first quickly? Or just process
            // We need to match loose naming logic
            const rawName = f.replace(/\.pdf$/i, '').replace(/_/g, ' ').replace(/-/g, ' ').trim().toUpperCase();
            if (names.has(rawName)) continue;

            const s = await processFile(DIR_NEW, f, idCounter++);
            if (!names.has(s.name)) {
                services.push(s);
                names.add(s.name);
                fs.copyFileSync(path.join(DIR_NEW, f), path.join(PUBLIC_DOCS_DIR, f));
            }
        }
    }

    console.log(`Total Services Generated: ${services.length}`);
    fs.writeFileSync(OUT_JSON, JSON.stringify(services, null, 2));
}

main();
