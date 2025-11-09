-- =============================================================================
-- PACSUM ERP - Development Seed Data
-- =============================================================================
-- File: dev-data.sql
-- Purpose: Sample data for development and testing
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-07
-- Compatible with: PostgreSQL 13+, Supabase
-- =============================================================================

-- WARNING: This file contains sample data for DEVELOPMENT ONLY
-- DO NOT run this in production!

-- =============================================================================
-- CLEAN EXISTING DATA (for idempotent seeds)
-- =============================================================================

-- Delete in reverse order of dependencies
TRUNCATE TABLE sync_logs CASCADE;
TRUNCATE TABLE compliance_logs CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE fhs_scores CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE integrations CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- Reset sequences if any
-- Note: We're using UUIDs, so no sequences to reset

-- =============================================================================
-- 1. ORGANIZATIONS (1 test organization)
-- =============================================================================

INSERT INTO organizations (
    id,
    name,
    slug,
    subscription_tier,
    subscription_status,
    subscription_expires_at,
    contact_email,
    contact_phone,
    settings
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ACME Bookkeeping',
    'acme-bookkeeping',
    'professional',
    'active',
    NOW() + INTERVAL '1 year',
    'contact@acmebookkeeping.com',
    '+1-555-0100',
    '{
        "timezone": "America/New_York",
        "fiscal_year_start": "01-01",
        "currency": "USD",
        "date_format": "MM/DD/YYYY",
        "company_size": "small",
        "industry": "accounting"
    }'::jsonb
);

-- =============================================================================
-- 2. USERS (3 test users with different roles)
-- =============================================================================

-- Owner user
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    email_verified,
    email_verified_at,
    first_name,
    last_name,
    role,
    status,
    preferences
) VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'owner@acmebookkeeping.com',
    crypt('password123', gen_salt('bf')), -- Hashed password
    TRUE,
    NOW() - INTERVAL '30 days',
    'Alice',
    'Johnson',
    'owner',
    'active',
    '{
        "theme": "light",
        "language": "en",
        "notifications": {
            "email": true,
            "push": true
        }
    }'::jsonb
);

-- Admin/Accountant user
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    email_verified,
    email_verified_at,
    first_name,
    last_name,
    role,
    status,
    preferences
) VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'accountant@acmebookkeeping.com',
    crypt('password123', gen_salt('bf')),
    TRUE,
    NOW() - INTERVAL '20 days',
    'Bob',
    'Smith',
    'accountant',
    'active',
    '{
        "theme": "dark",
        "language": "en",
        "notifications": {
            "email": true,
            "push": false
        }
    }'::jsonb
);

-- Viewer user
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    email_verified,
    email_verified_at,
    first_name,
    last_name,
    role,
    status,
    preferences
) VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'viewer@acmebookkeeping.com',
    crypt('password123', gen_salt('bf')),
    TRUE,
    NOW() - INTERVAL '10 days',
    'Carol',
    'Williams',
    'viewer',
    'active',
    '{
        "theme": "light",
        "language": "en",
        "notifications": {
            "email": false,
            "push": false
        }
    }'::jsonb
);

-- =============================================================================
-- 3. CLIENTS (5 test clients)
-- =============================================================================

-- Client 1: Tech Startup
INSERT INTO clients (
    id,
    organization_id,
    name,
    legal_name,
    client_code,
    industry,
    entity_type,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    address_line1,
    city,
    state,
    postal_code,
    tax_id_number,
    tax_id_type,
    status,
    risk_level,
    current_fhs_score,
    billing_rate,
    billing_frequency,
    billing_day_of_month,
    assigned_accountant_id,
    created_by
) VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'TechStart Inc.',
    'TechStart Incorporated',
    'TS-001',
    'Technology',
    'corporation',
    'John Doe',
    'john@techstart.com',
    '+1-555-0101',
    '123 Silicon Valley Rd',
    'San Francisco',
    'CA',
    '94102',
    '12-3456789',
    'EIN',
    'active',
    'low',
    85.50,
    2500.00,
    'monthly',
    1,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Client 2: Restaurant
