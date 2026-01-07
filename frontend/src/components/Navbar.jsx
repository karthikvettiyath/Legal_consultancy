import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showServices, setShowServices] = useState(false);
  const [servicesList, setServicesList] = useState([]);

  // Fetch services for the dropdown
  React.useEffect(() => {
    if (showServices && servicesList.length === 0) {
      fetch('/api/services')
        .then(res => res.ok ? res.json() : fetch('/services.json').then(r => r.json()))
        .then(data => setServicesList(data))
        .catch(err => console.error("Failed to load services for navbar", err));
    }
  }, [showServices, servicesList.length]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{ background: '#2c3e50', color: '#fff', padding: '0.5rem 0', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo">
          {/* Link to Legal Home */}
          <Link to="/legal" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Legal<span style={{ color: '#3498db' }}>Expert</span></h1>
          </Link>
        </div>

        <nav>
          <ul style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: 0, listStyle: 'none' }} className="desktop-nav">
            <li><Link to="/legal" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link></li>
            {/* Services Dropdown */}
            <li style={{ position: 'relative' }}>
              <button
                onClick={() => setShowServices(!showServices)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              >
                <Briefcase size={18} />
                Services
              </button>

              {showServices && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  background: '#fff',
                  color: '#333',
                  minWidth: '250px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '10px 0',
                  zIndex: 2000,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {servicesList.length === 0 ? (
                    <div style={{ padding: '10px 20px', color: '#666' }}>Loading services...</div>
                  ) : (
                    servicesList.map(service => (
                      <Link
                        key={service.id}
                        to={`/legal?search=${encodeURIComponent(service.name)}`}
                        onClick={() => {
                          setShowServices(false);
                        }}
                        style={{
                          display: 'block',
                          padding: '10px 20px',
                          textDecoration: 'none',
                          color: '#2c3e50',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        {service.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </li>

            {user?.role === 'admin' && (
              <li><Link to="/legal/admin" style={{ color: '#fff', opacity: 0.7, textDecoration: 'none' }}>Admin Portal</Link></li>
            )}

            {/* Optional: Link back to Main Portal */}
            <li><Link to="/home" style={{ color: '#cbd5e1', fontSize: '0.9rem', textDecoration: 'none', border: '1px solid #475569', padding: '4px 8px', borderRadius: '4px' }}>Apps</Link></li>

            {user && (
              <li>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};


export default Navbar;