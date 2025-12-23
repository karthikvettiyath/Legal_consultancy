const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const rootDir = path.join(__dirname, '../../');
const destDir = path.join(rootDir, 'frontend/public/docs');
const jsonOutputPath = path.join(rootDir, 'frontend/public/services.json');

async function main() {
    try {
        // Ensure dest dir exists
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Find PDFs in root
        const files = fs.readdirSync(rootDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDFs to process.`);

        const services = [];
        let idCounter = 1;

        for (const file of pdfFiles) {
            console.log(`Processing: ${file}`);
            const filePath = path.join(rootDir, file);

            // 1. Read PDF Context
            let pdfText = "";
            let items = [];
            try {
                const dataBuffer = fs.readFileSync(filePath);
                
                // Use v2 API
                // Assuming it accepts { data: buffer } or similar to pdfjs-dist
                // If { data: ... } fails, try passing buffer directly or check if it needs Uint8Array
                const parser = new PDFParse({ data: dataBuffer });
                const data = await parser.getText();
                pdfText = data.text;

                // Naive extraction: Split by newlines, filter empty, take first 15 meaningful lines
                items = pdfText
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 3 && !l.toLowerCase().includes('page'))
                    .slice(0, 15);

            } catch (err) {
                console.error(`  -> Failed to read PDF text: ${err.message}`);
                items = ["Please refer to the document for details."];
            }

            // 2. Move file (Copy first)
            const newPath = path.join(destDir, file);
            fs.copyFileSync(filePath, newPath);

            // 3. Prepare Data
            const title = file.replace(/\.pdf$/i, '')
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/CHECKLIST/i, '')
                .trim();

            const name = title.toUpperCase();
            const description = `Requirements and checklist for ${title}.`;
            const docUrl = `/docs/${encodeURIComponent(file)}`;

            const details = {
                cards: [
                    {
                        title: "Document Checklist",
                        content: "",
                        items: items,
                        icon: "List"
                    },
                    {
                        title: "Download",
                        content: `Download the official document here: <a href="${docUrl}" target="_blank" class="text-blue-500 underline">View PDF</a>`,
                        items: [],
                        icon: "Download"
                    }
                ],
                faqs: [
                    {
                        q: `What is needed for ${title}?`,
                        a: "Please refer to the Document Checklist section for a complete list of requirements."
                    },
                    {
                        q: "How long does the process take?",
                        a: "Timelines vary based on government processing. Please contact us for an estimate."
                    }
                ]
            };

            services.push({
                id: idCounter++,
                name: name,
                title: title + " Checklist",
                description: description,
                image_path: '',
                details: details
            });
        }

        fs.writeFileSync(jsonOutputPath, JSON.stringify(services, null, 2));
        console.log(`Successfully generated services.json with ${services.length} services.`);

    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

main();