INSERT INTO clients (
    id,
    organization_id,
    name,
    legal_name,
    client_code,
    industry,
    entity_type,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    address_line1,
    city,
    state,
    postal_code,
    tax_id_number,
    tax_id_type,
    status,
    risk_level,
    current_fhs_score,
    billing_rate,
    billing_frequency,
    billing_day_of_month,
    assigned_accountant_id,
    created_by
) VALUES (
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'The Gourmet Kitchen',
    'Gourmet Kitchen LLC',
    'GK-002',
    'Food & Beverage',
    'llc',
    'Jane Smith',
    'jane@gourmetkitchen.com',
    '+1-555-0102',
    '456 Main Street',
    'New York',
    'NY',
    '10001',
    '98-7654321',
    'EIN',
    'active',
    'medium',
    72.30,
    1800.00,
    'monthly',
    15,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Client 3: Consulting Firm
INSERT INTO clients (
    id,
    organization_id,
    name,
    client_code,
    industry,
    entity_type,
    primary_contact_name,
    primary_contact_email,
    address_line1,
    city,
    state,
    postal_code,
    tax_id_number,
    tax_id_type,
    status,
    risk_level,
    current_fhs_score,
    billing_rate,
    billing_frequency,
    assigned_accountant_id,
    created_by
) VALUES (
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Strategic Consulting Partners',
    'SCP-003',
    'Professional Services',
    's_corp',
    'Michael Brown',
    'michael@strategiccp.com',
    '789 Business Ave',
    'Chicago',
    'IL',
    '60601',
    '45-6789012',
    'EIN',
    'active',
    'low',
    91.20,
    3200.00,
    'monthly',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Client 4: E-commerce Store (prospect)
INSERT INTO clients (
    id,
    organization_id,
    name,
    client_code,
    industry,
    entity_type,
    primary_contact_name,
    primary_contact_email,
    status,
    risk_level,
    billing_rate,
    billing_frequency,
    created_by
) VALUES (
    '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Online Boutique',
    'OB-004',
    'Retail',
    'sole_proprietor',
    'Sarah Wilson',
    'sarah@onlineboutique.com',
    'prospect',
    'low',
    1200.00,
    'monthly',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Client 5: Non-profit (at risk)
INSERT INTO clients (
    id,
    organization_id,
    name,
    legal_name,
    client_code,
    industry,
    entity_type,
    primary_contact_name,
    primary_contact_email,
    address_line1,
    city,
    state,
    postal_code,
    tax_id_number,
    tax_id_type,
    status,
    risk_level,
    current_fhs_score,
    billing_rate,
    billing_frequency,
    assigned_accountant_id,
    created_by
) VALUES (
    '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Community Support Fund',
    'Community Support Fund Inc.',
    'CSF-005',
    'Non-Profit',
    'non_profit',
    'David Lee',
    'david@communitysupport.org',
    '321 Charity Lane',
    'Boston',
    'MA',
    '02101',
    '55-1234567',
    'EIN',
    'active',
    'high',
    58.70,
    1500.00,
    'quarterly',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- =============================================================================
-- 4. TRANSACTIONS (20 sample transactions across clients)
-- =============================================================================

-- TechStart Inc. transactions
INSERT INTO transactions (organization_id, client_id, transaction_date, description, amount, category, transaction_type, payment_method, status, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-01', 'Software License Revenue', 15000.00, 'Software Sales', 'income', 'ach', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-03', 'Office Rent', -3500.00, 'Rent', 'expense', 'check', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-05', 'Employee Salaries', -25000.00, 'Payroll', 'expense', 'ach', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-06', 'Consulting Services', 8500.00, 'Service Revenue', 'income', 'wire', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- The Gourmet Kitchen transactions
INSERT INTO transactions (organization_id, client_id, transaction_date, description, amount, category, transaction_type, payment_method, status, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-01', 'Daily Sales - Cash', 1250.00, 'Food Sales', 'income', 'cash', 'reconciled', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-01', 'Daily Sales - Credit Card', 2100.00, 'Food Sales', 'income', 'credit_card', 'reconciled', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-02', 'Food Supplies Purchase', -850.00, 'Cost of Goods Sold', 'expense', 'credit_card', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-04', 'Utilities - Gas & Electric', -420.00, 'Utilities', 'expense', 'ach', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Strategic Consulting Partners transactions
INSERT INTO transactions (organization_id, client_id, transaction_date, description, amount, category, transaction_type, payment_method, status, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-28', 'Client Project Payment', 45000.00, 'Consulting Revenue', 'income', 'wire', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-30', 'Office Supplies', -350.00, 'Office Expenses', 'expense', 'credit_card', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-01', 'Software Subscriptions', -1200.00, 'Software & Technology', 'expense', 'credit_card', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-05', 'Retainer Payment', 12000.00, 'Consulting Revenue', 'income', 'ach', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Community Support Fund transactions
INSERT INTO transactions (organization_id, client_id, transaction_date, description, amount, category, transaction_type, payment_method, status, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-15', 'Donation - Corporate Sponsor', 5000.00, 'Donations', 'income', 'check', 'reconciled', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-20', 'Community Event Expenses', -2500.00, 'Program Expenses', 'expense', 'debit_card', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-01', 'Grant Revenue', 10000.00, 'Grant Income', 'income', 'ach', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-03', 'Administrative Salaries', -4500.00, 'Payroll', 'expense', 'ach', 'posted', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Additional mixed transactions
INSERT INTO transactions (organization_id, client_id, transaction_date, description, amount, category, transaction_type, payment_method, status, tax_deductible, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-15', 'Marketing Campaign', -5500.00, 'Marketing', 'expense', 'credit_card', 'posted', TRUE, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-25', 'Equipment Purchase', -3200.00, 'Equipment', 'expense', 'credit_card', 'posted', TRUE, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-10-10', 'Business Insurance', -2400.00, 'Insurance', 'expense', 'check', 'posted', TRUE, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2024-11-07', 'Product Sales', 18500.00, 'Product Revenue', 'income', 'ach', 'pending', FALSE, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- =============================================================================
-- 5. INVOICES (3 sample invoices)
-- =============================================================================

-- Invoice 1: TechStart Inc. (Paid)
INSERT INTO invoices (
    organization_id,
    client_id,
    invoice_number,
    invoice_date,
    due_date,
    period_start_date,
    period_end_date,
    subtotal,
    tax_amount,
    total_amount,
    amount_paid,
    status,
    payment_terms,
    line_items,
    created_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'INV-2024-001',
    '2024-10-01',
    '2024-10-31',
    '2024-10-01',
    '2024-10-31',
    2500.00,
    0.00,
    2500.00,
    2500.00,
    'paid',
    'net_30',
    '[
        {
            "description": "Monthly Bookkeeping Services",
            "quantity": 1,
            "rate": 2500.00,
            "amount": 2500.00
        }
    ]'::jsonb,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Invoice 2: The Gourmet Kitchen (Sent, unpaid)
INSERT INTO invoices (
    organization_id,
    client_id,
    invoice_number,
    invoice_date,
    due_date,
    period_start_date,
    period_end_date,
    subtotal,
    tax_amount,
    total_amount,
    amount_paid,
    status,
    payment_terms,
    line_items,
    sent_at,
    created_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'INV-2024-002',
    '2024-11-01',
    '2024-11-15',
    '2024-11-01',
    '2024-11-30',
    1800.00,
    0.00,
    1800.00,
    0.00,
    'sent',
    'net_15',
    '[
        {
            "description": "Monthly Bookkeeping Services",
            "quantity": 1,
            "rate": 1800.00,
            "amount": 1800.00
        }
    ]'::jsonb,
    '2024-11-01 10:00:00+00',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Invoice 3: Strategic Consulting Partners (Partial payment)
INSERT INTO invoices (
    organization_id,
    client_id,
    invoice_number,
    invoice_date,
    due_date,
    period_start_date,
    period_end_date,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    amount_paid,
    status,
    payment_terms,
    line_items,
    notes,
    sent_at,
    created_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'INV-2024-003',
    '2024-10-15',
    '2024-11-14',
    '2024-10-01',
    '2024-10-31',
    3200.00,
    0.00,
    200.00,
    3000.00,
    1500.00,
    'partial',
    'net_30',
    '[
        {
            "description": "Monthly Bookkeeping Services - Premium",
            "quantity": 1,
            "rate": 3200.00,
            "amount": 3200.00
        }
    ]'::jsonb,
    'Early payment discount applied: $200',
    '2024-10-15 09:00:00+00',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- =============================================================================
-- 6. FHS SCORES (2 sample FHS calculations)
-- =============================================================================

-- TechStart Inc. FHS Score
INSERT INTO fhs_scores (
    organization_id,
    client_id,
    score,
    score_date,
    components,
    metrics,
    calculation_period_start,
    calculation_period_end,
    previous_score,
    score_change,
    score_trend,
    insights,
    recommendations,
    calculated_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    85.50,
    '2024-11-01',
    '{
        "cash_flow_health": 88.0,
        "profitability": 90.0,
        "debt_to_equity": 85.0,
        "working_capital": 82.0,
        "revenue_growth": 83.0
    }'::jsonb,
    '{
        "total_revenue": 50000.00,
        "total_expenses": 32000.00,
        "net_income": 18000.00,
        "total_assets": 125000.00,
        "total_liabilities": 45000.00,
        "cash_balance": 35000.00
    }'::jsonb,
    '2024-10-01',
    '2024-10-31',
    82.30,
    3.20,
    'improving',
    ARRAY[
        'Strong cash flow position with consistent revenue',
        'Healthy profit margin of 36%',
        'Low debt-to-equity ratio indicates financial stability'
    ],
    ARRAY[
        'Continue monitoring cash reserves',
        'Consider investing in growth opportunities',
        'Maintain current expense management practices'
    ],
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Community Support Fund FHS Score (at-risk)
INSERT INTO fhs_scores (
    organization_id,
    client_id,
    score,
    score_date,
    components,
    metrics,
    calculation_period_start,
    calculation_period_end,
    previous_score,
    score_change,
    score_trend,
    insights,
    recommendations,
    alerts,
    calculated_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    58.70,
    '2024-11-01',
    '{
        "cash_flow_health": 55.0,
        "profitability": 45.0,
        "debt_to_equity": 72.0,
        "working_capital": 58.0,
        "revenue_growth": 64.0
    }'::jsonb,
    '{
        "total_revenue": 15000.00,
        "total_expenses": 16500.00,
        "net_income": -1500.00,
        "total_assets": 42000.00,
        "total_liabilities": 12000.00,
        "cash_balance": 8500.00
    }'::jsonb,
    '2024-10-01',
    '2024-10-31',
    62.40,
    -3.70,
    'declining',
    ARRAY[
        'Negative cash flow this period',
        'Expenses exceeding revenue',
        'Cash reserves declining'
    ],
    ARRAY[
        'Review and reduce non-essential expenses immediately',
        'Explore additional grant opportunities',
        'Consider fundraising campaign to boost cash reserves',
        'Review pricing for fee-based services'
    ],
    ARRAY[
        'URGENT: Negative net income for the period',
        'Cash reserves below 3-month operating expenses'
    ],
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- =============================================================================
-- 7. INTEGRATIONS (Optional - QuickBooks and Stripe setup)
-- =============================================================================

-- QuickBooks Integration
INSERT INTO integrations (
    organization_id,
    provider,
    provider_name,
    status,
    is_active,
    config,
    connected_at,
    last_sync_at,
    sync_frequency,
    created_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'quickbooks',
    'QuickBooks Online',
    'connected',
    TRUE,
    '{
        "realm_id": "123456789",
        "company_name": "ACME Bookkeeping",
        "sync_transactions": true,
        "sync_invoices": true,
        "sync_clients": true
    }'::jsonb,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '1 hour',
    'daily',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Stripe Integration
INSERT INTO integrations (
    organization_id,
    provider,
    provider_name,
    status,
    is_active,
    config,
    connected_at,
    last_sync_at,
    sync_frequency,
    created_by
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'stripe',
    'Stripe Payments',
    'connected',
    TRUE,
    '{
        "account_id": "acct_test123",
        "webhook_secret": "whsec_test456",
        "auto_sync_payments": true
    }'::jsonb,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '30 minutes',
    'realtime',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- =============================================================================
-- 8. UPDATE STATISTICS
-- =============================================================================

ANALYZE organizations;
ANALYZE users;
ANALYZE clients;
ANALYZE transactions;
ANALYZE invoices;
ANALYZE fhs_scores;
ANALYZE integrations;

-- =============================================================================
-- SEED DATA SUMMARY
-- =============================================================================

-- Display summary of seeded data
SELECT 'Seed Data Summary' AS info;

SELECT 'Organizations: ' || COUNT(*) AS count FROM organizations;
SELECT 'Users: ' || COUNT(*) AS count FROM users;
SELECT 'Clients: ' || COUNT(*) AS count FROM clients;
SELECT 'Transactions: ' || COUNT(*) AS count FROM transactions;
SELECT 'Invoices: ' || COUNT(*) AS count FROM invoices;
SELECT 'FHS Scores: ' || COUNT(*) AS count FROM fhs_scores;
SELECT 'Integrations: ' || COUNT(*) AS count FROM integrations;

-- Test login credentials
SELECT '
=============================================================================
TEST LOGIN CREDENTIALS
=============================================================================
Owner Account:
  Email: owner@acmebookkeeping.com
  Password: password123
  Role: owner

Accountant Account:
  Email: accountant@acmebookkeeping.com
  Password: password123
  Role: accountant

Viewer Account:
  Email: viewer@acmebookkeeping.com
  Password: password123
  Role: viewer

Organization: ACME Bookkeeping (acme-bookkeeping)
=============================================================================
' AS credentials;

-- =============================================================================
-- END OF SEED DATA
-- =============================================================================
