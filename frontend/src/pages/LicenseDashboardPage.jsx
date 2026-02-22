import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, XCircle, RefreshCw, Clock, FileText, DollarSign, Loader2, ChevronRight, Download } from 'lucide-react';

const LicenseDashboardPage = () => {
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        // Auto-update expired
        fetch('/api/license-auto-update', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => { });
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/license-dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setDashboard(await res.json());
            else if (res.status === 401) navigate('/');
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const formatDate = (d) => {
        if (!d) return '-';
        const s = String(d).split('T')[0];
        const p = s.split('-');
        return p.length === 3 && p[0].length === 4 ? `${p[2]}-${p[1]}-${p[0]}` : s;
    };

    const getStatusColor = (status, days) => {
        if (status === 'Expired' || days < 0) return 'bg-red-100 text-red-700 border-red-200';
        if (status === 'Renewed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (days <= 30) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const handleExportAllExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/client-licenses/download/excel`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `All_Licenses_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
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

    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    const stats = dashboard?.stats || { total: 0, active: 0, expired: 0, expiring_soon: 0, pending_billing: 0 };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/home')} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20} className="text-slate-600" /></button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white p-1.5 rounded"><Shield size={16} /></span>
                        License & Agreement Dashboard
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportAllExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow">
                        <Download size={16} /> Export All
                    </button>
                    <Link to="/licenses" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow">
                        <FileText size={16} /> Manage Licenses
                    </Link>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('adminUser'); navigate('/'); }}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition text-sm font-medium">Logout</button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Licenses', value: stats.total, icon: FileText, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
                        { label: 'Active', value: stats.active, icon: Shield, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50' },
                        { label: 'Expired', value: stats.expired, icon: XCircle, color: 'from-red-500 to-rose-500', bg: 'bg-red-50' },
                        { label: 'Expiring Soon', value: stats.expiring_soon, icon: AlertTriangle, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
                        { label: 'Pending ₹', value: `₹${stats.pending_billing.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
                    ].map((card, i) => (
                        <div key={i} className={`${card.bg} rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300`}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow`}>
                                <card.icon size={18} className="text-white" />
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* Type Breakdown */}
                {dashboard?.type_breakdown?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">License Type Breakdown</h2>
                        <div className="flex flex-wrap gap-3">
                            {dashboard.type_breakdown.map((t, i) => (
                                <Link key={i} to={`/licenses?type=${encodeURIComponent(t.name)}`}
                                    className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-4 py-2 rounded-xl transition text-sm">
                                    <span className="font-semibold text-slate-700">{t.name}</span>
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{t.count}</span>
                                    <ChevronRight size={14} className="text-slate-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expiring Soon */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-amber-500" /> Expiring in 30 Days
                    </h2>
                    {dashboard?.expiring_soon?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
                                    <th className="px-4 py-3 text-left">Client</th><th className="px-4 py-3 text-left">License</th>
                                    <th className="px-4 py-3 text-left">File No</th><th className="px-4 py-3 text-left">Expiry</th>
                                    <th className="px-4 py-3 text-left">Days Left</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {dashboard.expiring_soon.map(l => (
                                        <tr key={l.id} className="hover:bg-amber-50/50 transition">
                                            <td className="px-4 py-3 font-medium text-slate-800">{l.client_name}</td>
                                            <td className="px-4 py-3 text-slate-600">{l.license_type_name}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono">{l.file_no || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatDate(l.expiry_date)}</td>
                                            <td className="px-4 py-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">{l.remaining_days}d</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-slate-400 text-sm py-4 text-center">No licenses expiring soon 🎉</p>}
                </div>

                {/* Expired */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <XCircle size={20} className="text-red-500" /> Expired Licenses
                    </h2>
                    {dashboard?.recently_expired?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
                                    <th className="px-4 py-3 text-left">Client</th><th className="px-4 py-3 text-left">License</th>
                                    <th className="px-4 py-3 text-left">Expiry</th><th className="px-4 py-3 text-left">Days Overdue</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {dashboard.recently_expired.map(l => (
                                        <tr key={l.id} className="hover:bg-red-50/50 transition">
                                            <td className="px-4 py-3 font-medium text-slate-800">{l.client_name}</td>
                                            <td className="px-4 py-3 text-slate-600">{l.license_type_name}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatDate(l.expiry_date)}</td>
                                            <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{l.days_expired}d</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-slate-400 text-sm py-4 text-center">No expired licenses</p>}
                </div>

                {/* Recently Renewed */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <RefreshCw size={20} className="text-emerald-500" /> Recently Renewed
                    </h2>
                    {dashboard?.recently_renewed?.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {dashboard.recently_renewed.map(l => (
                                <div key={l.id} className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl text-sm">
                                    <p className="font-semibold text-slate-800">{l.client_name}</p>
                                    <p className="text-emerald-600 text-xs">{l.license_type_name}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-400 text-sm py-4 text-center">No recently renewed licenses</p>}
                </div>
            </div>
        </div>
    );
};

export default LicenseDashboardPage;
