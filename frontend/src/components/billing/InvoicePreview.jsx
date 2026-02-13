import React, { forwardRef } from 'react';
import logo from '../../assets/logo.png';
import sign from '../../assets/sign.png';
import consultancyQr from '../../assets/consultancy_qr.jpeg';
import legalQr from '../../assets/legal_qr.jpeg';

const InvoicePreview = forwardRef(({ data }, ref) => {
    return (
        <div ref={ref} className="bg-white p-4 max-w-[210mm] mx-auto min-h-0 shadow-lg print:shadow-none print:w-[210mm] print:max-w-[210mm] print:min-h-0 text-black relative top-0 left-0 overflow-hidden print:text-sm print:mx-auto print:my-0 print:p-4 print:page-break-after-avoid">
            {/* Header */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                {/* Logo */}
                <div className="w-24 h-24 flex items-center justify-center p-2">
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
                        <p>email id: <span className="text-blue-700 underline">cochinunitedconsultancydm@gmail.com</span></p>
                        <p>mob no: +91 7306425389</p>
                    </div>
                </div>
            </div>

            <hr className="border-gray-300 mb-2" />

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img src={logo} alt="Watermark" className="w-[500px] h-[500px] object-contain opacity-[0.2] grayscale" />
            </div>

            {/* Client Info */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="max-w-[60%]">
                    <p className="font-bold mb-0.5 text-xs text-gray-600">TO</p>
                    <p className="font-bold text-lg uppercase break-words leading-tight whitespace-pre-wrap">{data.clientName}</p>
                    {data.clientAddress && (
                        <p className="text-sm font-bold text-gray-800 whitespace-pre-wrap mt-1 leading-tight">{data.clientAddress}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="font-bold text-sm">DATE: <span className="font-normal">{data.date}</span></p>
                    <p className="font-bold text-sm">{data.type === 'QUOTATION' ? 'QUOTATION NO' : 'INVOICE NO'}: <span className="font-normal">{data.invoiceNo}</span></p>
                </div>
            </div>

            {/* Table */}
            <div className="mb-2">
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
                                if (item.isTitle) {
                                    return (
                                        <tr key={index}>
                                            <td className="border border-gray-400 p-1.5 text-center"></td>
                                            <td className="border border-gray-400 p-1.5 uppercase font-bold text-center bg-gray-50">{item.description}</td>
                                            <td className="border border-gray-400 p-1.5 text-center"></td>
                                        </tr>
                                    );
                                }

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
                        {data.advanceAmount && (
                            <tr className="font-bold">
                                <td className="border border-gray-400 p-1.5"></td>
                                <td className="border border-gray-400 p-1.5 text-right pr-4">ADVANCE</td>
                                <td className="border border-gray-400 p-1.5 text-center">-{data.advanceAmount}</td>
                            </tr>
                        )}
                        {data.outstandingAmount && (
                            <>
                                <tr className="font-bold">
                                    <td className="border border-gray-400 p-1.5"></td>
                                    <td className="border border-gray-400 p-1.5 text-right pr-4">PREVIOUS OUTSTANDING</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{data.outstandingAmount}</td>
                                </tr>
                            </>
                        )}
                        {(data.advanceAmount || data.outstandingAmount) && (
                            <tr className="font-bold bg-gray-100">
                                <td className="border border-gray-400 p-1.5"></td>
                                <td className="border border-gray-400 p-1.5 text-right pr-4">GRAND TOTAL</td>
                                <td className="border border-gray-400 p-1.5 text-center">{data.grandTotal}</td>
                            </tr>
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
            {/* Notes */}
            <div className="mb-2 text-[10px] leading-tight font-medium mt-2 text-gray-700">
                {data.type === 'QUOTATION' ? (
                    <>
                        <p className="font-bold mb-1">NB:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                            {(() => {
                                // Prefer new array format, fallback to legacy text split
                                const terms = data.quotationTerms && data.quotationTerms.length > 0
                                    ? data.quotationTerms
                                    : (data.quotationText ? data.quotationText.split('\n').filter(line => line.trim().length > 0 && line.trim() !== 'NB:') : []);

                                return terms.map((term, i) => {
                                    // Remove existing bullets if present in string to avoid double bullets
                                    const cleanTerm = term.replace(/^[•\-\*]\s*/, '');
                                    return <li key={i}>{cleanTerm}</li>;
                                });
                            })()}
                        </ul>
                    </>
                ) : (
                    <div className="text-center italic text-gray-600 text-[10px]">
                        For any clarifications or queries regarding the bill, or to report an error or omission, please contact us at <span className="font-bold text-blue-800">cochinunitedconsultancydm@gmail.com</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-2 break-inside-avoid">
                {data.type === 'QUOTATION' && (
                    <p className="mb-4 text-xs">To accept this quotation, Please sign here and return: ..................................................................................</p>
                )}

                <div className="text-center font-bold mb-2 text-sm">
                    We Value Your Relationship With Us!
                </div>

                <div className="flex justify-between items-end px-4">
                    <div className="text-xs font-medium text-gray-800">
                        <p className="font-bold mb-1">Bank Details:</p>
                        <div className="space-y-0.5">
                            {data.category === 'Legal' ? (
                                <>
                                    <div className="flex"><span className="w-24">A/c no</span><span>: 0522202100000749</span></div>
                                    <div className="flex"><span className="w-24">IFSC Code</span><span>: PUNB0052220</span></div>
                                    <p>PUNJAB NATIONAL BANK</p>
                                    <p>Branch- Ernakulam (Market Road)</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex"><span className="w-24">A/c No</span><span>: 41731333716</span></div>
                                    <div className="flex"><span className="w-24">IFSC Code</span><span>: SBIN0010564</span></div>
                                    <p>State Bank of India</p>
                                    <p>Branch – High court Branch</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex items-center justify-center px-4 translate-y-4">
                        <img
                            src={data.category === 'Legal' ? legalQr : consultancyQr}
                            alt="QR Code"
                            className="h-52 object-contain mix-blend-darken"
                            style={{ backgroundColor: 'transparent' }}
                        />
                    </div>

                    <div className="text-center pr-8">
                        {/* Signature */}
                        <div className="mb-1 h-24 flex items-end justify-center">
                            <img src={sign} alt="Signature" className="max-h-full max-w-[200px] object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default InvoicePreview;
