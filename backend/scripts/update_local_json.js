const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../../frontend/public/services.json');
console.log(`Reading from ${jsonPath}`);

if (!fs.existsSync(jsonPath)) {
    console.error("File not found!");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let modifiedCount = 0;

data.forEach(service => {
    let modified = false;

    // Fix spelling
    const fixSpelling = (str) => {
        if (!str) return str;
        return str.replace(/Incorporatin/g, 'Incorporation');
    };

    const newName = fixSpelling(service.name);
    if (service.name !== newName) { service.name = newName; modified = true; }

    const newTitle = fixSpelling(service.title);
    if (service.title !== newTitle) { service.title = newTitle; modified = true; }

    const newDesc = fixSpelling(service.description);
    if (service.description !== newDesc) { service.description = newDesc; modified = true; }

    // Update FAQs
    if (service.details && service.details.faqs) {
        service.details.faqs.forEach(faq => {
            const newQ = fixSpelling(faq.q);
            if (faq.q !== newQ) { faq.q = newQ; modified = true; }

            // Target the generic answer
            if (faq.q.includes('What is needed') && (faq.a.includes('refer to the Document Checklist') || faq.a.includes('refer to the pdfs'))) {
                // Find checklist
                const checklistCard = service.details.cards && service.details.cards.find(c =>
                    c.title.toLowerCase().includes('checklist') ||
                    c.title.toLowerCase().includes('document')
                );

                if (checklistCard && checklistCard.items && checklistCard.items.length > 0) {
                    // Extract items. Some items might be headers (ALL CAPS). We try to include them but maybe limit count.
                    // Let's take up to 8 items.
                    const items = checklistCard.items.slice(0, 8).join(', ');
                    faq.a = `The required documents include: ${items}... (see full checklist).`;
                    modified = true;
                }
            }

            // Update Timeline if generic
            if (faq.q.includes('How long') && faq.a.includes('Timelines vary')) {
                const timeCard = service.details.cards && service.details.cards.find(c =>
                    c.title.toLowerCase().includes('duration') ||
                    c.title.toLowerCase().includes('time')
                );
                if (timeCard) {
                    const content = timeCard.content || (timeCard.items ? timeCard.items.join(', ') : '');
                    if (content) {
                        faq.a = content;
                        modified = true;
                    }
                }
            }

        });
    }

    if (modified) modifiedCount++;
});

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log(`Updated ${modifiedCount} services in ${jsonPath}`);
