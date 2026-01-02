const xlsx = require('xlsx');
const path = require('path');

const filePath = String.raw`d:\Legal_consultancy\client data\JESNA CLIENT DATA SHEET.xlsx`;

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers (first row)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = jsonData[0];

    console.log("Headers found:", headers);

    // Print first few rows of data to verify content
    console.log("First 2 rows of data:", jsonData.slice(1, 3));
} catch (error) {
    console.error("Error reading file:", error);
}
