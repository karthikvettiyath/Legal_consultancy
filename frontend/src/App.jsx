import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import BillingPage from './pages/BillingPage';
import ProtectedRoute from './components/ProtectedRoute';

// Layout for Legal App
const LegalLayout = () => {
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Landing Page - Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Global Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Billing App - Protected */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />

        {/* Legal App - Protected (Root and sub-routes) */}
        <Route
          path="/legal"
          element={
            <ProtectedRoute>
              <LegalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="admin" element={<AdminPage />} />
          {/* Note: login path here is legacy or could redirect to /login.
                 Since we protect the parent, you can't reach /legal/login without being logged in (loop).
                 So we remove /legal/login and use global /login.
             */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;