const fs = require('fs');
const path = require('path');

const servicesPath = path.join(__dirname, '../../frontend/public/services.json');

const poiList = [
    "1. Passport", "2. PAN Card", "3. Ration/ PDS Photo Card", "4. Voter ID", "5. Driving License",
    "6. Government Photo ID Cards/ Service photo identity card issued by PSU", "7. NREGS Job Card",
    "8. Photo ID issued by Recognized Educational Institution", "9. Arms License", "10. Photo Bank ATM Card",
    "11. Photo Credit Card", "12. Pensioner Photo Card", "13. Freedom Fighter Photo Card", "14. Kissan Photo Passbook",
    "15. CGHS/ ECHS Photo Card", "16. Address Card having Name and Photo issued by Department of Posts",
    "17. Certificate of Identity having photo issued by Gazetted Officer or Tehsildar on UIDAI standard certificate format for enrolment/ update",
    "18. Disability ID Card/ handicapped medical certificate issued by the respective State/ UT Governments/ Administrations",
    "19. Bhamashah Card/Jan-Aadhaar card issued by Govt. of Rajasthan",
    "20. Certificate from Superintendent/ Warden/ Matron/ Head of Institution of recognized shelter homes or orphanages etc. on UIDAI standard certificate format for enrolment/ update",
    "21. Certificate of Identity having photo issued by MP or MLA or MLC or Municipal Councilor on UIDAI standard certificate format for enrolment/ update",
    "22. Certificate of Identity having photo issued by Village Panchayat Head or Mukhiya or its equivalent authority (for rural areas) on UIDAI standard certificate format for enrolment/ update",
    "23. Gazette notification for name change", "24. Marriage certificate with photograph", "25. RSBY Card",
    "26. SSLC book having candidates photograph", "27. ST/ SC/ OBC certificate with photograph",
    "28. School Leaving Certificate (SLC)/ School Transfer Certificate (TC), containing name and photograph",
    "29. Extract of School Records issued by Head of School containing name and photograph",
    "30. Bank Pass Book having name and photograph",
    "31. Certificate of Identity containing name and photo issued by Recognized Educational Institution signed by Head of Institute on UIDAI standard certificate format for enrolment/ update.",
    "32. Certificate of identity containing Name, DOB and Photograph issued by Employees’ Provident Fund Organisation (EPFO) on UIDAI standard certificate format for enrolment/ update"
];

const porList = [
    "1. PDS Card", "2. MNREGA Job Card", "3. CGHS/ State Government/ ECHS/ ESIC Medical card", "4. Pension Card",
    "5. Army Canteen Card", "6. Passport",
    "7. Birth Certificate issued by Registrar of Birth, Municipal Corporation and other notified local government bodies like Taluk, Tehsil etc.",
    "8. Any other Central/ State government issued family entitlement document", "9. Marriage Certificate issued by the government",
    "10. Address card having name and photo issued by Department of Posts", "11. Bhamashah Card/Jan-Aadhaar card issued by Govt. of Rajasthan",
    "12. Discharge card/ slip issued by Government hospitals for birth of a child",
    "13. Certificate of Identity having photo issued by MP or MLA or MLC or Municipal Councilor or Gazetted Officer on UIDAI standard certificate format for enrolment/ update",
    "14. Certificate of Identity having photo and relationship with HoF issued by Village Panchayat Head or Mukhiya or its equivalent authority (for rural areas) on UIDAI standard certificate format for enrolment/ update"
];

const dobList = [
    "1. Birth Certificate", "2. SSLC Book/ Certificate", "3. Passport",
    "4. Certificate of Date of Birth issued by Group A Gazetted Officer on UIDAI standard certificate format for enrolment/ update",
    "5. A certificate (on UIDAI standard certificate format for enrolment/ update) or ID Card having photo and Date of Birth (DOB) duly signed and issued by a Government authority",
    "6. Photo ID card having Date of Birth, issued by Recognized Educational Institution", "7. PAN Card",
    "8. Marksheet issued by any Government Board or University",
    "9. Government Photo ID Card/ Photo Identity Card issued by PSU containing DOB", "10. Central/ State Pension Payment Order",
    "11. Central Government Health Service Scheme Photo Card or Ex-Servicemen Contributory Health Scheme Photo card",
    "12. School Leaving Certificate (SLC)/ School Transfer Certificate (TC), containing Name and Date of Birth",
    "13. Extract of School Records issued by Head of School containing Name, Date of Birth and Photograph",
    "14. Certificate of Identity containing Name, DOB and Photo issued by Recognized Educational Institution signed by Head of Institute on UIDAI standard certificate format for enrolment/ update",
    "15. Certificate of identity containing Name, DOB and Photograph issued by Employees’ Provident Fund Organisation (EPFO) on UIDAI standard certificate format for enrolment/ update"
];

