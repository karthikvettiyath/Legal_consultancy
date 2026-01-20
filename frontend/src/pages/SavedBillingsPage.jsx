import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Edit, FileText, ArrowLeft, Printer } from 'lucide-react';

export default function SavedBillingsPage() {
    const [billings, setBillings] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBillings();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBillings(search);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const fetchBillings = async (searchTerm = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/billings${searchTerm ? `?search=${searchTerm}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBillings(data);
            }
        } catch (error) {
            console.error("Error fetching billings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this billing record?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/billings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setBillings(billings.filter(b => b.id !== id));
            } else {
                alert("Failed to delete billing record");
            }
        } catch (error) {
            console.error("Error deleting billing:", error);
            alert("Failed to delete billing record");
        }
    };

    const handleEdit = (billing) => {
        navigate('/billing', { state: { billingData: billing.data, billingId: billing.id } });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/billing')}
                            className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-slate-900"
                            title="Back to Billing"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <span className="bg-blue-600 text-white p-1.5 rounded-lg"><FileText size={24} /></span>
                            Saved Billings
                        </h1>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Client Name or Invoice No..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="p-5">Date</th>
                                    <th className="p-5">Invoice No</th>
                                    <th className="p-5">Client Name</th>
                                    <th className="p-5">Category</th>
                                    <th className="p-5">Auth</th>
                                    <th className="p-5 text-right">Amount</th>
                                    <th className="p-5 text-center">Type</th>
                                    <th className="p-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-500">
                                            Loading billings...
                                        </td>
                                    </tr>
                                ) : billings.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <FileText size={48} className="text-gray-200" />
                                                <p>No billing records found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    billings.map((billing) => (
                                        <tr key={billing.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-5 whitespace-nowrap text-sm font-medium text-gray-600">
                                                {billing.date}
                                            </td>
                                            <td className="p-5 font-mono text-sm font-medium text-slate-700">
                                                {billing.invoice_no || '-'}
                                            </td>
                                            <td className="p-5 text-slate-800 font-medium">
                                                {billing.client_name}
                                            </td>
                                            <td className="p-5 text-sm text-gray-600">
                                                {billing.category || '-'}
                                            </td>
                                            <td className="p-5 text-sm text-gray-600">
                                                {billing.authorities || '-'}
                                            </td>
                                            <td className="p-5 text-right font-mono font-medium text-slate-700">
                                                {billing.amount}
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${billing.type === 'INVOICE'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                                                    }`}>
                                                    {billing.type}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(billing)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit / View"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(billing.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
