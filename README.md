# CyberShield Nexus

An integrated cyber crime intelligence and predictive analytics platform for proactive fraud prevention.

---

## 0) Codebase Setup (Ready to Run)

### 0.1 Repository structure

```text
CyberShield/
├─ backend/               # FastAPI + SQLAlchemy + core API routes
├─ frontend/              # Next.js + Tailwind dashboard
├─ infra/db/init.sql      # PostGIS extension bootstrap
├─ ml/                    # ML training/scoring workspace
├─ scripts/dev-up.ps1     # Local helper script
├─ docker-compose.yml     # PostgreSQL/PostGIS service
└─ .env.example           # Shared environment template
```

### 0.2 Prerequisites
- Node.js 22+
- Python 3.11+ (or 3.12 recommended)
- Docker Desktop

### 0.3 One-time configuration
1. Copy `.env.example` to `.env` in project root.
2. Copy `backend/.env.example` to `backend/.env`.
3. Copy `frontend/.env.local.example` to `frontend/.env.local`.
4. Update JWT secret and DB credentials for your machine.

### 0.4 Start local development

#### Start database
```powershell
docker compose up -d db
```

#### Start backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Start frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```

### 0.5 Verify setup
- Backend health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`

### 0.6 Seed and auth behavior (initial scaffold)
- `POST /api/v1/auth/login` accepts any email with password `admin123`.
- Risk and alert routes return starter mock data.
- Incident create/list routes persist to PostgreSQL.

### 0.7 VS Code task support
- `DB: Start Postgres`
- `Backend: Install`
- `Backend: Dev`
- `Frontend: Install`
- `Frontend: Dev`

---

## 1) Vision and Objectives

CyberShield Nexus helps law enforcement, banks, and civic authorities move from reactive investigation to proactive prevention.

### Primary objectives
- Build a centralized cyber crime intelligence data platform.
- Detect fraud patterns and high-risk clusters.
- Forecast scam trends and generate risk scores.
- Visualize risks through maps, charts, and alert dashboards.

### Core outcomes
- Area-wise cyber risk scoring
- Fraud pattern detection
- Scam trend forecasting
- Financial loss analytics
- Citizen awareness alerts

---

## 2) Implementation Architecture (What to Build)

### 2.1 Layered architecture

1. **Presentation Layer**
	- Web dashboard (admin, analyst, banking, citizen views)
	- Heatmaps, charts, and alert feed

2. **Application Layer**
	- REST API service
	- AuthN/AuthZ (JWT + RBAC)
	- Incident and alert management services

3. **Analytics Layer**
	- Data cleaning/feature engineering pipeline
	- ML training and batch/near-real-time scoring
	- Rule-based anomaly checks

4. **Data Layer**
	- PostgreSQL + PostGIS (transactional + geospatial)
	- Model artifacts storage
	- Audit and logs storage

### 2.2 High-level flow

```text
User -> Web App -> API Gateway/Backend -> PostgreSQL/PostGIS
												 -> Analytics & ML Engine
												 -> Risk Scores/Alerts -> Dashboard
