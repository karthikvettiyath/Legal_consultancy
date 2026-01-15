import React, { forwardRef } from 'react';
import logo from '../../assets/logo.png';
import sign from '../../assets/sign.png';

const InvoicePreview = forwardRef(({ data }, ref) => {
    return (
        <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none print:w-full print:max-w-none text-black relative top-0 left-0 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                {/* Logo */}
                <div className="w-32 h-32 flex items-center justify-center p-2">
                    <img src={logo} alt="CUC Logo" className="w-full h-full object-contain" />
                </div>

                {/* Company Info */}
                <div className="text-right">
                    <h1 className="text-2xl font-bold font-serif mb-2 tracking-wide">
                        {data.category === 'Legal' ? <><p>COCHIN UNITED ADVOCATES </p> <p> AND LEGAL CONSULTANT</p></> : <p>COCHIN UNITED CONSULTANCY</p>}
                    </h1>
                    <div className="text-sm font-medium leading-tight text-gray-800">
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

            <hr className="border-gray-300 mb-6" />

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img src={logo} alt="Watermark" className="w-[600px] h-[600px] object-contain opacity-[0.2] grayscale" />
            </div>

            {/* Client Info */}
            <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                    <p className="font-bold mb-1">TO</p>
                    <p className="font-bold text-lg uppercase">{data.clientName}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold">DATE: <span className="font-normal">{data.date}</span></p>
                    <p className="font-bold">{data.type === 'QUOTATION' ? 'QUOTATION NO' : 'INVOICE NO'}: <span className="font-normal">{data.invoiceNo}</span></p>
                </div>
            </div>

            {/* Table */}
            <div className="mb-4">
                <table className="w-full border-collapse border border-gray-400">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-400 p-2 w-16 text-center font-bold">Sl. No.</th>
                            <th className="border border-gray-400 p-2 text-center font-bold">LIST CERTIFICATE</th>
                            <th className="border border-gray-400 p-2 w-32 text-center font-bold">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index}>
                                <td className="border border-gray-400 p-2 text-center">{index + 1}.</td>
                                <td className="border border-gray-400 p-2 uppercase">{item.description}</td>
                                <td className="border border-gray-400 p-2 text-center font-medium">{item.amount}</td>
                            </tr>
                        ))}

                        {/* Empty rows filler if needed, or keeping it dynamic. 
                        The image has clear total row. */}

                        <tr className="font-bold">
                            <td className="border border-gray-400 p-2"></td>
                            <td className="border border-gray-400 p-2">TOTAL</td>
                            <td className="border border-gray-400 p-2 text-center">{data.totalAmount}</td>
                        </tr>
                        {data.outstandingAmount && (
                            <>
                                <tr className="font-bold">
                                    <td className="border border-gray-400 p-2"></td>
                                    <td className="border border-gray-400 p-2">PREVIOUS OUTSTANDING</td>
                                    <td className="border border-gray-400 p-2 text-center">{data.outstandingAmount}</td>
                                </tr>
                                <tr className="font-bold bg-gray-100">
                                    <td className="border border-gray-400 p-2"></td>
                                    <td className="border border-gray-400 p-2">GRAND TOTAL</td>
                                    <td className="border border-gray-400 p-2 text-center">{data.grandTotal}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
                <div className="border border-t-0 border-gray-400 p-2 text-center font-bold uppercase text-sm">
                    ({data.amountInWords})
                </div>
            </div>

            {/* Review Image Background Watermark? 
            The image has a faint CUC watermark behind the table. 
            I can add a watermark div.
        */}

            {/* Notes */}
            <div className="mb-8 text-xs leading-relaxed font-medium mt-8">
                {data.type === 'QUOTATION' ? (
                    <>
                        <p className="font-bold mb-2">NB:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Any increase in platform charges, subscription fees, or additional expenses related to digital tools during the project period must be borne by you.</li>
                            <li>We are not liable for delays caused by social media platform outages, algorithmic changes, technical glitches, policy updates, or any external factors beyond our control.</li>
                            <li>If additional resources, materials, or approvals are required for content creation or ad campaigns, your timely cooperation is essential. Any extra costs incurred—including paid assets, ad budgets, or third-party service fees—must be reimbursed by you.</li>
                            <li>Please provide prompt approvals for content, artwork, ad copies, and share required credentials (logins, OTPs, verification codes) on time to avoid delays.</li>
                            <li>In case of any misunderstanding, miscommunication, or unethical behaviour from our team, please contact our Client Relationship Manager immediately.</li>
                        </ul>
                    </>
                ) : (
                    <div className="text-center italic text-gray-600 text-sm">
                        For any clarifications or queries regarding the bill, or to report an error or omission, please contact us at <span className="font-bold text-blue-800">cochinunitedconsultancydm@gmail.com</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12">
                {data.type === 'QUOTATION' && (
                    <p className="mb-12">To accept this quotation, Please sign here and return: ..................................................................................</p>
                )}

                <div className="text-center font-bold mb-16">
                    We Value Your Relationship With Us!
                </div>

                <div className="flex justify-end pr-8">
                    <div className="text-center">
                        {/* Signature */}
                        <div className="mb-1 h-40 flex items-end justify-center">
                            <img src={sign} alt="Signature" className="max-h-full max-w-[300px] object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default InvoicePreview;
