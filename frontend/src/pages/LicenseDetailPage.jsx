import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Shield, Loader2, Clock, AlertTriangle, DollarSign, Wrench, X, Download, RefreshCcw } from 'lucide-react';

const LicenseDetailPage = () => {
    const { licenseTypeId } = useParams();
    const [licenseType, setLicenseType] = useState(null);
    const [licenses, setLicenses] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(null);
    const [showBillingForm, setShowBillingForm] = useState(null);
    const [services, setServices] = useState({});
    const [billing, setBilling] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [renewId, setRenewId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isManualClient, setIsManualClient] = useState(false);
    const [formData, setFormData] = useState({ client_id: '', manual_client_name: '', file_no: '', service_date: '', expiry_date: '', status: 'Active', notes: '' });
    const [renewData, setRenewData] = useState({ service_date: '', expiry_date: '', notes: '' });
    const [serviceData, setServiceData] = useState({ service_description: '', service_cost: '', service_date: '' });
    const [billingData, setBillingData] = useState({ amount: '', payment_status: 'Pending', invoice_no: '', payment_date: '' });
    const navigate = useNavigate();

    const getToken = () => { const t = localStorage.getItem('token'); if (!t) navigate('/'); return t; };
    const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

    useEffect(() => { fetchAll(); }, [licenseTypeId]);

    const fetchAll = async () => {
        try {
            const token = getToken();
            const h = { 'Authorization': `Bearer ${token}` };
            const [ltRes, clRes, clientsRes] = await Promise.all([
                fetch(`/api/license-types/${licenseTypeId}`, { headers: h }),
                fetch(`/api/client-licenses?license_type_id=${licenseTypeId}`, { headers: h }),
                fetch('/api/clients', { headers: h })
            ]);
            if (ltRes.ok) setLicenseType(await ltRes.json());
            if (clRes.ok) setLicenses(await clRes.json());
            if (clientsRes.ok) setClients(await clientsRes.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchServices = async (clId) => {
        try {
            const res = await fetch(`/api/license-services/${clId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (res.ok) { const data = await res.json(); setServices(prev => ({ ...prev, [clId]: data })); }
        } catch (e) { console.error(e); }
    };

    const fetchBilling = async (clId) => {
        try {
            const res = await fetch(`/api/license-billing/${clId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (res.ok) { const data = await res.json(); setBilling(prev => ({ ...prev, [clId]: data })); }
        } catch (e) { console.error(e); }
    };

    const toggleExpand = (id) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        fetchServices(id);
        fetchBilling(id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData, license_type_id: licenseTypeId };

        // Clean payload based on manual toggle
        if (isManualClient) {
            payload.client_id = null;
        } else {
            payload.manual_client_name = null;
        }

        const url = editingId ? `/api/client-licenses/${editingId}` : '/api/client-licenses';
        try {
            const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(payload) });
            if (res.ok) { fetchAll(); setShowForm(false); resetForm(); }
            else {
                const err = await res.json();
                alert(err.error || 'Failed to save.');
            }
        } catch (e) { console.error(e); }
    };

    const handleExportExcel = async () => {
        try {
            const token = getToken();
            const query = new URLSearchParams({
                license_type_id: licenseTypeId,
                search: searchTerm
            }).toString();

            const response = await fetch(`/api/client-licenses/download/excel?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${licenseType?.name || 'Licenses'}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Export failed.');
            }
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/client-licenses/${renewId}/renew`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(renewData)
            });
            if (res.ok) {
                fetchAll();
                setShowRenewModal(false);
                setRenewData({ service_date: '', expiry_date: '', notes: '' });
                setRenewId(null);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to renew.');
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this client license record?')) return;
        try {
            const res = await fetch(`/api/client-licenses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (res.ok) fetchAll();
        } catch (e) { console.error(e); }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/license-services', { method: 'POST', headers: headers(), body: JSON.stringify({ ...serviceData, client_license_id: showServiceForm }) });
            if (res.ok) { fetchServices(showServiceForm); setShowServiceForm(null); setServiceData({ service_description: '', service_cost: '', service_date: '' }); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteService = async (svcId, clId) => {
        if (!window.confirm('Delete this service?')) return;
        try { await fetch(`/api/license-services/${svcId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }); fetchServices(clId); } catch (e) { console.error(e); }
    };

    const handleAddBilling = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/license-billing', { method: 'POST', headers: headers(), body: JSON.stringify({ ...billingData, client_license_id: showBillingForm }) });
            if (res.ok) { fetchBilling(showBillingForm); setShowBillingForm(null); setBillingData({ amount: '', payment_status: 'Pending', invoice_no: '', payment_date: '' }); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteBilling = async (bId, clId) => {
        if (!window.confirm('Delete this billing record?')) return;
        try { await fetch(`/api/license-billing/${bId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }); fetchBilling(clId); } catch (e) { console.error(e); }
    };

    const resetForm = () => {
        setFormData({ client_id: '', manual_client_name: '', file_no: '', service_date: '', expiry_date: '', status: 'Active', notes: '' });
        setEditingId(null);
        setIsManualClient(false);
    };
    const formatDate = (d) => { if (!d) return '-'; const s = String(d).split('T')[0]; const p = s.split('-'); return p.length === 3 && p[0].length === 4 ? `${p[2]}-${p[1]}-${p[0]}` : s; };

    const getStatusBadge = (status, days) => {
        if (status === 'Expired' || days < 0) return 'bg-red-100 text-red-700';
        if (status === 'Renewed') return 'bg-emerald-100 text-emerald-700';
        if (days <= 30) return 'bg-amber-100 text-amber-700';
        return 'bg-blue-100 text-blue-700';
    };

    const filtered = licenses.filter(l => (l.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.file_no || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/licenses')} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20} className="text-slate-600" /></button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-indigo-600 text-white p-1.5 rounded"><Shield size={16} /></span> {licenseType?.name || 'License Type'}
                        </h1>
                        {licenseType?.description && <p className="text-sm text-slate-500 mt-0.5">{licenseType.description}</p>}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 shadow-sm"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow text-sm font-medium">
                        <Download size={18} /> Export Excel
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow text-sm font-medium">
                        <Plus size={18} /> Add Client License
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                {filtered.length === 0 ? (
                    <div className="text-center py-20"><Shield size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500">No client licenses found</p></div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold"><tr>
                                    <th className="px-4 py-3 text-left">Client</th><th className="px-4 py-3 text-left">File No</th>
                                    <th className="px-4 py-3 text-left">Service Date</th><th className="px-4 py-3 text-left">Expiry Date</th>
                                    <th className="px-4 py-3 text-left">Days Left</th><th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(l => (
                                        <React.Fragment key={l.id}>
                                            <tr className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => toggleExpand(l.id)}>
                                                <td className="px-4 py-3 font-medium text-slate-800">{l.client_name}</td>
                                                <td className="px-4 py-3 text-slate-600 font-mono">{l.file_no || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{formatDate(l.service_date)}</td>
                                                <td className="px-4 py-3 text-slate-600">{formatDate(l.expiry_date)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(l.computed_status || l.status, l.remaining_days)}`}>
                                                        {l.remaining_days != null ? (l.remaining_days >= 0 ? `${l.remaining_days}d` : `${Math.abs(l.remaining_days)}d overdue`) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(l.computed_status || l.status, l.remaining_days)}`}>
                                                        {l.computed_status || l.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => {
                                                            setFormData({
                                                                client_id: l.client_id || '',
                                                                manual_client_name: l.manual_client_name || '',
                                                                file_no: l.file_no || '',
                                                                service_date: l.service_date?.split('T')[0] || '',
                                                                expiry_date: l.expiry_date?.split('T')[0] || '',
                                                                status: l.status,
                                                                notes: l.notes || ''
                                                            });
                                                            setEditingId(l.id);
                                                            setIsManualClient(!!l.manual_client_name);
                                                            setShowForm(true);
                                                        }}
                                                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition" title="Edit"><Edit size={15} /></button>
                                                        <button onClick={() => {
                                                            setRenewId(l.id);
                                                            setRenewData({
                                                                service_date: new Date().toISOString().split('T')[0],
                                                                expiry_date: '',
                                                                notes: `Renewal of ${l.file_no || 'license'}`
                                                            });
                                                            setShowRenewModal(true);
                                                        }}
                                                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition" title="Renew License"><RefreshCcw size={15} /></button>
                                                        <button onClick={() => handleDelete(l.id)}
                                                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Expanded Details */}
                                            {expandedId === l.id && (
                                                <tr><td colSpan="7" className="bg-slate-50 px-6 py-4">
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        {/* Services */}
                                                        <div className="bg-white rounded-xl border p-4">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h4 className="font-bold text-slate-700 flex items-center gap-2"><Wrench size={16} className="text-indigo-500" /> Services</h4>
                                                                <button onClick={() => setShowServiceForm(l.id)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition font-medium">+ Add</button>
                                                            </div>
                                                            {(services[l.id] || []).length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {services[l.id].map(s => (
                                                                        <div key={s.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg text-sm">
                                                                            <div><p className="font-medium text-slate-700">{s.service_description}</p><p className="text-xs text-slate-400">{formatDate(s.service_date)}</p></div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-semibold text-slate-700">₹{Number(s.service_cost).toLocaleString()}</span>
                                                                                <button onClick={() => handleDeleteService(s.id, l.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : <p className="text-slate-400 text-sm text-center py-2">No services yet</p>}
                                                        </div>
                                                        {/* Billing */}
                                                        <div className="bg-white rounded-xl border p-4">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h4 className="font-bold text-slate-700 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> Billing</h4>
                                                                <button onClick={() => setShowBillingForm(l.id)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-200 transition font-medium">+ Add</button>
                                                            </div>
                                                            {(billing[l.id] || []).length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {billing[l.id].map(b => (
                                                                        <div key={b.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg text-sm">
                                                                            <div><p className="font-medium text-slate-700">₹{Number(b.amount).toLocaleString()}</p><p className="text-xs text-slate-400">{b.invoice_no || 'No invoice'} · {formatDate(b.payment_date)}</p></div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.payment_status}</span>
                                                                                <button onClick={() => handleDeleteBilling(b.id, l.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : <p className="text-slate-400 text-sm text-center py-2">No billing records</p>}
                                                        </div>
                                                    </div>
                                                    {l.notes && <div className="mt-4 bg-white rounded-xl border p-4"><p className="text-sm text-slate-600"><strong>Notes:</strong> {l.notes}</p></div>}
                                                </td></tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Client License Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                            <h2 className="text-white text-lg font-bold">{editingId ? 'Edit' : 'Add'} Client License</h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700">Client Source</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={!isManualClient} onChange={() => setIsManualClient(false)} className="accent-indigo-600" />
                                            <span className="text-xs font-semibold text-slate-600">Existing</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={isManualClient} onChange={() => setIsManualClient(true)} className="accent-indigo-600" />
                                            <span className="text-xs font-semibold text-slate-600">Manual Entry</span>
                                        </label>
                                    </div>
                                </div>
                                {!isManualClient ? (
                                    <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-sm"
                                        value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                                        <option value="">Select Existing Client</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                ) : (
                                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-sm"
                                        value={formData.manual_client_name} onChange={e => setFormData({ ...formData, manual_client_name: e.target.value })}
                                        placeholder="Enter client name manually..." />
                                )}
                            </div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">File No</label>
                                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.file_no} onChange={e => setFormData({ ...formData, file_no: e.target.value })} placeholder="File number" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Service Date</label>
                                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option><option value="Expired">Expired</option><option value="Renewed">Renewed</option>
                                </select></div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows="3"
                                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow transition font-medium">{editingId ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Renew License Modal */}
            {showRenewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white text-lg font-bold">Renew License</h2>
                            <button onClick={() => setShowRenewModal(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-2">
                                <p className="text-sm text-emerald-800">
                                    Renewing this license will mark the current record as <strong>Renewed</strong> and create a new <strong>Active</strong> record.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Service Date *</label>
                                    <input type="date" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={renewData.service_date} onChange={e => setRenewData({ ...renewData, service_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Expiry Date *</label>
                                    <input type="date" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={renewData.expiry_date} onChange={e => setRenewData({ ...renewData, expiry_date: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" rows="3"
                                    value={renewData.notes} onChange={e => setRenewData({ ...renewData, notes: e.target.value })} placeholder="Renewal notes..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowRenewModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow transition font-medium">Renew Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Service Form Modal */}
            {showServiceForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white font-bold">Add Service</h2>
                            <button onClick={() => setShowServiceForm(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddService} className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                                <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={serviceData.service_description} onChange={e => setServiceData({ ...serviceData, service_description: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Cost (₹)</label>
                                    <input type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={serviceData.service_cost} onChange={e => setServiceData({ ...serviceData, service_cost: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={serviceData.service_date} onChange={e => setServiceData({ ...serviceData, service_date: e.target.value })} /></div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowServiceForm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow font-medium">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Billing Form Modal */}
            {showBillingForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white font-bold">Add Billing</h2>
                            <button onClick={() => setShowBillingForm(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddBilling} className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                                <input type="number" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={billingData.amount} onChange={e => setBillingData({ ...billingData, amount: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Invoice No</label>
                                <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={billingData.invoice_no} onChange={e => setBillingData({ ...billingData, invoice_no: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={billingData.payment_status} onChange={e => setBillingData({ ...billingData, payment_status: e.target.value })}>
                                        <option value="Pending">Pending</option><option value="Paid">Paid</option>
                                    </select></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                                    <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={billingData.payment_date} onChange={e => setBillingData({ ...billingData, payment_date: e.target.value })} /></div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowBillingForm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow font-medium">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LicenseDetailPage;
