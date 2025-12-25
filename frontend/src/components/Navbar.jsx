import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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