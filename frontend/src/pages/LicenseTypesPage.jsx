import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Shield, Eye, Loader2, FileText, Users, ChevronRight } from 'lucide-react';

const LicenseTypesPage = () => {
    const [types, setTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchTypes(); }, []);

    const getToken = () => {
        const t = localStorage.getItem('token');
        if (!t) navigate('/');
        return t;
    };

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/license-types', { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (res.ok) setTypes(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/license-types/${editingId}` : '/api/license-types';
        const method = editingId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(formData) });
            if (res.ok) { fetchTypes(); setShowForm(false); setFormData({ name: '', description: '' }); setEditingId(null); }
            else alert('Failed to save.');
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this license type and all associated records?')) return;
        try {
            const res = await fetch(`/api/license-types/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (res.ok) fetchTypes(); else alert('Failed to delete.');
        } catch (e) { console.error(e); }
    };

    const filtered = types.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/license-dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20} className="text-slate-600" /></button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white p-1.5 rounded"><Shield size={16} /></span> License & Agreement Types
                    </h1>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search types..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => { setFormData({ name: '', description: '' }); setEditingId(null); setShowForm(true); }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow text-sm font-medium">
                        <Plus size={18} /> Add Type
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 text-lg">No license types found</p>
                        <p className="text-slate-400 text-sm mt-1">Create your first license type to get started</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(type => (
                            <div key={type.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <FileText size={22} className="text-white" />
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setFormData({ name: type.name, description: type.description || '' }); setEditingId(type.id); setShowForm(true); }}
                                                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition" title="Edit"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(type.id)}
                                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{type.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{type.description || 'No description'}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-sm text-slate-500">
                                            <Users size={14} /> {type.client_count || 0} clients
                                        </span>
                                        <Link to={`/licenses/${type.id}`} className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-800 transition">
                                            View <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-lg font-bold">{editingId ? 'Edit License Type' : 'Add License Type'}</h2>
                            <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rent Agreement" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" rows="3"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional notes..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow transition font-medium">
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LicenseTypesPage;
