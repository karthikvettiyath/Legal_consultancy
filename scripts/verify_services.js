const fs = require('fs');
const path = require('path');

const servicesPath = path.join(__dirname, '../frontend/public/services.json');
const docsPath = path.join(__dirname, '../frontend/public/docs');

try {
    const servicesRaw = fs.readFileSync(servicesPath, 'utf8');
    const services = JSON.parse(servicesRaw);

    // Get actual files on disk
    const actualFiles = fs.readdirSync(docsPath);
    const actualFilesSet = new Set(actualFiles.map(f => f.toLowerCase()));

    // Extract links from services
    const linkedFiles = new Set();
    const errors = [];

    services.forEach(service => {
        if (service.details && service.details.cards) {
            service.details.cards.forEach(card => {
                if (card.content && card.content.includes('/docs/')) {
                    const match = card.content.match(/href="\/docs\/([^"]+)"/);
                    if (match) {
                        // Decode URI component because URL has %20 etc
                        const filename = decodeURIComponent(match[1]);
                        linkedFiles.add(filename);

                        if (!actualFilesSet.has(filename.toLowerCase())) {
                            errors.push(`Service "${service.name}" (ID ${service.id}) links to missing file: ${filename}`);
                        }
                    }
                }
            });
        }
    });

    // Check for services without links
    const servicesWithoutLinks = [];
    services.forEach(service => {
        let hasLink = false;
        if (service.details && service.details.cards) {
            service.details.cards.forEach(card => {
                if (card.content && card.content.includes('/docs/')) {
                    hasLink = true;
                }
            });
        }
        if (!hasLink) {
            servicesWithoutLinks.push(`${service.name} (ID: ${service.id})`);
        }
    });

    const orphanFiles = actualFiles.filter(f => !Array.from(linkedFiles).some(lf => lf.toLowerCase() === f.toLowerCase()));

    console.log('--- VERIFICATION REPORT ---');
    if (errors.length > 0) {
        console.log('ERRORS (Missing Files):');
        errors.forEach(e => console.log(e));
    } else {
        console.log('✅ All provided links are valid.');
    }

    if (servicesWithoutLinks.length > 0) {
        console.log('\nWARNING: Services without PDF links:');
        servicesWithoutLinks.forEach(s => console.log(s));
    } else {
        console.log('\n✅ All services have PDF links.');
    }

    if (orphanFiles.length > 0) {
        console.log('\nORPHAN FILES (Exist in /docs but not linked in services.json):');
        orphanFiles.forEach(f => console.log(f));
    } else {
        console.log('\n✅ All files in /docs are used.');
    }

} catch (e) {
    console.error('Error running verification:', e);
}