```

### 2.3 Suggested deployment topology

- **Frontend**: Next.js on Vercel or Azure App Service
- **Backend API**: FastAPI or Node.js/Express on container app or VM
- **DB**: Managed PostgreSQL with PostGIS
- **ML jobs**: Python worker (scheduled via cron/Celery/GitHub Actions/Airflow)
- **Monitoring**: centralized logs + metrics + error tracking

---

## 3) System Design Blueprint (How to Design)

### 3.1 Functional modules

1. **Ingestion Module**
	- Inputs: complaint portals, police records, bank reports, manual admin forms
	- Validates schema and stores raw records

2. **Data Quality Module**
	- Deduplication
	- Missing-value handling
	- Category normalization (crime type, platform, region)
	- Geocoding to latitude/longitude

3. **Analytics Module**
	- Trend analysis (daily/weekly/monthly)
	- Crime type distribution
	- Regional clustering and impact analysis

4. **Prediction Module**
	- Risk score calculation by locality and time window
	- High-risk zone prediction
	- Scam trend forecasting
	- Suspicious cluster detection

5. **Alert Module**
	- Threshold-based alerts (e.g., spike in phishing in one zone)
	- Role-targeted notifications (agency/bank/citizen)

6. **Visualization Module**
	- Heatmaps
	- Risk panels
	- Trend and distribution charts
	- Incident drill-down and filters

7. **Security & Admin Module**
	- JWT auth
	- Role-based permissions
	- Audit logs and secure endpoints

---

## 4) End-to-End Workflow Guide

### Stage A: Data onboarding
1. Receive incident data from source APIs/CSV/forms.
2. Validate mandatory fields:
	- complaint_id, crime_type, timestamp, location, loss_amount
3. Save raw data (`incidents_raw`) with source metadata.

### Stage B: Processing and cleaning
1. Remove duplicate complaints (hash + complaint_id + time threshold).
2. Normalize crime categories and platform values.
3. Geocode district/area to lat/lon.
4. Impute or mark missing fields.
5. Save clean records (`incidents_clean`).

### Stage C: Analytics
1. Aggregate counts by location, crime type, and time window.
2. Compute loss statistics (sum, avg, outliers).
3. Detect unusual spikes using baseline windows.

### Stage D: Prediction and scoring
1. Generate model features from clean data.
2. Run trained models for risk prediction and trend forecast.
3. Produce `risk_score` per area (0–100).
4. Store model output (`risk_scores`, `forecasts`, `clusters`).

### Stage E: Visualization and alerts
1. Dashboard fetches latest analytics and scores.
2. Render heatmap and charts.
3. Trigger alerts if threshold crossed.
4. Persist alert events and acknowledgment status.

---

## 5) Data Model (Core Tables)

### `incidents_raw`
- id (PK)
- source_type
- payload_json
- ingested_at

### `incidents_clean`
- id (PK)
- complaint_id (unique)
- crime_type
- victim_area
- district
- state
- latitude
- longitude
- reported_at
- platform_used
- loss_amount
- severity_level

### `risk_scores`
- id (PK)
- area_code
- score (0–100)
- risk_level (low/medium/high/critical)
- factors_json
- computed_at

### `alerts`
- id (PK)
- alert_type
- area_code
- severity
- message
- status (open/acknowledged/closed)
- created_at

### `users`
- id (PK)
- name
- email
- password_hash
- role (admin/analyst/bank/citizen)
- created_at

### `model_registry`
- id (PK)
- model_name
- model_version
- metrics_json
- artifact_path
- trained_at

---

## 6) API Design (Initial Contracts)

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

### Incidents
- `POST /api/v1/incidents` (admin/system ingest)
- `GET /api/v1/incidents` (filtered list)
- `GET /api/v1/incidents/:id`

### Analytics
- `GET /api/v1/analytics/trends?from=&to=&crime_type=&area=`
- `GET /api/v1/analytics/loss-summary?from=&to=`
- `GET /api/v1/analytics/distribution?group_by=crime_type|platform|district`

### Risk & Forecast
- `GET /api/v1/risk/areas?date=`
- `GET /api/v1/risk/area/:areaCode`
- `GET /api/v1/forecast/scams?horizon=7d|30d`

### Alerts
- `GET /api/v1/alerts`
- `POST /api/v1/alerts/:id/ack`

---

## 7) ML Design

### 7.1 Use-cases and models
- **Risk classification**: Logistic Regression / Random Forest
- **Hotspot grouping**: K-Means (geo + frequency + severity)
- **Trend forecasting**: Time-series model (rolling baseline or ARIMA-like approach)

### 7.2 Feature examples
- Incident density in last 7/30 days
- Fraud type concentration
- Average loss amount
- Repeat-offender/repeat-pattern indicators
- Time-of-day and day-of-week frequencies

### 7.3 Model lifecycle
1. Extract clean training dataset
2. Train and validate model
3. Store metrics + artifact in registry
4. Deploy latest approved version
5. Run scheduled scoring job
6. Monitor drift and retrain periodically

---

## 8) Security and Compliance Design

- JWT-based authentication
- Role-based authorization middleware
- HTTPS everywhere
- Input validation + rate limiting
- Parameterized queries to prevent SQL injection
- PII minimization and access control
- Audit logs for critical operations

---

## 9) Two-Member Development Workflow

### Member 1: Backend + ML Engineer
- Design schema and PostGIS queries
- Build ingestion, processing, analytics, risk APIs
- Implement ML training/scoring pipeline
- Add auth, RBAC, and audit logging

### Member 2: Frontend + Visualization Engineer
- Build Next.js dashboard UI and role-based views
- Integrate map heatmap and chart widgets
- Implement login, filters, and alert center
- Optimize responsiveness and UX consistency

### Shared milestones
1. Finalize API contracts and DB schema
2. Integrate frontend with live backend data
3. Validate risk score accuracy and dashboard correctness
4. Conduct end-to-end testing and deployment

---

## 10) Suggested Implementation Roadmap

### Phase 1 (Week 1–2): Foundation
- Initialize repos, CI, coding standards
- Auth + RBAC + base DB schema
- Incident ingestion API + admin upload

### Phase 2 (Week 3–4): Core analytics
- Cleaning pipeline + feature generation
- Trend/loss analytics endpoints
- Initial dashboard charts and filters

### Phase 3 (Week 5–6): Prediction and geospatial
- Risk scoring engine + model registry
- Hotspot clustering + forecast endpoints
- Heatmap + risk panels + alert rules

### Phase 4 (Week 7): Hardening
- Security tests, performance tuning, bug fixes
- Monitoring dashboards + logs
- Documentation and presentation preparation

---

## 11) Non-Functional Requirements

- **Scalability**: handle increasing incident volume by partitioning and indexing
- **Performance**: analytics APIs should return dashboard views quickly
- **Reliability**: scheduled jobs with retries and failure alerts
- **Maintainability**: modular services and versioned APIs
- **Observability**: logs, metrics, tracing for key pipelines

---

## 12) MVP Scope (Recommended)

For the first release, implement only:
- User auth (admin + analyst roles)
- Incident ingestion + clean storage
- Area risk scoring (batch daily)
- Heatmap + trend chart + alerts list
- Basic forecast for 7-day scam trend

This keeps scope practical while still demonstrating intelligence and prevention value.

---

## 13) Future Enhancements

- Real-time stream ingestion (Kafka/Event Hub)
- Graph-based scam network analysis
- Citizen mobile app notifications
- NLP-based complaint text classification
- Multi-city benchmarking dashboard
