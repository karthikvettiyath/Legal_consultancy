import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import BillingPage from './pages/BillingPage';
import SavedBillingsPage from './pages/SavedBillingsPage';
import ClientManagementPage from './pages/ClientManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Root is now Login Page */}
          <Route path="/" element={<LoginPage />} />

          {/* Dashboard/Home with options */}
          <Route path="/home" element={<LandingPage />} />

          {/* Billing App - UNPROTECTED as requested */}
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/saved-billings" element={<SavedBillingsPage />} />

          {/* Client Management - Protected */}
          <Route path="/clients" element={
            <ProtectedRoute>
              <ClientManagementPage />
            </ProtectedRoute>
          } />

          {/* Legal App */}
          <Route path="/legal" element={<LegalLayout />}>
            <Route index element={<HomePage />} />
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;