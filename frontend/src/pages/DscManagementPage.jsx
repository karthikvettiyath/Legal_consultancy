import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Search, User, ArrowLeft, Loader2, AlertTriangle, Key, Bell, X } from 'lucide-react';

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
    const [showNotifications, setShowNotifications] = useState(false);
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
                    {/* Notifications Bell */}
                    <div className="relative mr-2">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-lg transition relative ${warnings.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title="DSC Warnings"
                        >
                            <Bell size={20} />
                            {warnings.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                                    {warnings.length}
                                </span>
                            )}
                        </button>
                    </div>

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
                
                {/* Summary Section (Brief) */}
                {warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800">DSC Expiry Attention Required</p>
                                <p className="text-xs text-amber-600">You have {warnings.length} client(s) with DSC expiring within 30 days.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowNotifications(true)}
                            className="text-xs font-bold text-amber-700 bg-amber-200/50 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition"
                        >
                            View All Messages
                        </button>
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

            {/* Notifications Drawer */}
            {showNotifications && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={() => setShowNotifications(false)}></div>
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Bell className="text-orange-500" size={20} /> DSC Notifications
                            </h2>
                            <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white rounded-full transition text-slate-400">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {warnings.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                    <Bell size={48} className="opacity-20" />
                                    <p>No active warnings</p>
                                </div>
                            ) : (
                                warnings.map(w => (
                                    <div key={w.id} className={`p-4 rounded-2xl border-l-4 shadow-sm ${w.remaining_days < 0 ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-800">{w.client_name}</h3>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${w.remaining_days < 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {w.remaining_days < 0 ? 'Expired' : 'Expiring Soon'}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm text-slate-600">
                                            <p><span className="font-medium text-slate-500">Username:</span> {w.username}</p>
                                            <p><span className="font-medium text-slate-500">Expiry Date:</span> {formatDate(w.dsc_expiry_date)}</p>
                                            <p><span className="font-medium text-slate-500">Valid period:</span> {w.total_duration_days} days</p>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className={`text-xs font-bold px-3 py-1 rounded-lg ${w.remaining_days < 0 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                                                {w.remaining_days < 0 ? `${Math.abs(w.remaining_days)} days overdue` : `${w.remaining_days} days remaining`}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSearchTerm(w.client_name);
                                                    setShowNotifications(false);
                                                }}
                                                className="text-xs font-medium text-slate-500 hover:text-orange-600 underline underline-offset-2 ml-auto"
                                            >
                                                Locate Record
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-gray-100">
                            <button onClick={() => setShowNotifications(false)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DscManagementPage;
