import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Printer, Download, Save, FolderOpen, LogOut } from 'lucide-react';
import InvoiceForm from '../components/billing/InvoiceForm';
import InvoicePreview from '../components/billing/InvoicePreview';
import SaveDialog from '../components/billing/SaveDialog';
import { numberToWords } from '../utils/numberToWords';

function BillingPage() {
    const [data, setData] = useState({
        category: 'Consultancy', // 'Legal' or 'Consultancy'
        authorities: 'A', // Default authority
        type: 'INVOICE', // 'INVOICE' or 'QUOTATION'
        clientName: '',
        clientAddress: '',
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
        if (newData.items !== data.items || newData.advanceAmount !== data.advanceAmount || newData.outstandingAmount !== data.outstandingAmount) {
            const total = calculateTotal(newData.items);
            // Format to Indian currency style
            newData.totalAmount = total.toLocaleString('en-IN') + '/-';

            // Calculate totals with advance and outstanding
            const advance = parseFloat(newData.advanceAmount?.replace(/[^\d.]/g, '') || 0);
            const outstanding = parseFloat(newData.outstandingAmount?.replace(/[^\d.]/g, '') || 0);

            // Grand Total = Total - Advance + Outstanding
            const grandTotal = total - advance + outstanding;

            // Only show grand total if advance or outstanding exists
            if (advance > 0 || outstanding > 0) {
                newData.grandTotal = grandTotal.toLocaleString('en-IN') + '/-';
                // Convert grand total to words
                const words = numberToWords(grandTotal).toUpperCase() + " ONLY";
                newData.amountInWords = words;
            } else {
                newData.grandTotal = '';
                // Convert total to words
                const words = numberToWords(total).toUpperCase() + " ONLY";
                newData.amountInWords = words;
            }
        }
        setData(newData);
    };

    const [currentId, setCurrentId] = useState(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (location.state && location.state.billingData) {
            setData(location.state.billingData);
            if (location.state.billingId) {
                setCurrentId(location.state.billingId);
            }
        }
    }, [location.state]);

    // Fetch next invoice number when authority or type changes (only for new bills)
    React.useEffect(() => {
        if (!currentId && data.authorities) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`/api/billings/next-invoice-no?series=${data.authorities}&type=${data.type}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.ok ? res.json() : null)
                    .then(resData => {
                        if (resData && resData.nextInvoiceNo) {
                            setData(prev => ({ ...prev, invoiceNo: resData.nextInvoiceNo }));
                        }
                    })
                    .catch(err => console.error("Error fetching invoice no:", err));
            }
        }
    }, [data.authorities, data.type, currentId]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        navigate('/', { replace: true });
    };

    const handleSave = async () => {
        // If editing an existing billing, show custom dialog
        if (currentId) {
            setShowSaveDialog(true);
        } else {
            // New billing, save directly
            await saveBilling(false);
        }
    };

    const saveBilling = async (saveAsNew) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to save billings.");
            return;
        }

        const payload = {
            invoice_no: data.invoiceNo,
            client_name: data.clientName,
            date: data.date,
            amount: data.grandTotal || data.totalAmount,
            type: data.type,
            category: data.category,
            authorities: data.authorities,
            data: data
        };

        try {
            // Determine URL and method based on whether we're updating or creating new
            const url = (currentId && !saveAsNew) ? `/api/billings/${currentId}` : '/api/billings';
            const method = (currentId && !saveAsNew) ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const resData = await response.json();

                // Update currentId with the new or existing billing ID
                if (saveAsNew || !currentId) {
                    setCurrentId(resData.id);
                }

                const message = (currentId && !saveAsNew)
                    ? "Billing updated successfully!"
                    : "Billing saved as new successfully!";
                alert(message);
                setShowSaveDialog(false);
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save');
            }
        } catch (error) {
            console.error("Error saving billing:", error);
            alert("Failed to save billing. " + error.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row font-sans text-gray-900">
            {/* Sidebar / Editor - Hidden when printing */}
            <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 bg-white shadow-2xl z-20 flex flex-col h-screen print:hidden border-r border-gray-200">
                <div className="bg-white border-b border-gray-100 sticky top-0 z-10 transition-all">
                    {/* Top Row: Title & Logout */}
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-blue-600 text-white p-1 rounded">CUC</span> Billing
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                    {/* Bottom Row: Actions */}
                    <div className="px-6 pb-4 grid grid-cols-3 gap-2">
                        <button
                            onClick={() => navigate('/saved-billings')}
                            className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-3 py-2.5 rounded-lg hover:bg-blue-100 transition shadow-sm text-sm font-medium border border-blue-100"
                            title="View Saved Billings"
                        >
                            <FolderOpen size={18} /> <span>Saved</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-md hover:shadow-lg active:scale-95 text-sm font-medium"
                        >
                            <Save size={18} /> <span>Save</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 bg-slate-800 text-white px-3 py-2.5 rounded-lg hover:bg-slate-700 transition shadow-md hover:shadow-lg active:scale-95 text-sm font-medium"
                        >
                            <Printer size={18} /> <span>Print</span>
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
            <div className="flex-grow bg-slate-100 p-8 overflow-y-auto h-screen flex justify-center items-start print:p-0 print:w-full print:h-auto print:overflow-visible print:bg-white print:block relative">
                <div className="absolute inset-0 pattern-grid-lg text-slate-200/50 pointer-events-none print:hidden" />
                <div className="transform scale-[0.8] md:scale-[0.85] lg:scale-100 origin-top transition-transform duration-300 print:scale-100 print:transform-none">
                    <InvoicePreview data={data} />
                </div>
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <SaveDialog
                    onSaveExisting={() => saveBilling(false)}
                    onSaveNew={() => saveBilling(true)}
                    onCancel={() => setShowSaveDialog(false)}
                />
            )}
        </div>
    );
}

export default BillingPage;
