import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, FileText, Calendar, Hash, User, RefreshCw, Type } from 'lucide-react';

export default function InvoiceForm({ data, onChange }) {
    // ── Client Autocomplete State ──
    const [allClients, setAllClients] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const suggestionsRef = useRef(null);
    const clientNameRef = useRef(null);

    // Fetch clients on mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('/api/clients', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const clients = await res.json();
                    setAllClients(clients);
                }
            } catch (err) {
                console.error('Failed to fetch clients for autocomplete', err);
            }
        };
        fetchClients();
    }, []);

    // Filter clients based on typed text
    const getFilteredClients = useCallback(() => {
        const query = (data.clientName || '').trim().toLowerCase();
        if (!query) return [];
        return allClients.filter(c =>
            c.name && c.name.toLowerCase().includes(query)
        ).slice(0, 10); // Limit to 10 suggestions
    }, [data.clientName, allClients]);

    const filteredClients = getFilteredClients();

    // Handle selecting a client from the dropdown
    const handleSelectClient = (client) => {
        onChange({
            ...data,
            clientName: client.name,
            clientAddress: client.address || ''
        });
        setShowSuggestions(false);
        setHighlightedIndex(-1);
    };

    // Handle keyboard navigation in the dropdown
    const handleClientNameKeyDown = (e) => {
        if (!showSuggestions || filteredClients.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < filteredClients.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev > 0 ? prev - 1 : filteredClients.length - 1
            );
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            handleSelectClient(filteredClients[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && suggestionsRef.current) {
            const items = suggestionsRef.current.querySelectorAll('[data-suggestion]');
            if (items[highlightedIndex]) {
                items[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
                clientNameRef.current && !clientNameRef.current.contains(e.target)
            ) {
                setShowSuggestions(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            items: [...data.items, { slNo: '', description: '', quantity: '', amount: '' }]
        });
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        onChange({ ...data, items: newItems });
    };

    const handleOutstandingBlur = (fieldName) => {
        const value = data[fieldName];
        if (!value) return;
        // Clean non-numeric characters except decimals
        const clean = value.toString().replace(/[^\d.]/g, '');
        if (clean) {
            const val = parseFloat(clean);
            // Format with commas and add /-
            const formatted = val.toLocaleString('en-IN') + '/-';
            onChange({ ...data, [fieldName]: formatted });
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



    const prevCategoryRef = React.useRef(data.category);
    const prevTypeRef = React.useRef(data.type);

    React.useEffect(() => {
        // Only trigger if category or type actually changed
        const categoryChanged = prevCategoryRef.current !== data.category;
        const typeChanged = prevTypeRef.current !== data.type;

        if (categoryChanged || typeChanged) {
            prevCategoryRef.current = data.category;
            prevTypeRef.current = data.type;

            if (data.type === 'QUOTATION') {
                const defaultTerms = data.category === 'Digital Marketing'
                    ? [
                        "Any increase in platform charges, subscription fees, or additional expenses related to digital tools during the project period must be borne by you.",
                        "We are not liable for delays caused by social media platform outages, algorithmic changes, technical glitches, policy updates, or any external factors beyond our control.",
                        "If additional resources, materials, or approvals are required for content creation or ad campaigns, your timely cooperation is essential. Any extra costs incurred—including paid assets, ad budgets, or third-party service fees—must be reimbursed by you.",
                        "Please provide prompt approvals for content, artwork, ad copies, and share required credentials (logins, OTPs, verification codes) on time to avoid delays.",
                        "In case of any misunderstanding, miscommunication, or unethical behavior from our team, please contact our Client Relationship Manager immediately."
                    ]
                    : [
                        "Any increase in government fees or additional expenses during the application process must be borne by you.",
                        "We are not liable for delays caused by changes in government regulations, system failures, network issues, or unforeseen circumstances beyond our control.",
                        "If additional documents or steps are required, your cooperation and support will be necessary, and any extra expenses incurred must be reimbursed by you.",
                        "Please regularly follow up on the application process and promptly share any required OTPs.",
                        "In case of any unethical practices or misbehavior by our staff, please contact our Client Relationship Manager immediately."
                    ];

                // Prioritize switching templates. If user wants to keep edits, they shouldn't switch categories.
                onChange({ ...data, quotationTerms: defaultTerms });
            }
        }
    }, [data.category, data.type, data.quotationTerms, onChange, data]); // Kept dependencies but ref logic prevents loop/unwanted updates

    const handleTermChange = (index, value) => {
        const newTerms = [...(data.quotationTerms || [])];
        newTerms[index] = value;
        onChange({ ...data, quotationTerms: newTerms });
    };

    const addTerm = () => {
        onChange({ ...data, quotationTerms: [...(data.quotationTerms || []), ""] });
    };

    const removeTerm = (index) => {
        const newTerms = (data.quotationTerms || []).filter((_, i) => i !== index);
        onChange({ ...data, quotationTerms: newTerms });
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
                        <option value="Digital Marketing">Digital Marketing</option>
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
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <User size={14} /> Client Name & Address
                    </label>
                    <div className="space-y-2">
                        {/* Client Name with Autocomplete */}
                        <div className="relative">
                            <textarea
                                ref={clientNameRef}
                                name="clientName"
                                value={data.clientName}
                                onChange={(e) => {
                                    handleChange(e);
                                    setShowSuggestions(true);
                                    setHighlightedIndex(-1);
                                }}
                                onFocus={() => {
                                    if ((data.clientName || '').trim().length > 0) {
                                        setShowSuggestions(true);
                                    }
                                }}
                                onKeyDown={handleClientNameKeyDown}
                                rows={2}
                                placeholder="Start typing client name..."
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-gray-50 focus:bg-white resize-y"
                                autoComplete="off"
                            />
                            {/* Suggestions Dropdown */}
                            {showSuggestions && filteredClients.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl max-h-56 overflow-y-auto"
                                    style={{ top: '100%' }}
                                >
                                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                            {filteredClients.length} matching client{filteredClients.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {filteredClients.map((client, idx) => (
                                        <button
                                            key={client.id || idx}
                                            data-suggestion
                                            type="button"
                                            onClick={() => handleSelectClient(client)}
                                            className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-b-0 ${idx === highlightedIndex
                                                ? 'bg-blue-50 text-blue-800'
                                                : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <User size={13} className="text-blue-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm truncate">{client.name}</div>
                                                {client.address && (
                                                    <div className="text-xs text-gray-400 truncate mt-0.5">{client.address}</div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <textarea
                            name="clientAddress"
                            value={data.clientAddress || ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Client Address (Complete recipient address)"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-gray-50 focus:bg-white resize-y"
                        />
                    </div>
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
                            <Hash size={14} /> {data.type === 'QUOTATION' ? 'Quotation No' : 'Invoice No'}
                        </label>
                        <input
                            type="text"
                            name="invoiceNo"
                            value={data.invoiceNo}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-white"
                        />
                    </div>
                    {data.category !== 'Digital Marketing' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                Authorities
                            </label>
                            <select
                                name="authorities"
                                value={data.authorities || 'A'}
                                onChange={handleChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2.5 border bg-white"
                            >
                                <option value="A">A - Sarath</option>
                                <option value="B">B - Jesna</option>
                                <option value="C">C - Soumya</option>
                                <option value="D">D - Nithya</option>
                                <option value="E">E - Irshad</option>
                                <option value="F">F - Construction & Supervising</option>
                                <option value="VP">VP - Jayan & Midhun</option>                               
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {data.type === 'QUOTATION' && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Quotation Terms
                        </label>
                        <button
                            onClick={addTerm}
                            className="flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                        >
                            <Plus size={12} /> Add Point
                        </button>
                    </div>
                    <div className="space-y-2">
                        {(data.quotationTerms || []).map((term, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <span className="text-gray-400 text-sm mt-2">•</span>
                                <textarea
                                    value={term}
                                    onChange={(e) => handleTermChange(i, e.target.value)}
                                    rows={2}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-2 border bg-white text-sm"
                                />
                                <button
                                    onClick={() => removeTerm(i)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 mt-1"
                                    title="Remove term"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <hr className="border-gray-100" />

            {/* Items */}
            <div>
                <div className="flex justify-between items-start mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Line Items</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                onChange({
                                    ...data,
                                    items: [...data.items, { isTitle: true, description: '', slNo: '', amount: '' }]
                                });
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
                        >
                            <Type size={14} /> Set Title
                        </button>
                        <button
                            onClick={addItem}
                            className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            <Plus size={14} /> Add New
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {data.items.map((item, index) => (
                        <div key={index} className="group relative bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex gap-3 items-start">
                                <span className="text-xs font-mono text-gray-400 pt-3 w-4 text-center">{index + 1}</span>
                                <div className="flex-grow space-y-2">
                                    {item.isTitle ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Title / Section Header"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                className="block w-full text-base font-bold rounded-md border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-purple-50 border p-2"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Sl. No"
                                                    value={item.slNo || ''}
                                                    onChange={(e) => handleItemChange(index, 'slNo', e.target.value)}
                                                    className="block w-16 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-2"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-2"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Amount (e.g. 1,200/-)"
                                                value={item.amount}
                                                onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                                onBlur={() => handleItemBlur(index, 'amount')}
                                                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-2 font-mono"
                                            />
                                        </>
                                    )}
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
                    <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Advance Amount</label>
                    <input
                        type="text"
                        name="advanceAmount"
                        value={data.advanceAmount || ''}
                        onChange={handleChange}
                        onBlur={() => handleOutstandingBlur('advanceAmount')}
                        placeholder="e.g. 5,000/-"
                        className="block w-full rounded-md border-blue-200 bg-white text-blue-900 shadow-sm p-2"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Outstanding Amount</label>
                    <input
                        type="text"
                        name="outstandingAmount"
                        value={data.outstandingAmount || ''}
                        onChange={handleChange}
                        onBlur={() => handleOutstandingBlur('outstandingAmount')}
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
    );
}
