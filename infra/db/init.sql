CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS dis_anomaly_events CASCADE;
DROP TABLE IF EXISTS case_lifecycle CASCADE;
DROP TABLE IF EXISTS fir_drafts CASCADE;
DROP TABLE IF EXISTS safety_guidance_delivery CASCADE;
DROP TABLE IF EXISTS otp_sessions CASCADE;
DROP TABLE IF EXISTS complaint_entities CASCADE;
DROP TABLE IF EXISTS ai_decisions CASCADE;
DROP TABLE IF EXISTS cfcfrms_requests CASCADE;
DROP TABLE IF EXISTS evidence_files CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS citizens CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP TABLE IF EXISTS threat_analysis CASCADE;
DROP TABLE IF EXISTS threat_analyses CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE citizens (
    citizen_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
    full_name VARCHAR(200),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    state_code VARCHAR(5),
    digilocker_linked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_otp_count SMALLINT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    fcm_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE officers (
    officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_number VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
    state_code VARCHAR(5),
    district_code VARCHAR(10),
    police_station VARCHAR(200),
    keycloak_id VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    fcm_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_subject VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(200),
    citizen_id UUID REFERENCES citizens(citizen_id),
    officer_id UUID REFERENCES officers(officer_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

CREATE TABLE complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    victim_id UUID NOT NULL REFERENCES citizens(citizen_id),
    session_id VARCHAR(64) NOT NULL,
    raw_description TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'en',
    crime_category VARCHAR(60) NOT NULL,
    crime_subcategory VARCHAR(60),
    classification_confidence DECIMAL(5,4) NOT NULL,
    priority_score SMALLINT NOT NULL DEFAULT 0,
    financial_loss_amount DECIMAL(15,2),
    transaction_reference VARCHAR(50),
    upi_id_fraudster VARCHAR(100),
    incident_datetime TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    assigned_officer_id UUID REFERENCES officers(officer_id),
    fir_number VARCHAR(30),
    freeze_status VARCHAR(20) NOT NULL DEFAULT 'NOT_APPLICABLE',
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    state_code VARCHAR(5) NOT NULL,
    district_code VARCHAR(10) NOT NULL,
    organized_crime_flag BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(crime_category);
CREATE INDEX idx_complaints_priority ON complaints(priority_score);
CREATE INDEX idx_complaints_geo ON complaints(state_code, district_code);
CREATE INDEX idx_complaints_submitted ON complaints(submitted_at);

CREATE TABLE evidence_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id),
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    minio_storage_path TEXT NOT NULL,
    upload_timestamp TIMESTAMPTZ NOT NULL,
    uploader_ip INET NOT NULL,
    device_model VARCHAR(200),
    device_os VARCHAR(50),
    exif_gps_lat DECIMAL(10,8),
    exif_gps_lng DECIMAL(11,8),
    exif_original_timestamp TIMESTAMPTZ,
    exif_camera_model VARCHAR(200),
    editing_software_detected BOOLEAN NOT NULL DEFAULT FALSE,
    deepfake_score DECIMAL(5,4),
    deepfake_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    virus_scan_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cfcfrms_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id),
    transaction_reference VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    beneficiary_bank_ifsc VARCHAR(15),
    beneficiary_account VARCHAR(30),
    hop_number SMALLINT NOT NULL DEFAULT 1,
    cfcfrms_status VARCHAR(20) NOT NULL,
    amount_frozen DECIMAL(15,2),
    freeze_confirmed_at TIMESTAMPTZ,
    request_sent_at TIMESTAMPTZ NOT NULL,
    time_since_fraud_seconds INTEGER
);

CREATE TABLE ai_decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id),
    decision_type VARCHAR(40) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    input_text TEXT,
    output_value JSONB NOT NULL,
    shap_explanation JSONB,
    human_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_value VARCHAR(100),
    overriding_officer_id UUID REFERENCES officers(officer_id),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inference_latency_ms INTEGER
);

CREATE TABLE complaint_entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id),
    entity_type VARCHAR(20) NOT NULL,
    entity_value VARCHAR(500) NOT NULL,
    entity_value_hash CHAR(64) NOT NULL,
    extraction_method VARCHAR(20) NOT NULL,
    confidence DECIMAL(5,4),
    mha_fraud_flag BOOLEAN NOT NULL DEFAULT FALSE,
    tafcop_result_json JSONB,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_complaint_entities_lookup ON complaint_entities(entity_type, entity_value_hash);

