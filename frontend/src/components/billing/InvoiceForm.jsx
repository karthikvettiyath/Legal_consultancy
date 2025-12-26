import React from 'react';
import { Plus, Trash2, FileText, Calendar, Hash, User, RefreshCw } from 'lucide-react';

export default function InvoiceForm({ data, onChange }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Create new object to trigger change detection in parent
        onChange({ ...data, [name]: value });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        // Create new object for deep change detection
        onChange({ ...data, items: newItems });
    };

    const addItem = () => {
        onChange({
            ...data,
            items: [...data.items, { description: '', quantity: '', amount: '' }]
        });
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        onChange({ ...data, items: newItems });
    };

    const handleOutstandingBlur = () => {
        if (!data.outstandingAmount) return;
        // Clean non-numeric characters except line decimals (if any, though usually integer)
        const clean = data.outstandingAmount.toString().replace(/[^\d.]/g, '');
        if (clean) {
            const val = parseFloat(clean);
            // Format with commas and add /-
            const formatted = val.toLocaleString('en-IN') + '/-';
            onChange({ ...data, outstandingAmount: formatted });
        }
    };

    const handleItemBlur = (index, field) => {
        if (field !== 'amount') return;
        const item = data.items[index];
        if (!item.amount) return;

        const clean = item.amount.toString().replace(/[^\d.]/g, '');
        if (clean) {
            const val = parseFloat(clean);
            const formatted = val.toLocaleString('en-IN') + '/-';
            if (item.amount !== formatted) {
                handleItemChange(index, 'amount', formatted);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2">
                    <FileText size={20} /> Invoice Details
                </h2>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded-full text-blue-100">
                    {data.items.length} Items
                </span>
            </div>

            <div className="p-6 space-y-6">
                {/* Category Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Category
                    </label>
                    <select
                        name="category"
                        value={data.category || 'Consultancy'}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-white"
                    >
                        <option value="Consultancy">Consultancy</option>
                        <option value="Legal">Legal</option>
                    </select>
                </div>

                {/* Document Type Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Document Type
                    </label>
                    <select
                        name="type"
                        value={data.type}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-white"
                    >
                        <option value="INVOICE">INVOICE</option>
                        <option value="QUOTATION">QUOTATION</option>
                    </select>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <User size={14} /> Client Name
                        </label>
                        <input
                            type="text"
                            name="clientName"
                            value={data.clientName}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-gray-50 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Calendar size={14} /> Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={(() => {
                                    // Convert DD/MM/YYYY to YYYY-MM-DD for input value
                                    if (!data.date) return '';
                                    const [day, month, year] = data.date.split('/');
                                    return `${year}-${month}-${day}`;
                                })()}
                                onChange={(e) => {
                                    // Convert YYYY-MM-DD to DD/MM/YYYY for state
                                    const val = e.target.value;
                                    if (!val) {
                                        onChange({ ...data, date: '' });
                                    } else {
                                        const [year, month, day] = val.split('-');
                                        onChange({ ...data, date: `${day}/${month}/${year}` });
                                    }
                                }}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-gray-50 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Hash size={14} /> Invoice No
                            </label>
                            <input
                                type="text"
                                name="invoiceNo"
                                value={data.invoiceNo}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-gray-50 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Items */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</label>
                        <button
                            onClick={addItem}
                            className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            <Plus size={14} /> Add New
                        </button>
                    </div>

                    <div className="space-y-3">
                        {data.items.map((item, index) => (
                            <div key={index} className="group relative bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex gap-3 items-start">
                                    <span className="text-xs font-mono text-gray-400 pt-3 w-4 text-center">{index + 1}</span>
                                    <div className="flex-grow space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Amount (e.g. 1,200/-)"
                                            value={item.amount}
                                            onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                            onBlur={() => handleItemBlur(index, 'amount')}
                                            className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-2 font-mono"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors self-center"
                                        title="Remove Item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {data.items.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
                                No items added yet. Click "Add New" to start.
                            </div>
                        )}
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Totals */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Total Amount (Auto-calc)</label>
                        <input
                            type="text"
                            name="totalAmount"
                            value={data.totalAmount}
                            readOnly
                            className="block w-full rounded-md border-blue-200 bg-white text-blue-900 font-bold shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Amount in Words (Auto-calc)</label>
                        <textarea
                            name="amountInWords"
                            value={data.amountInWords}
                            readOnly
                            rows="2"
                            className="block w-full rounded-md border-blue-200 bg-white text-blue-800 text-sm shadow-sm p-2 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Outstanding Amount</label>
                        <input
                            type="text"
                            name="outstandingAmount"
                            value={data.outstandingAmount}
                            onChange={handleChange}
                            onBlur={handleOutstandingBlur}
                            placeholder="e.g. 5,000/-"
                            className="block w-full rounded-md border-blue-200 bg-white text-blue-900 shadow-sm p-2"
                        />
                    </div>
                    {data.grandTotal && (
                        <div>
                            <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Grand Total</label>
                            <input
                                type="text"
                                value={data.grandTotal}
                                readOnly
                                className="block w-full rounded-md border-blue-200 bg-blue-100 text-blue-900 font-bold shadow-sm p-2"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
