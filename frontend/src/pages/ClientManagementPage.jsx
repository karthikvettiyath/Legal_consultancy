import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Search, User, ArrowLeft, Loader2, Star } from 'lucide-react';

const ClientManagementPage = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        type_of_work: '',
        case_number: '',
        dob: '',
        review_rating: 0
    });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            const res = await fetch('/api/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            } else {
                if (res.status === 401 || res.status === 403) navigate('/');
            }
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchClients();
                setShowForm(false);
                setFormData({ name: '', email: '', phone: '', address: '', type_of_work: '', case_number: '', dob: '', review_rating: 0 });
                setEditingId(null);
            } else {
                alert("Failed to save client.");
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    };



    const handleRatingChange = async (client, newRating) => {
        const token = localStorage.getItem('token');
        // Optimistic update
        const updatedClients = clients.map(c =>
            c.id === client.id ? { ...c, review_rating: newRating } : c
        );
        setClients(updatedClients);

        try {
            // Fetch current data first to be safe, or just send what we have
            // Assuming PUT expects full resource
            const res = await fetch(`/api/clients/${client.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...client, review_rating: newRating })
            });

            if (res.ok) {
                // optionally refresh or just leave optimistic
            } else {
                // Revert on failure
                fetchClients();
                alert("Failed to update rating.");
            }
        } catch (error) {
            console.error("Rating update failed", error);
            fetchClients();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchClients();
            } else {
                alert("Failed to delete client.");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const startEdit = (client) => {
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            type_of_work: client.type_of_work || '',
            case_number: client.case_number || '',
            dob: client.dob || '',
            review_rating: client.review_rating || 0
        });
        setEditingId(client.id);
        setShowForm(true);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-emerald-600 text-white p-1 rounded">CUC</span> Client Management
                    </h1>
                </div>
                <div className="flex gap-2">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ name: '', email: '', phone: '', address: '', type_of_work: '', case_number: '', dob: '', review_rating: 0 });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
                    >
                        <Plus size={18} /> Add Client
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('adminUser');
                            navigate('/', { replace: true });
                        }}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                {/* Mobile Search - Visible only on small screens */}
                <div className="mb-6 md:hidden">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-emerald-600" size={32} />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Name</th>
                                        <th className="px-6 py-4 text-left">Type</th>
                                        <th className="px-6 py-4 text-left">Case No</th>
                                        <th className="px-6 py-4 text-left">Phone</th>
                                        <th className="px-6 py-4 text-left">DOB</th>
                                        <th className="px-6 py-4 text-left">Review</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map((client) => (
                                            <tr key={client.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-800 flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <User size={14} />
                                                        </div>
                                                        {client.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${client.type_of_work === 'Legal' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {client.type_of_work || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-mono text-sm">{client.case_number || '-'}</td>
                                                <td className="px-6 py-4 text-slate-600">{client.phone || '-'}</td>
                                                <td className="px-6 py-4 text-slate-600">{client.dob || '-'}</td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleRatingChange(client, i + 1)}
                                                                className="focus:outline-none transition hover:scale-110"
                                                            >
                                                                <Star
                                                                    size={16}
                                                                    className={i < (client.review_rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => startEdit(client)}
                                                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(client.id)}
                                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                                No clients found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-lg font-bold">
                                {editingId ? 'Edit Client' : 'Add New Client'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white transition">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type of Work</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                        value={formData.type_of_work}
                                        onChange={e => setFormData({ ...formData, type_of_work: e.target.value })}
                                        placeholder="Legal / Consultancy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Case Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                        value={formData.case_number}
                                        onChange={e => setFormData({ ...formData, case_number: e.target.value })}
                                        placeholder="e.g. AS 35/22"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                        value={formData.dob}
                                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        placeholder="DD/MM/YYYY"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Review (1-5)</label>
                                    <div className="flex gap-1 py-2">
                                        {[...Array(5)].map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, review_rating: i + 1 })}
                                                className="focus:outline-none transition transform hover:scale-110"
                                            >
                                                <Star
                                                    size={20}
                                                    className={i < formData.review_rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 hover:text-yellow-200"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                    rows="3"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition"
                                >
                                    {editingId ? 'Update Client' : 'Save Client'}
                                </button>
                            </div>
                        </form>
                    </div >
                </div >
            )}
        </div >
    );
};

export default ClientManagementPage;
