import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Trash2, Plus, Search, FileText, List, HelpCircle, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminPage = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Auth state
    const navigate = useNavigate();
    const { logout } = useAuth(); // Use context

    // Editing state
    const [editingId, setEditingId] = useState(null); // 'new' for creating
    const [editForm, setEditForm] = useState({});
    const [activeEditTab, setActiveEditTab] = useState('general'); // 'content' or 'faq'

    const [message, setMessage] = useState({ text: '', type: '' });

    const API_URL = '';

    useEffect(() => {
        // ProtectedRoute handles the redirect if not logged in.
        // We just fetch data here.
        fetchServices();
    }, []);

    const handleLogoutClick = () => {
        logout();
        navigate('/', { replace: true });
    };

    const fetchServices = async () => {
        try {
            const response = await fetch(`${API_URL}/api/services`);
            if (!response.ok) throw new Error('Failed to fetch services');
            const data = await response.json();
            setServices(data);
            setFilteredServices(data);
        } catch (error) {
            console.error('API Error, trying fallback:', error);
            try {
                const res = await fetch('/services.json');
                if (res.ok) {
                    const data = await res.json();
                    setServices(data);
                    setFilteredServices(data);
                    setMessage({ text: 'Database is offline. Showing cached services (Read-Only).', type: 'error' });
                } else {
                    setMessage({ text: 'Failed to load services', type: 'error' });
                }
            } catch (jsonErr) {
                setMessage({ text: 'Failed to load services', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle search (Live Filter - Title ONLY as requested)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredServices(services);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = services.filter(service =>
                service.title && service.title.toLowerCase().startsWith(lowerQuery)
            );
            setFilteredServices(filtered);
        }
    }, [searchQuery, services]);

    // Handle Manual Search (Title ONLY)
    const handleManualSearch = (e) => {
        if (e) e.preventDefault();

        if (!searchQuery.trim()) {
            setFilteredServices(services);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = services.filter(service =>
                service.title && service.title.toLowerCase().startsWith(lowerQuery)
            );
            setFilteredServices(filtered);
        }
    };

    const handleEdit = (service) => {
        setEditingId(service.id);

        let details = {};
        try {
            details = typeof service.details === 'string' ? JSON.parse(service.details) : service.details;
        } catch (e) {
            details = { cards: [], faqs: [] };
        }

        setEditForm({
            name: service.name,
            title: service.title,
            description: service.description,
            cards: details?.cards || [],
            faqs: details?.faqs || []
        });
    };

    const handleCreateNew = () => {
        setEditingId('new');
        setSearchQuery('');
        setFilteredServices([]);

        setEditForm({
            name: '',
            title: '',
            description: '',
            cards: [],
            faqs: []
        });
        setActiveEditTab('content');
    };

    const handleDeleteService = async (serviceId, serviceName) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the service: "${serviceName}"? This cannot be undone.`);
        if (!confirmDelete) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                navigate('/');
                return;
            }

            if (!response.ok) throw new Error('Failed to delete service');

            setMessage({ text: 'Service deleted successfully', type: 'success' });
            // Refresh list
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            setMessage({ text: 'Failed to delete service', type: 'error' });
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
        setSearchQuery('');
        setFilteredServices(services);
    };

    // --- Content (Cards) Helpers ---
    const handleCardChange = (index, field, value) => {
        const newCards = [...editForm.cards];
        newCards[index] = { ...newCards[index], [field]: value };
        setEditForm({ ...editForm, cards: newCards });
    };

    const handleCardItemsChange = (index, value) => {
        const items = value.split('\n').filter(item => item.trim() !== '');
        const newCards = [...editForm.cards];
        newCards[index] = { ...newCards[index], items };
        setEditForm({ ...editForm, cards: newCards });
    };

    const addCard = () => {
        setEditForm({
            ...editForm,
            cards: [...editForm.cards, { title: 'New Section', content: '', icon: 'FileText' }]
        });
    };

    const removeCard = (index) => {
        const newCards = editForm.cards.filter((_, i) => i !== index);
        setEditForm({ ...editForm, cards: newCards });
    };

    // --- FAQ Helpers ---
    const handleFaqChange = (index, field, value) => {
        const newFaqs = [...editForm.faqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        setEditForm({ ...editForm, faqs: newFaqs });
    };

    const addFaq = () => {
        setEditForm({ ...editForm, faqs: [...editForm.faqs, { q: '', a: '' }] });
    };

    const removeFaq = (index) => {
        const newFaqs = editForm.faqs.filter((_, i) => i !== index);
        setEditForm({ ...editForm, faqs: newFaqs });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            // Add or Update Download Card
            const downloadHtml = `Download the official document here: <a href="${data.filePath}" target="_blank" class="text-blue-500 underline">View PDF</a>`;

            const newCards = [...editForm.cards];
            const existingIndex = newCards.findIndex(c => c.title.toLowerCase() === 'download');

            if (existingIndex >= 0) {
                newCards[existingIndex] = { ...newCards[existingIndex], content: downloadHtml, items: [] };
            } else {
                newCards.push({ title: 'Download', content: downloadHtml, items: [], icon: 'Download' });
            }

            setEditForm({ ...editForm, cards: newCards });
            setMessage({ text: 'File uploaded and attached successfully!', type: 'success' });
        } catch (error) {
            console.error('Upload Error:', error);
            setMessage({ text: 'Failed to upload file', type: 'error' });
        }
    };

    const handleSave = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const detailsObj = {
                cards: editForm.cards,
                faqs: editForm.faqs
            };

            const payload = {
                name: editForm.name,
                title: editForm.title,
                description: editForm.description,
                details: JSON.stringify(detailsObj)
            };

            const isNew = id === 'new';
            const url = isNew ? `${API_URL}/api/services` : `${API_URL}/api/services/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                navigate('/');
                return;
            }

            if (!response.ok) throw new Error(isNew ? 'Failed to create service' : 'Failed to update service');

            setMessage({ text: isNew ? 'Service created successfully!' : 'Service updated successfully!', type: 'success' });
            setEditingId(null);
            fetchServices();
        } catch (error) {
            console.error('Error:', error);
            setMessage({ text: 'Failed to save service', type: 'error' });
        }
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh' }}>

            {/* Header & Search */}
            <div style={{ textAlign: 'center', marginBottom: '50px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <h1 style={{ color: '#2c3e50', margin: 0 }}>Admin Dashboard</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleCreateNew}
                            title="Add New Service"
                            style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            <Plus size={16} /> Add Service
                        </button>
                        <button
                            onClick={handleLogoutClick}
                            title="Logout"
                            style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>

                {editingId !== 'new' && (
                    <form
                        onSubmit={handleManualSearch}
                        style={{ position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto' }}
                    >
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '15px 120px 15px 50px',
                                borderRadius: '30px',
                                border: '2px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}
                        />
                        <Search color="#94a3b8" size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                        <button
                            type="submit"
                            style={{
                                position: 'absolute',
                                right: '6px',
                                top: '6px',
                                bottom: '6px',
                                padding: '0 25px',
                                borderRadius: '25px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                zIndex: 10
                            }}
                        >
                            Search
                        </button>
                    </form>
                )}
            </div>

            {/* Notification */}
            {message.text && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#dc2626' : '#16a34a',
                    maxWidth: '800px', margin: '0 auto 20px auto',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Editor (New or Edit) OR List */}
            {loading ? (
                <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginTop: '50px' }}>Loading...</div>
            ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '20px' }}>

                    {/* --- UNIFIED EDITOR (For both New & Edit) --- */}
                    {editingId ? (
                        <div style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            border: '1px solid #eee'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Edit Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                    <h3 style={{ margin: 0, color: '#3498db', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {activeEditTab === 'faq' ? <HelpCircle size={24} /> : <FileText size={24} />}
                                        {editingId === 'new' ? 'Creating New Service' : `Editing: ${editForm.name}`}
                                    </h3>

                                    {/* Tabs */}
                                    <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                        <button
                                            onClick={() => setActiveEditTab('content')}
                                            style={{
                                                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                background: activeEditTab === 'content' ? '#fff' : 'transparent',
                                                boxShadow: activeEditTab === 'content' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                color: activeEditTab === 'content' ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '0.9rem'
                                            }}
                                        >
                                            Content
                                        </button>
                                        <button
                                            onClick={() => setActiveEditTab('faq')}
                                            style={{
                                                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                background: activeEditTab === 'faq' ? '#fff' : 'transparent',
                                                boxShadow: activeEditTab === 'faq' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                color: activeEditTab === 'faq' ? '#2563eb' : '#64748b', fontWeight: '600', fontSize: '0.9rem'
                                            }}
                                        >
                                            FAQs
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleSave(editingId)}
                                            className="btn-save"
                                            style={{ padding: '8px 16px', borderRadius: '6px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <Save size={18} /> Save
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <X size={18} /> Cancel
                                        </button>
                                    </div>
                                </div>

                                {/* Edit Content Based on Selection */}
                                <div style={{ padding: '10px 0' }}>
                                    {/* CONTENT EDITING (General + Sections) */}
                                    {activeEditTab === 'content' && (
                                        <div style={{ display: 'grid', gap: '25px' }}>

                                            {/* Name (Only editable if new, but let's allow editing for now or show as regular input) */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '600', color: '#64748b' }}>Service Name (Internal/DB Key)</label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    placeholder="e.g. Divorce"
                                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>

                                            {/* General Info Section */}
                                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>General Information</h4>
                                                <div style={{ display: 'grid', gap: '15px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '600', color: '#64748b' }}>Display Title</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.title}
                                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                            placeholder="e.g. Divorce Filing Assistance"
                                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '600', color: '#64748b' }}>Description</label>
                                                        <textarea
                                                            value={editForm.description}
                                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                            rows={2}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Attach Document Section */}
                                            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #b3e5fc' }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Attach Document (PDF)</h4>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        onChange={handleFileUpload}
                                                        style={{ fontSize: '0.9rem' }}
                                                    />
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Uploading will auto-create a "Download" section.</span>
                                                </div>
                                            </div>

                                            {/* Cards/Sections */}
                                            {editForm.cards.map((card, index) => (
                                                <div key={index} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#334155' }}>Section: {card.title || `Section #${index + 1}`}</span>
                                                        <button onClick={() => removeCard(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    </div>

                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#64748b' }}>Title</label>
                                                        <input
                                                            type="text"
                                                            value={card.title}
                                                            onChange={(e) => handleCardChange(index, 'title', e.target.value)}
                                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                        />
                                                    </div>

                                                    {card.items ? (
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#64748b' }}>List Items (One per line)</label>
                                                            <textarea
                                                                value={card.items.join('\n')}
                                                                onChange={(e) => handleCardItemsChange(index, e.target.value)}
                                                                rows={5}
                                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                                placeholder="Item 1&#10;Item 2"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#64748b' }}>Content</label>
                                                            <textarea
                                                                value={card.content || ''}
                                                                onChange={(e) => handleCardChange(index, 'content', e.target.value)}
                                                                rows={5}
                                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                onClick={addCard}
                                                style={{ alignSelf: 'center', padding: '10px 20px', borderRadius: '25px', background: '#e0f2fe', color: '#0ea5e9', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Plus size={18} /> Add New Section
                                            </button>
                                        </div>
                                    )}

                                    {/* FAQ EDITING */}
                                    {activeEditTab === 'faq' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {editForm.faqs.map((faq, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'start', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ flex: 1, display: 'grid', gap: '10px' }}>
                                                        <input
                                                            type="text"
                                                            value={faq.q}
                                                            onChange={(e) => handleFaqChange(index, 'q', e.target.value)}
                                                            placeholder="Question"
                                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '500' }}
                                                        />
                                                        <textarea
                                                            value={faq.a}
                                                            onChange={(e) => handleFaqChange(index, 'a', e.target.value)}
                                                            placeholder="Answer"
                                                            rows={2}
                                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeFaq(index)}
                                                        title="Delete FAQ"
                                                        style={{ padding: '8px', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', marginTop: '5px' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={addFaq}
                                                style={{ alignSelf: 'center', padding: '10px 20px', borderRadius: '25px', background: '#e0f2fe', color: '#0ea5e9', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Plus size={18} /> Add New FAQ
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                    ) : !searchQuery.trim() ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                            <p>Enter a service title above to begin editing, or click "Add Service" to create new.</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                            No services found matching "{searchQuery}"
                        </div>
                    ) : (
                        filteredServices.map((service) => (
                            <div key={service.id} style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '25px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                border: '1px solid #eee'
                            }}>
                                {/* --- SEARCH RESULT LIST ITEM --- */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.2rem' }}>{service.name}</h3>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{service.title}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button
                                            onClick={() => { handleEdit(service); setActiveEditTab('content'); }}
                                            className="hover-btn"
                                            title="Edit Service Content"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '10px 20px', borderRadius: '8px',
                                                background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
                                                fontWeight: '500', transition: 'all 0.2s'
                                            }}
                                        >
                                            <FileText size={18} /> Edit Services
                                        </button>
                                        <button
                                            onClick={() => { handleEdit(service); setActiveEditTab('faq'); }}
                                            className="hover-btn"
                                            title="Edit FAQs"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '10px 20px', borderRadius: '8px',
                                                background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer',
                                                fontWeight: '500', transition: 'all 0.2s'
                                            }}
                                        >
                                            <HelpCircle size={18} /> Edit FAQs
                                        </button>
                                        <button
                                            onClick={() => handleDeleteService(service.id, service.name)}
                                            className="hover-btn"
                                            title="Delete Service"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '10px', borderRadius: '8px',
                                                background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer',
                                                fontWeight: '500', transition: 'all 0.2s'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;

