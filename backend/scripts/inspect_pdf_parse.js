const pdf = require('pdf-parse');
console.log('require("pdf-parse") result:', pdf);
console.log('Type:', typeof pdf);
// Try to see if it works as a function despite keys?
try {
    pdf(Buffer.from('')).then(() => console.log('Called as function')).catch(e => console.log('Function call error:', e.message));
} catch (e) {
    console.log('Not a function or synchronous error:', e.message);
}

try {
    const path = require('path');
    const cjs = require(path.join(__dirname, '../node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs'));
    console.log('require CJS specific path:', cjs);
} catch (e) {
    console.log('Error requiring CJS path:', e.message);
}
