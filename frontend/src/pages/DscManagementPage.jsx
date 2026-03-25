import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Search, User, ArrowLeft, Loader2, AlertTriangle, Key } from 'lucide-react';

const DscManagementPage = () => {
    const [records, setRecords] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        client_name: '',
        email_id: '',
        phone_no: '',
        dsc_taken_date: '',
        dsc_expiry_date: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchRecords();
        fetchWarnings();
    }, []);

    const fetchRecords = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            const res = await fetch('/api/dsc', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            } else {
                if (res.status === 401 || res.status === 403) navigate('/');
            }
        } catch (error) {
            console.error("Failed to fetch DSC records", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWarnings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/dsc/warnings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWarnings(data);
            }
        } catch (error) {
            console.error("Failed to fetch DSC warnings", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingId ? `/api/dsc/${editingId}` : '/api/dsc';
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
                fetchRecords();
                fetchWarnings();
                setShowForm(false);
                setFormData({ username: '', password: '', client_name: '', email_id: '', phone_no: '', dsc_taken_date: '', dsc_expiry_date: '' });
                setEditingId(null);
            } else {
                alert("Failed to save DSC record.");
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this DSC record?")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/dsc/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRecords();
                fetchWarnings();
            } else {
                alert("Failed to delete record.");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const startEdit = (record) => {
        setFormData({
            username: record.username,
            password: record.password,
            client_name: record.client_name,
            email_id: record.email_id || '',
            phone_no: record.phone_no || '',
            // Format dates for input type="date"
            dsc_taken_date: record.dsc_taken_date ? new Date(record.dsc_taken_date).toISOString().split('T')[0] : '',
            dsc_expiry_date: record.dsc_expiry_date ? new Date(record.dsc_expiry_date).toISOString().split('T')[0] : ''
        });
        setEditingId(record.id);
        setShowForm(true);
    };

    const formatDate = (raw) => {
        if (!raw) return '-';
        return new Date(raw).toLocaleDateString();
    };

    const filteredRecords = records.filter(r =>
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/home')} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-orange-500 text-white p-1 rounded"><Key size={20} /></span> DSC Management
                    </h1>
                </div>
                <div className="flex gap-2">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ username: '', password: '', client_name: '', email_id: '', phone_no: '', dsc_taken_date: '', dsc_expiry_date: '' });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                        <Plus size={18} /> Add DSC
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('adminUser');
                            navigate('/', { replace: true });
                        }}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                
                {/* Warnings Section */}
                {warnings.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                            <AlertTriangle size={20} />
                            <h2>DSC Expiry Warnings (30 Days or Expired)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {warnings.map(w => (
                                <div key={w.id} className="bg-white p-3 rounded shadow-sm border border-red-100 flex flex-col justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{w.client_name}</p>
                                        <p className="text-sm text-slate-600">Username: {w.username}</p>
                                        <p className="text-sm text-slate-600">Expiry: {formatDate(w.dsc_expiry_date)}</p>
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded inline-block w-max">
                                        {w.remaining_days < 0 ? `Expired ${Math.abs(w.remaining_days)} days ago` : `Expires in ${w.remaining_days} days`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-orange-600" size={32} />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Client Name</th>
                                        <th className="px-6 py-4 text-left">Username</th>
                                        <th className="px-6 py-4 text-left">Password</th>
                                        <th className="px-6 py-4 text-left">Email</th>
                                        <th className="px-6 py-4 text-left">Phone</th>
                                        <th className="px-6 py-4 text-left">Taken Date</th>
                                        <th className="px-6 py-4 text-left">Expiry Date</th>
                                        <th className="px-6 py-4 text-left">Total Validity</th>
                                        <th className="px-6 py-4 text-left">Days Remaining</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRecords.length > 0 ? (
                                        filteredRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4 font-medium text-slate-800">{record.client_name}</td>
                                                <td className="px-6 py-4 text-slate-600">{record.username}</td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    <span className="font-mono bg-slate-100 px-2 py-1 rounded select-all">{record.password}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{record.email_id || '-'}</td>
                                                <td className="px-6 py-4 text-slate-600">{record.phone_no || '-'}</td>
                                                <td className="px-6 py-4 text-slate-600">{formatDate(record.dsc_taken_date)}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(record.dsc_expiry_date)}</td>
                                                <td className="px-6 py-4 text-slate-600 italic">{record.total_duration_days} days</td>
                                                <td className="px-6 py-4 text-slate-600 font-bold">
                                                    {record.remaining_days} days
                                                    {record.remaining_days !== null && record.remaining_days <= 30 && (
                                                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Expiring soon"></span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => startEdit(record)} className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition" title="Edit">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(record.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition" title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                                                No DSC records found.
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="bg-orange-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                            <h2 className="text-white text-lg font-bold">
                                {editingId ? 'Edit DSC Record' : 'Add New DSC Record'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white transition">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                                <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                    value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
                                    <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                        value={formData.email_id} onChange={e => setFormData({ ...formData, email_id: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input type="tel" className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                        value={formData.phone_no} onChange={e => setFormData({ ...formData, phone_no: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Taken Date</label>
                                    <input type="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                        value={formData.dsc_taken_date} onChange={e => setFormData({ ...formData, dsc_taken_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                                    <input type="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none" 
                                        value={formData.dsc_expiry_date} onChange={e => setFormData({ ...formData, dsc_expiry_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition shadow">
                                    {editingId ? 'Update Record' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DscManagementPage;
