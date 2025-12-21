import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header style={{ background: '#2c3e50', color: '#fff', padding: '0.5rem 0', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Legal<span style={{ color: '#3498db' }}>Expert</span></h1>
          </Link>
        </div>

        <nav>
          <ul style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: 0, listStyle: 'none' }} className="desktop-nav">
            <li><Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link></li>
            <li><Link to="/admin" style={{ color: '#fff', opacity: 0.7, textDecoration: 'none' }}>Admin Portal</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;