import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ServiceDetailView from './ServiceDetailView';

const SearchSection = () => {
  const [query, setQuery] = useState('');
  const [allServices, setAllServices] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services'); // 'services' or 'faq'

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // Prioritize API (Live DB)
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch from API');
      const data = await response.json();
      setAllServices(data);
    } catch (apiError) {
      console.error('Error fetching from API, falling back to JSON:', apiError);
      // Fallback to static JSON
      try {
        const response = await fetch('/services.json');
        if (response.ok) {
          const data = await response.json();
          setAllServices(data);
        } else {
          setAllServices([]);
          setResults([]);
        }
      } catch (jsonError) {
        console.error('Error fetching services from JSON:', jsonError);
        setAllServices([]);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Live filtering
  useEffect(() => {
    if (!query.trim()) {
      setResults(allServices); // Show all services by default
    } else {
      const lowerQuery = query.toLowerCase();
      // Using startsWith to match Admin Portal behavior
      const filtered = allServices.filter(service =>
        service.title && service.title.toLowerCase().startsWith(lowerQuery)
      );
      setResults(filtered);
    }
  }, [query, allServices]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by useEffect as user types
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
            {/* Kept button for UX, but it doesn't trigger separate search anymore */}
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
            <div style={{ textAlign: 'center', color: '#666' }}>Loading services...</div>
          ) : (
            <>
              {results.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666' }}>No services found matching "{query}".</div>
              ) : (
                <>
                  {/* Tab Buttons - Only show if we have results */}
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