CREATE TABLE otp_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(15) NOT NULL,
    otp_hash CHAR(64) NOT NULL,
    attempt_count SMALLINT NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE safety_guidance_delivery (
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id),
    step_code VARCHAR(60) NOT NULL,
    urgency VARCHAR(15) NOT NULL,
    delivered_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ
);

CREATE TABLE fir_drafts (
    draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(complaint_id),
    generated_by_model VARCHAR(100) NOT NULL,
    complainant_name VARCHAR(200) NOT NULL,
    complainant_address TEXT NOT NULL,
    incident_description TEXT NOT NULL,
    bns_sections VARCHAR(200) NOT NULL,
    it_act_sections VARCHAR(200) NOT NULL,
    accused_details_json JSONB NOT NULL,
    evidence_file_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    officer_edits_json JSONB,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approving_officer_id UUID REFERENCES officers(officer_id),
    approved_at TIMESTAMPTZ,
    fir_pdf_path TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_lifecycle (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID UNIQUE NOT NULL REFERENCES complaints(complaint_id),
    fir_number VARCHAR(30),
    investigating_officer_id UUID REFERENCES officers(officer_id),
    chargesheet_filed_at TIMESTAMPTZ,
    court_name VARCHAR(300),
    next_court_date DATE,
    verdict VARCHAR(20),
    sentence_description TEXT,
    amount_ordered_restored DECIMAL(15,2),
    amount_actually_restored DECIMAL(15,2),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dis_anomaly_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_hostname VARCHAR(100) NOT NULL,
    pod_name VARCHAR(200),
    isolation_forest_score DECIMAL(7,6) NOT NULL,
    autoencoder_score DECIMAL(7,6),
    ensemble_score DECIMAL(7,6) NOT NULL,
    metric_snapshot_json JSONB NOT NULL,
    response_action VARCHAR(30),
    response_executed_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO citizens (mobile_number, mobile_verified, full_name, preferred_language, state_code, digilocker_linked, last_login_at)
SELECT
    '+9198' || LPAD(gs::TEXT, 8, '0'),
    TRUE,
    'Citizen ' || gs,
    CASE WHEN gs % 5 = 0 THEN 'hi' WHEN gs % 7 = 0 THEN 'ta' ELSE 'en' END,
    (ARRAY['MH','DL','KA','UP','TN'])[1 + (gs % 5)],
    (gs % 3 = 0),
    NOW() - (gs || ' hours')::INTERVAL
FROM generate_series(1, 20) gs;

INSERT INTO officers (badge_number, full_name, mobile_number, role, state_code, district_code, police_station, keycloak_id)
SELECT
    'BADGE-' || LPAD(gs::TEXT, 4, '0'),
    'Officer ' || gs,
    '+9177' || LPAD(gs::TEXT, 8, '0'),
    CASE WHEN gs <= 6 THEN 'DISTRICT' WHEN gs <= 9 THEN 'STATE' ELSE 'NATIONAL' END,
    (ARRAY['MH','DL','KA','UP','TN'])[1 + (gs % 5)],
    'D' || LPAD((10 + gs)::TEXT, 3, '0'),
    'Cyber PS ' || gs,
    'keycloak-' || gs
FROM generate_series(1, 10) gs;

WITH citizen_pool AS (
    SELECT citizen_id, ROW_NUMBER() OVER (ORDER BY citizen_id) rn FROM citizens
),
officer_pool AS (
    SELECT officer_id, ROW_NUMBER() OVER (ORDER BY officer_id) rn FROM officers
)
INSERT INTO complaints (
    victim_id,
    session_id,
    raw_description,
    language_code,
    crime_category,
    crime_subcategory,
    classification_confidence,
    priority_score,
    financial_loss_amount,
    transaction_reference,
    upi_id_fraudster,
    incident_datetime,
    status,
    assigned_officer_id,
    fir_number,
    freeze_status,
    answers_json,
    state_code,
    district_code,
    organized_crime_flag,
    submitted_at,
    updated_at
)
SELECT
    cp.citizen_id,
    'sess-' || LPAD(gs::TEXT, 6, '0'),
    'Cyber complaint feed #' || gs || ' with financial fraud indicators and social engineering artifacts.',
    CASE WHEN gs % 5 = 0 THEN 'hi' ELSE 'en' END,
    (ARRAY['UPI_FRAUD','PHISHING','SOCIAL_MEDIA_SCAM','RANSOMWARE','IDENTITY_THEFT'])[1 + (gs % 5)],
    (ARRAY['SIM_SWAP','FAKE_KYC','MALWARE_LINK','ROMANCE_BAIT','OTP_TAKEOVER'])[1 + (gs % 5)],
    ROUND((0.8000 + (gs % 18) * 0.0100)::numeric, 4),
    45 + (gs % 55),
    (gs * 1750.00)::DECIMAL(15,2),
    CASE WHEN gs % 2 = 0 THEN 'UTR' || LPAD((100000 + gs)::TEXT, 8, '0') ELSE NULL END,
    CASE WHEN gs % 2 = 0 THEN 'fraudster' || gs || '@upi' ELSE NULL END,
    NOW() - (gs || ' days')::INTERVAL,
    CASE
        WHEN gs % 6 = 0 THEN 'INVESTIGATION'
        WHEN gs % 4 = 0 THEN 'ASSIGNED'
        WHEN gs % 3 = 0 THEN 'FREEZE_REQUESTED'
        ELSE 'RECEIVED'
    END,
    op.officer_id,
    CASE WHEN gs % 7 = 0 THEN 'FIR/2026/' || LPAD(gs::TEXT, 5, '0') ELSE NULL END,
    CASE WHEN gs % 2 = 0 THEN 'PENDING' ELSE 'NOT_APPLICABLE' END,
    jsonb_build_object('q_incident_type', 'digital-fraud', 'q_channel', CASE WHEN gs % 2 = 0 THEN 'upi' ELSE 'social' END),
    (ARRAY['MH','DL','KA','UP','TN'])[1 + (gs % 5)],
    'D' || LPAD((100 + (gs % 20))::TEXT, 3, '0'),
    (gs % 9 = 0),
    NOW() - (gs || ' days')::INTERVAL,
    NOW() - ((gs / 2.0) || ' days')::INTERVAL
FROM generate_series(1, 50) gs
JOIN citizen_pool cp ON cp.rn = ((gs - 1) % 20) + 1
JOIN officer_pool op ON op.rn = ((gs - 1) % 10) + 1;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO complaint_entities (complaint_id, entity_type, entity_value, entity_value_hash, extraction_method, confidence, mha_fraud_flag, tafcop_result_json)
SELECT
    c.complaint_id,
    CASE WHEN c.rn % 2 = 0 THEN 'UPI_ID' ELSE 'PHONE' END,
    CASE WHEN c.rn % 2 = 0 THEN 'entity' || c.rn || '@upi' ELSE '+9191' || LPAD(c.rn::TEXT, 8, '0') END,
    MD5(c.complaint_id::TEXT),
    'ML_NER',
    0.9100,
    (c.rn % 8 = 0),
    jsonb_build_object('simCount', 1 + (c.rn % 4), 'state', c.state_code)
FROM ranked_complaints c;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO ai_decisions (complaint_id, decision_type, model_name, model_version, input_text, output_value, shap_explanation, inference_latency_ms)
SELECT
    c.complaint_id,
    'CLASSIFICATION',
    'roberta-cybercrime',
    'v2.1.0',
    c.raw_description,
    jsonb_build_object('category', c.crime_category, 'confidence', c.classification_confidence),
    jsonb_build_object('keywords', jsonb_build_array('otp', 'upi', 'urgent')),
    120 + (c.rn % 80)
FROM ranked_complaints c;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO evidence_files (
    complaint_id, original_filename, file_type, mime_type, file_size_bytes, sha256_hash, minio_storage_path,
    upload_timestamp, uploader_ip, device_model, device_os, exif_gps_lat, exif_gps_lng, exif_original_timestamp,
    exif_camera_model, editing_software_detected, deepfake_score, deepfake_flagged, virus_scan_status
)
SELECT
    c.complaint_id,
    'evidence_' || c.rn || '.jpg',
    'SCREENSHOT',
    'image/jpeg',
    350000 + (c.rn * 1024),
    MD5(c.complaint_id::TEXT) || MD5(c.victim_id::TEXT),
    'cybershield-evidence/' || c.complaint_id || '/primary',
    c.submitted_at + INTERVAL '3 minutes',
    ('10.0.' || (c.rn % 10) || '.' || (c.rn % 200))::inet,
    'Android Device',
    'Android 14',
    19.00000000 + (c.rn * 0.001),
    72.00000000 + (c.rn * 0.001),
    c.incident_datetime,
    'MobileCam v3',
    FALSE,
    0.1200,
    FALSE,
    'CLEAN'
FROM ranked_complaints c
WHERE c.rn <= 25;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO cfcfrms_requests (complaint_id, transaction_reference, amount, beneficiary_bank_ifsc, beneficiary_account, hop_number, cfcfrms_status, amount_frozen, freeze_confirmed_at, request_sent_at, time_since_fraud_seconds)
SELECT
    c.complaint_id,
    c.transaction_reference,
    COALESCE(c.financial_loss_amount, 1000),
    'HDFC0001234',
    'XXXXXX' || RIGHT(COALESCE(c.transaction_reference, '000000'), 4),
    1,
    CASE WHEN c.rn % 3 = 0 THEN 'FROZEN' ELSE 'PENDING' END,
    CASE WHEN c.rn % 3 = 0 THEN COALESCE(c.financial_loss_amount, 1000) * 0.75 ELSE NULL END,
    CASE WHEN c.rn % 3 = 0 THEN NOW() - INTERVAL '1 day' ELSE NULL END,
    c.submitted_at + INTERVAL '5 minutes',
    1200 + (c.rn * 30)
FROM ranked_complaints c
WHERE c.transaction_reference IS NOT NULL;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO safety_guidance_delivery (complaint_id, step_code, urgency, delivered_at, acknowledged_at)
SELECT
    c.complaint_id,
    CASE WHEN c.rn % 2 = 0 THEN 'CALL_BANK' ELSE 'BLOCK_NUMBER' END,
    CASE WHEN c.priority_score >= 80 THEN 'IMMEDIATE' ELSE 'TODAY' END,
    c.submitted_at + INTERVAL '10 minutes',
    CASE WHEN c.rn % 4 = 0 THEN c.submitted_at + INTERVAL '1 hour' ELSE NULL END
FROM ranked_complaints c;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO fir_drafts (
    complaint_id, generated_by_model, complainant_name, complainant_address, incident_description,
    bns_sections, it_act_sections, accused_details_json, approval_status, approving_officer_id
)
SELECT
    c.complaint_id,
    'fir-gen-v1',
    COALESCE(ci.full_name, 'Victim'),
    c.state_code || '-' || c.district_code,
    c.raw_description,
    'BNS-318, BNS-319',
    'IT-66C, IT-66D',
    jsonb_build_array(jsonb_build_object('upi_id', c.upi_id_fraudster, 'tx_ref', c.transaction_reference)),
    CASE WHEN c.rn % 2 = 0 THEN 'APPROVED' ELSE 'PENDING' END,
    c.assigned_officer_id
FROM ranked_complaints c
JOIN citizens ci ON ci.citizen_id = c.victim_id
WHERE c.rn <= 15;

WITH ranked_complaints AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.submitted_at, c.complaint_id) AS rn
    FROM complaints c
)
INSERT INTO case_lifecycle (complaint_id, fir_number, investigating_officer_id, chargesheet_filed_at, court_name, next_court_date, verdict, sentence_description, amount_ordered_restored, amount_actually_restored)
SELECT
    c.complaint_id,
    COALESCE(c.fir_number, 'FIR/2026/' || LPAD(c.rn::TEXT, 5, '0')),
    c.assigned_officer_id,
    CASE WHEN c.rn % 3 = 0 THEN NOW() - INTERVAL '7 days' ELSE NULL END,
    'Cyber Court - ' || c.state_code,
    CURRENT_DATE + (((c.rn % 30) + 1)::int),
    CASE WHEN c.rn % 5 = 0 THEN 'CONVICTED' ELSE 'PENDING' END,
    CASE WHEN c.rn % 5 = 0 THEN '2 years imprisonment + fine' ELSE NULL END,
    COALESCE(c.financial_loss_amount, 0) * 0.80,
    COALESCE(c.financial_loss_amount, 0) * 0.30
FROM ranked_complaints c
WHERE c.rn <= 20;

INSERT INTO dis_anomaly_events (node_hostname, pod_name, isolation_forest_score, autoencoder_score, ensemble_score, metric_snapshot_json, response_action, response_executed_at)
SELECT
    'node-' || ((gs % 4) + 1),
    'cybershield-api-' || gs,
    ROUND((0.40 + ((gs % 30) * 0.01))::numeric, 6),
    ROUND((0.35 + ((gs % 25) * 0.01))::numeric, 6),
    ROUND((0.45 + ((gs % 35) * 0.01))::numeric, 6),
    jsonb_build_object('cpu', 40 + gs, 'memory', 55 + gs, 'latency_ms', 90 + gs),
    CASE WHEN gs % 6 = 0 THEN 'POD_RESTARTED' WHEN gs % 4 = 0 THEN 'POD_ISOLATED' ELSE 'NONE' END,
    CASE WHEN gs % 4 = 0 THEN NOW() - (gs || ' minutes')::interval ELSE NULL END
FROM generate_series(1, 20) gs;