const poaList = [
    "1. Passport", "2. Bank Statement/ Passbook", "3. Post Office Account Statement/ Passbook", "4. Ration Card", "5. Voter ID",
    "6. Driving License", "7. Government Photo ID cards/ service photo identity card issued by PSU",
    "8. Electricity Bill (not older than 3 months)", "9. Water Bill (not older than 3 months)",
    "10. Telephone Landline Bill (not older than 3 months)", "11. Property Tax Receipt (not older than 1 year)",
    "12. Credit Card Statement (not older than 3 months)", "13. Insurance Policy",
    "14. Signed Letter having Photo from Bank on letterhead", "15. Signed Letter having Photo issued by registered Company on letterhead",
    "16. Signed Letter having Photo issued by Recognized Educational Institution on letterhead or Photo ID having address issued by Recognized Educational Institution",
    "17. NREGS Job Card", "18. Arms License", "19. Pensioner Card", "20. Freedom Fighter Card", "21. Kissan Passbook",
    "22. CGHS/ ECHS Card",
    "23. Certificate of Address having photo issued by MP or MLA or MLC or Gazetted Officer or Tehsildar on UIDAI standard certificate format for enrolment/ update",
    "24. Certificate of Address issued by Village Panchayat head or its equivalent authority (for rural areas) on UIDAI standard certificate format for enrolment/ update",
    "25. Income Tax Assessment Order", "26. Vehicle Registration Certificate", "27. Registered Sale/ Lease/ Rent Agreement",
    "28. Address Card having Photo issued by Department of Posts", "29. Caste and Domicile Certificate having Photo issued by State Govt",
    "30. Disability ID Card/ handicapped medical certificate issued by the respective State/ UT Governments/ Administrations",
    "31. Gas Connection Bill (not older than 3 months)", "32. Passport of Spouse", "33. Passport of Parents (in case of Minor)",
    "34. Allotment letter of accommodation issued by Central/ State Govt. (not more than 3 years old)",
    "35. Marriage Certificate issued by the Government, containing address", "36. Bhamashah Card/Jan-Aadhaar card issued by Govt. of Rajasthan",
    "37. Certificate from Superintendent/ Warden/ Matron/ Head of Institution of recognized shelter homes or orphanages etc. on UIDAI standard certificate format for enrolment/ update",
    "38. Certificate of Address having photo issued by Municipal Councillor on UIDAI standard certificate format for enrolment/ update",
    "39. Identity Card issued by recognized educational institutions", "40. SSLC book having photograph", "41. School Identity card",
    "42. School Leaving Certificate (SLC)/ School Transfer Certificate (TC), containing Name and Address",
    "43. Extract of School Records containing Name, Address and Photograph issued by Head of School",
    "44. Certificate of Identity containing Name, Address and Photo issued by Recognized Educational Institution signed by Head of Institute on UIDAI standard certificate format for enrolment/ update",
    "45. Certificate of identity containing Name, DOB and Photograph issued by Employees’ Provident Fund Organisation (EPFO) on UIDAI standard certificate format for enrolment/ update"
];

const instructionList = [
    "Certificate must be printed on Plain paper.",
    "Form must be submitted within 3 months of date of issue.",
    "No overwriting in the form.",
    "Certifier details must be filled in properly.",
    "Use BLOCK LETTERS only.",
    "Resident signature or thumb impression is mandatory.",
    "Latest colored photograph of 3.5cm X 4.5 cm should be pasted.",
    "Certifier cross sign & cross stamp must be available on the resident photograph."
];

async function updateService() {
    const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    const serviceIndex = services.findIndex(s => s.id === 1 || s.name.includes("AADHAAR"));

    if (serviceIndex === -1) {
        console.error("Service not found");
        return;
    }

    const service = services[serviceIndex];
    console.log(`Updating service: ${service.name}`);

    // Rebuild cards
    service.details.cards = [
        {
            title: "Proof of Identity (POI)",
            content: "Documents containing Name and Photo",
            items: poiList,
            icon: "User"
        },
        {
            title: "Proof of Address (POA)",
            content: "Documents containing Name and Address",
            items: poaList,
            icon: "MapPin"
        },
        {
            title: "Proof of Relationship (POR)",
            content: "Documents containing Name of applicant and Name of HoF",
            items: porList,
            icon: "Users"
        },
        {
            title: "Date of Birth (DOB)",
            content: "Documents containing Name and DOB",
            items: dobList,
            icon: "Calendar"
        },
        {
            title: "Important Instructions",
            content: "Guidelines for filling the form",
            items: instructionList,
            icon: "AlertCircle"
        },
        {
            title: "Download",
            content: "Download the official document here: <a href=\"/docs/certificate-list-for-aadhaar-update%20(1).pdf\" target=\"_blank\" class=\"text-blue-500 underline\">View PDF</a>",
            items: [],
            icon: "Download"
        }
    ];

    fs.writeFileSync(servicesPath, JSON.stringify(services, null, 2));
    console.log("Service updated successfully.");
}

updateService();
