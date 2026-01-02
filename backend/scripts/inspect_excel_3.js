const xlsx = require('xlsx');
const path = require('path');

const filePath = String.raw`d:\Legal_consultancy\client data\Soumya CLIENT DATA SHEET.xlsx`;

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers (first row)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("Headers (Row 0):", jsonData[0]);
    console.log("Row 1:", jsonData[1]);
} catch (error) {
    console.error("Error reading file:", error);
}
