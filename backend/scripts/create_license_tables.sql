-- ============================================
-- License & Agreement Management Module
-- Database Schema
-- ============================================

-- 1. License Types Table
CREATE TABLE IF NOT EXISTS license_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Client License Records
CREATE TABLE IF NOT EXISTS client_licenses (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    manual_client_name VARCHAR(255),
    license_type_id INTEGER REFERENCES license_types(id) ON DELETE CASCADE,
    file_no VARCHAR(100),
    service_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Expired', 'Renewed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. License Services Table
CREATE TABLE IF NOT EXISTS license_services (
    id SERIAL PRIMARY KEY,
    client_license_id INTEGER REFERENCES client_licenses(id) ON DELETE CASCADE,
    service_description TEXT,
    service_cost DECIMAL(12, 2) DEFAULT 0,
    service_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. License Billing Table
CREATE TABLE IF NOT EXISTS license_billing (
    id SERIAL PRIMARY KEY,
    client_license_id INTEGER REFERENCES client_licenses(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending')),
    invoice_no VARCHAR(100),
    payment_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. License Notifications Table
CREATE TABLE IF NOT EXISTS license_notifications (
    id SERIAL PRIMARY KEY,
    client_license_id INTEGER REFERENCES client_licenses(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) DEFAULT 'Expiry Reminder',
    message TEXT,
    is_sent BOOLEAN DEFAULT FALSE,
    scheduled_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_licenses_client_id ON client_licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_client_licenses_license_type_id ON client_licenses(license_type_id);
CREATE INDEX IF NOT EXISTS idx_client_licenses_expiry_date ON client_licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_client_licenses_status ON client_licenses(status);
CREATE INDEX IF NOT EXISTS idx_license_billing_client_license_id ON license_billing(client_license_id);
CREATE INDEX IF NOT EXISTS idx_license_notifications_scheduled_date ON license_notifications(scheduled_date);
