import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ServiceDetailView from './ServiceDetailView';

const SearchSection = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('services'); // 'services' or 'faq'

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setActiveTab('services'); // Reset to services tab on new search
    try {
      // Use relative path - handled by Vite proxy in dev and Netlify redirects in prod
      const API_URL = '';
      const response = await fetch(`${API_URL}/api/services?search=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log("Received data:", data); // Debug log
      setResults(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div className="container" style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '20px' }}>Find Legal Services</h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a service (e.g., Name Change)..."
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  paddingLeft: '45px',
                  fontSize: '1.1rem',
                  border: '2px solid #ddd',
                  borderRadius: '30px',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
              />
              <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            </div>
            <button
              type="submit"
              className="btn"
              style={{ borderRadius: '30px', padding: '0 30px' }}
            >
              Search
            </button>
          </form>
        </div>

        <div className="results-container">
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666' }}>Searching...</div>
          ) : (
            <>
              {hasSearched && results.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666' }}>No services found matching "{query}".</div>
              )}

              {hasSearched && results.length > 0 && (
                <>
                  {/* Tab Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                    <button
                      onClick={() => setActiveTab('services')}
                      style={{
                        padding: '10px 30px',
                        fontSize: '1.1rem',
                        borderRadius: '25px',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'services' ? '#3498db' : '#eee',
                        color: activeTab === 'services' ? '#fff' : '#555',
                        transition: 'all 0.3s'
                      }}
                    >
                      Services
                    </button>
                    <button
                      onClick={() => setActiveTab('faq')}
                      style={{
                        padding: '10px 30px',
                        fontSize: '1.1rem',
                        borderRadius: '25px',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'faq' ? '#3498db' : '#eee',
                        color: activeTab === 'faq' ? '#fff' : '#555',
                        transition: 'all 0.3s'
                      }}
                    >
                      FAQ
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '30px' }}>
                    {results.map((service) => (
                      <div key={service.id} style={{
                        background: '#fff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {/* Image removed as requested */}

                        <div style={{ padding: '25px' }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '5px 10px',
                            background: '#e1f0fa',
                            color: '#3498db',
                            borderRadius: '15px',
                            fontSize: '0.85rem',
                            marginBottom: '10px',
                            fontWeight: '600'
                          }}>
                            {service.name}
                          </div>
                          <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.5rem' }}>{service.title}</h3>
                          <p style={{ color: '#555', lineHeight: '1.7' }}>{service.description}</p>

                          {/* Render detailed view if available, passing the active tab */}
                          {service.details && <ServiceDetailView details={service.details} activeTab={activeTab} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchSection;