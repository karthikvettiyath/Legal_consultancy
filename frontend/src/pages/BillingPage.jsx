import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Download } from 'lucide-react';
import InvoiceForm from '../components/billing/InvoiceForm';
import InvoicePreview from '../components/billing/InvoicePreview';
import { numberToWords } from '../utils/numberToWords';

function BillingPage() {
    const [data, setData] = useState({
        type: 'INVOICE', // 'INVOICE' or 'QUOTATION'
        clientName: '',
        date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
        invoiceNo: '4139',
        items: [],
        totalAmount: '0/-',
        outstandingAmount: '',
        grandTotal: '',
        amountInWords: 'Zero'
    });

    const calculateTotal = (items) => {
        return items.reduce((sum, item) => {
            // Remove commas, '/-', and non-numeric chars except dot
            const cleanAmount = item.amount.toString().replace(/[^\d.]/g, '');
            const parsed = parseFloat(cleanAmount) || 0;
            return sum + parsed;
        }, 0);
    };

    const handleDataChange = (newData) => {
        // Check if items changed to trigger recalculation
        if (newData.items !== data.items) {
            const total = calculateTotal(newData.items);
            // Format to Indian currency style roughly or simple locale
            newData.totalAmount = total.toLocaleString('en-IN') + '/-';

            // Calculate Grand Total if outstanding exists
            const outstanding = parseFloat(newData.outstandingAmount.replace(/[^\d.]/g, '') || 0);
            const grandTotal = total + outstanding;
            newData.grandTotal = grandTotal > total ? grandTotal.toLocaleString('en-IN') + '/-' : '';

            // Convert to words (Using Total Amount usually, but if grand total exists?? 
            // Usually Invoice amount in words is for the CURRENT invoice. 
            // Let's stick to current total for words unless asked otherwise.)
            const words = numberToWords(total).toUpperCase() + " ONLY";
            newData.amountInWords = words;
        } else if (newData.outstandingAmount !== data.outstandingAmount) {
            // Recalculate Grand Total if outstanding changes
            const total = calculateTotal(newData.items);
            const outstanding = parseFloat(newData.outstandingAmount.replace(/[^\d.]/g, '') || 0);
            const grandTotal = total + outstanding;
            newData.grandTotal = grandTotal > total ? grandTotal.toLocaleString('en-IN') + '/-' : '';
        }
        setData(newData);
    };

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        navigate('/', { replace: true });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row font-sans text-gray-900">
            {/* Sidebar / Editor - Hidden when printing */}
            <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 bg-white shadow-2xl z-20 flex flex-col h-screen print:hidden border-r border-gray-200">
                <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-blue-600 text-white p-1 rounded">CUC</span> Billing
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-slate-50">
                    <InvoiceForm data={data} onChange={handleDataChange} />
                </div>

                <div className="p-4 border-t border-gray-100 bg-white text-center text-xs text-gray-400">
                    Billing Software v1.0
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-grow bg-slate-100 p-8 overflow-y-auto h-screen flex justify-center items-start print:p-0 print:w-full print:h-auto print:overflow-visible print:bg-white relative">
                <div className="absolute inset-0 pattern-grid-lg text-slate-200/50 pointer-events-none" />
                <div className="transform scale-[0.8] md:scale-[0.85] lg:scale-100 origin-top transition-transform duration-300">
                    <InvoicePreview data={data} />
                </div>
            </div>
        </div>
    );
}

export default BillingPage;
