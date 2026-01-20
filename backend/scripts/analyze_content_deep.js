const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR_OLD = path.join(__dirname, '../../services1');
const DIR_NEW = path.join(__dirname, '../../new checklist');
const OUT_JSON = path.join(__dirname, '../../frontend/public/services.json');

// Helper: Normalize String for comparison (remove spaces, special chars, lowercase)
const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

// Helper: Content Similarity Check (Jaccard Index on set of words)
function getSimilarity(textA, textB) {
    if (!textA || !textB) return 0;
    const setA = new Set(textA.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const setB = new Set(textB.toLowerCase().split(/\W+/).filter(w => w.length > 3));

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
}

// Helper: Parse PDF Text
async function getPdfText(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const data = await new PDFParse({ data: buffer }).getText();
        return data.text || "";
    } catch (e) {
        return "";
    }
}

async function main() {
    console.log("Analyzing content for redundancy and empty files...");

    const allFiles = []; // { name, path, text, origin }

    // 1. Gather all files
    const dirs = [
        { path: DIR_OLD, name: 'services1' },
        { path: DIR_NEW, name: 'new checklist' }
    ];

    for (const d of dirs) {
        if (!fs.existsSync(d.path)) continue;
        const files = fs.readdirSync(d.path).filter(f => f.toLowerCase().endsWith('.pdf'));

        for (const f of files) {
            const fullPath = path.join(d.path, f);
            const text = await getPdfText(fullPath);
            allFiles.push({
                fileName: f,
                name: f.replace(/\.pdf$/i, ''),
                path: fullPath,
                text: text,
                cleanText: normalize(text),
                origin: d.name
            });
        }
    }

    console.log(`Total files scanned: ${allFiles.length}`);

    // 2. Identify Empty Files
    const emptyFiles = allFiles.filter(f => f.cleanText.length < 50); // Arbitrary threshold
    console.log(`\nFound ${emptyFiles.length} potentially empty/unreadable files:`);
    emptyFiles.forEach(f => console.log(` - [${f.origin}] ${f.fileName} (Length: ${f.cleanText.length})`));

    // 3. Identify Redundant Content (Duplicate content -> prioritize 'new checklist' or longer content)
    // We will group by close text similarity or identical names
    const uniqueServices = []; // Final list to keep
    const redundant = [];

    // Sort by length desc (keep most detailed version usually)
    // But also prefer 'new checklist' if similar? 
    // Let's sort: New first, then by text length?
    // Actually user said "compare... and remove redundant". 
    // If name is similar OR content is similar.

    // We'll proceed greedily.
    const usedIndices = new Set();

    for (let i = 0; i < allFiles.length; i++) {
        if (usedIndices.has(i)) continue;

        const current = allFiles[i];
        const group = [current];
        usedIndices.add(i);

        for (let j = i + 1; j < allFiles.length; j++) {
            if (usedIndices.has(j)) continue;

            const other = allFiles[j];

            // Criteria 1: Name Similarity (Normalized name match)
            const nameMatch = normalize(current.name) === normalize(other.name);

            // Criteria 2: Content Similarity (> 0.85)
            const similarity = getSimilarity(current.text, other.text);
            const contentMatch = similarity > 0.85;

            if (nameMatch || contentMatch) {
                group.push(other);
                usedIndices.add(j);
                console.log(`   Match found: "${current.fileName}" == "${other.fileName}" (Name: ${nameMatch}, Sim: ${similarity.toFixed(2)})`);
            }
        }

        // Resolve Group: Pick Best
        // Preference: Longer text? Or from 'new checklist'?
        // Rule: Pick file from 'new checklist' if available, else longest text.
        group.sort((a, b) => {
            if (a.origin !== b.origin) {
                return a.origin === 'new checklist' ? -1 : 1; // Prefer new
            }
            return b.cleanText.length - a.cleanText.length; // Prefer longer
        });

        const selected = group[0];
        uniqueServices.push(selected);

        if (group.length > 1) {
            redundant.push(...group.slice(1));
        }
    }

    console.log(`\nUnique Services Retained: ${uniqueServices.length}`);
    console.log(`Redundant Services Removed: ${redundant.length}`);

    // 4. Save List of "Approved" files/paths for next step (regeneration)
    // We'll write to a JSON file to be used by the generator script
    fs.writeFileSync('approved_files_map.json', JSON.stringify(uniqueServices.map(s => ({
        path: s.path,
        name: s.name,
        fileName: s.fileName
    })), null, 2));

    console.log("Saved approved file list to 'approved_files_map.json'. Run generation script next.");
}

main();
