CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'citizen',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users (clerk_id);

-- Cases
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    assigned_officer_id INTEGER REFERENCES users(id),
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    crime_subtype VARCHAR(100),
    incident_date TIMESTAMP,
    financial_loss FLOAT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    affected_platform VARCHAR(255),
    suspect_info TEXT,
    victim_area VARCHAR(255),
    district VARCHAR(120),
    state VARCHAR(120),
    status VARCHAR(40) NOT NULL DEFAULT 'submitted',
    severity_score SMALLINT,
    ai_confidence FLOAT,
    is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cases_reporter ON cases (reporter_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id),
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    original_filename VARCHAR(500) NOT NULL,
    storage_key VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    sha256_hash VARCHAR(64) NOT NULL,
    is_virus_clean BOOLEAN,
    annotation TEXT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Threat Analysis (1:1 with case)
CREATE TABLE IF NOT EXISTS threat_analyses (
    id SERIAL PRIMARY KEY,
    case_id INTEGER UNIQUE NOT NULL REFERENCES cases(id),
    model_version VARCHAR(50),
    crime_type_predicted VARCHAR(100),
    crime_subtype_predicted VARCHAR(100),
    confidence_score FLOAT,
    severity_score FLOAT,
    extracted_entities TEXT DEFAULT '{}',
    severity_factors TEXT DEFAULT '{}',
    guidance_text TEXT,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Incidents (legacy / quick reports)
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    crime_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    reporter_email VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Risk Scores
CREATE TABLE IF NOT EXISTS risk_scores (
    id SERIAL PRIMARY KEY,
    area_code VARCHAR(120) NOT NULL,
    score FLOAT NOT NULL,
    risk_level VARCHAR(30) NOT NULL,
    factors_json VARCHAR(4000) NOT NULL DEFAULT '{}',
    computed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_area ON risk_scores (area_code);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    area_code VARCHAR(120),
    severity VARCHAR(30) NOT NULL DEFAULT 'medium',
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed some demo risk data
INSERT INTO risk_scores (area_code, score, risk_level, factors_json) VALUES
  ('ZONE-MH', 78, 'high', '{"incident_density": 0.7, "avg_loss": 0.6, "phishing_concentration": 0.8}'),
  ('ZONE-DL', 85, 'critical', '{"incident_density": 0.9, "avg_loss": 0.8, "phishing_concentration": 0.7}'),
  ('ZONE-KA', 52, 'medium', '{"incident_density": 0.4, "avg_loss": 0.3, "phishing_concentration": 0.5}'),
  ('ZONE-TN', 44, 'medium', '{"incident_density": 0.3, "avg_loss": 0.4, "phishing_concentration": 0.3}'),
  ('ZONE-UP', 70, 'high', '{"incident_density": 0.6, "avg_loss": 0.7, "phishing_concentration": 0.6}'),
  ('ZONE-GJ', 38, 'low', '{"incident_density": 0.2, "avg_loss": 0.3, "phishing_concentration": 0.2}'),
  ('ZONE-WB', 61, 'high', '{"incident_density": 0.5, "avg_loss": 0.5, "phishing_concentration": 0.6}'),
  ('ZONE-RJ', 33, 'low', '{"incident_density": 0.2, "avg_loss": 0.2, "phishing_concentration": 0.3}'),
  ('ZONE-KL', 47, 'medium', '{"incident_density": 0.3, "avg_loss": 0.4, "phishing_concentration": 0.4}'),
  ('ZONE-TG', 55, 'medium', '{"incident_density": 0.4, "avg_loss": 0.5, "phishing_concentration": 0.4}')
ON CONFLICT DO NOTHING;

-- Seed demo alerts
INSERT INTO alerts (alert_type, area_code, severity, message) VALUES
  ('spike', 'ZONE-DL', 'critical', 'Phishing incident spike detected in Delhi NCR region'),
  ('spike', 'ZONE-MH', 'high', 'UPI fraud cases increased 40% in Mumbai metropolitan area'),
  ('new_threat', 'ZONE-KA', 'medium', 'New ransomware variant targeting SMBs in Bangalore'),
  ('anomaly', 'ZONE-UP', 'high', 'Unusual pattern of identity theft reports in Lucknow')
ON CONFLICT DO NOTHING;
