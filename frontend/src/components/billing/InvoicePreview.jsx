import React, { forwardRef } from 'react';
import logo from '../../assets/logo.png';
import sign from '../../assets/sign.png';

const InvoicePreview = forwardRef(({ data }, ref) => {
    return (
        <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none print:w-full print:max-w-none print:min-h-0 text-black relative top-0 left-0 overflow-hidden print:text-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                {/* Logo */}
                <div className="w-28 h-28 flex items-center justify-center p-2">
                    <img src={logo} alt="CUC Logo" className="w-full h-full object-contain" />
                </div>

                {/* Company Info */}
                <div className="text-right">
                    <h1 className="text-xl font-bold font-serif mb-1 tracking-wide">
                        {data.category === 'Digital Marketing' ? <p>AURORA - COCHIN UNITED CONSULTANCY</p> : (data.category === 'Legal' ? <><p>COCHIN UNITED ADVOCATES </p> <p> AND LEGAL CONSULTANT</p></> : <p>COCHIN UNITED CONSULTANCY</p>)}
                    </h1>
                    <div className="text-sm font-medium leading-tight text-gray-800 space-y-0.5">
                        {data.category === 'Legal' ? (
                            <>
                                <p>2ND FLOOR, AMRITA TOWER</p>
                                <p>COMBARA JUNCTION, ERNAKULAM - 682018</p>
                            </>
                        ) : (
                            <>
                                <p>4th Floor, Mather Square, C- Block,</p>
                                <p>Near North Railway Station, North Railway Station,</p>
                                <p>Ernakulam, Kerala 682018</p>
                            </>
                        )}
                        <p>EMAIL ID: <span className="text-blue-700 underline">cochinunitedconsultancydm@gmail.com</span></p>
                        <p>MOB NO: +91 7306425389</p>
                    </div>
                </div>
            </div>

            <hr className="border-gray-300 mb-4" />

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img src={logo} alt="Watermark" className="w-[500px] h-[500px] object-contain opacity-[0.2] grayscale" />
            </div>

            {/* Client Info */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="max-w-[60%]">
                    <p className="font-bold mb-0.5 text-xs text-gray-600">TO</p>
                    <p className="font-bold text-lg uppercase break-words leading-tight">{data.clientName}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-sm">DATE: <span className="font-normal">{data.date}</span></p>
                    <p className="font-bold text-sm">{data.type === 'QUOTATION' ? 'QUOTATION NO' : 'INVOICE NO'}: <span className="font-normal">{data.invoiceNo}</span></p>
                </div>
            </div>

            {/* Table */}
            <div className="mb-4">
                <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-400 p-1.5 w-14 text-center font-bold">Sl. No.</th>
                            <th className="border border-gray-400 p-1.5 text-center font-bold">PARTICULARS</th>
                            <th className="border border-gray-400 p-1.5 w-28 text-center font-bold">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let lastValidSl = 0;
                            return data.items.map((item, index) => {
                                let displaySl;
                                if (item.slNo) {
                                    displaySl = item.slNo;
                                    // Try to update sequence if manual input is numeric
                                    // We match numbers at start of string to handle 1., 2) etc
                                    const match = item.slNo.toString().match(/^(\d+)/);
                                    if (match) {
                                        lastValidSl = parseInt(match[1], 10);
                                    }
                                } else {
                                    lastValidSl++;
                                    displaySl = lastValidSl + '.';
                                }

                                return (
                                    <tr key={index}>
                                        <td className="border border-gray-400 p-1.5 text-center">{displaySl}</td>
                                        <td className="border border-gray-400 p-1.5 uppercase">{item.description}</td>
                                        <td className="border border-gray-400 p-1.5 text-center font-medium">{item.amount}</td>
                                    </tr>
                                );
                            });
                        })()}

                        {/* Empty rows filler if needed, or keeping it dynamic. 
                        The image has clear total row. */}

                        <tr className="font-bold">
                            <td className="border border-gray-400 p-1.5"></td>
                            <td className="border border-gray-400 p-1.5 text-right pr-4">TOTAL</td>
                            <td className="border border-gray-400 p-1.5 text-center">{data.totalAmount}</td>
                        </tr>
                        {data.outstandingAmount && (
                            <>
                                <tr className="font-bold">
                                    <td className="border border-gray-400 p-1.5"></td>
                                    <td className="border border-gray-400 p-1.5 text-right pr-4">PREVIOUS OUTSTANDING</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{data.outstandingAmount}</td>
                                </tr>
                                <tr className="font-bold bg-gray-100">
                                    <td className="border border-gray-400 p-1.5"></td>
                                    <td className="border border-gray-400 p-1.5 text-right pr-4">GRAND TOTAL</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{data.grandTotal}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
                <div className="border border-t-0 border-gray-400 p-1.5 text-center font-bold uppercase text-xs">
                    ({data.amountInWords})
                </div>
            </div>

            {/* Review Image Background Watermark? 
            The image has a faint CUC watermark behind the table. 
            I can add a watermark div.
        */}

            {/* Notes */}
            <div className="mb-4 text-[10px] leading-tight font-medium mt-4 text-gray-700">
                {data.type === 'QUOTATION' ? (
                    <>
                        <p className="font-bold mb-1">NB:</p>
                        {data.category === 'Digital Marketing' ? (
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Any increase in platform charges, subscription fees, or additional expenses related to digital tools during the project period must be borne by you.</li>
                                <li>We are not liable for delays caused by social media platform outages, algorithmic changes, technical glitches, policy updates, or any external factors beyond our control.</li>
                                <li>If additional resources, materials, or approvals are required for content creation or ad campaigns, your timely cooperation is essential. Any extra costs incurred—including paid assets, ad budgets, or third-party service fees—must be reimbursed by you.</li>
                                <li>Please provide prompt approvals for content, artwork, ad copies, and share required credentials (logins, OTPs, verification codes) on time to avoid delays.</li>
                                <li>In case of any misunderstanding, miscommunication, or unethical behavior from our team, please contact our Client Relationship Manager immediately.</li>
                            </ul>
                        ) : (
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Any increase in government fees or additional expenses during the application process must be borne by you.</li>
                                <li>We are not liable for delays caused by changes in government regulations, system failures, network issues, or unforeseen circumstances beyond our control.</li>
                                <li>If additional documents or steps are required, your cooperation and support will be necessary, and any extra expenses incurred must be reimbursed by you.</li>
                                <li>Please regularly follow up on the application process and promptly share any required OTPs.</li>
                                <li>In case of any unethical practices or misbehavior by our staff, please contact our Client Relationship Manager immediately.</li>
                            </ul>
                        )}
                    </>
                ) : (
                    <div className="text-center italic text-gray-600 text-[10px]">
                        For any clarifications or queries regarding the bill, or to report an error or omission, please contact us at <span className="font-bold text-blue-800">cochinunitedconsultancydm@gmail.com</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 break-inside-avoid">
                {data.type === 'QUOTATION' && (
                    <p className="mb-8 text-xs">To accept this quotation, Please sign here and return: ..................................................................................</p>
                )}

                <div className="text-center font-bold mb-4 text-sm">
                    We Value Your Relationship With Us!
                </div>

                <div className="flex justify-end pr-8">
                    <div className="text-center">
                        {/* Signature */}
                        <div className="mb-1 h-32 flex items-end justify-center">
                            <img src={sign} alt="Signature" className="max-h-full max-w-[200px] object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default InvoicePreview;
