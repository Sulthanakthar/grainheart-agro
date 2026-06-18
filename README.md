# Grainheart Agro — "Healthy Grains, Happy Families"

### Enterprise Pulses & Wheat Dealership CRM & Order Management Platform

[![CI/CD Pipeline](https://github.com/Sulthanakthar/grainheart-agro/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Sulthanakthar/grainheart-agro/actions/workflows/ci-cd.yml)
[![Technology Stack](https://img.shields.io/badge/tech--stack-Django%20%7C%20React%20%7C%20MySQL-blue)](https://github.com/Sulthanakthar/grainheart-agro)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](https://github.com/Sulthanakthar/grainheart-agro)

Welcome to **Grainheart Agro** (formerly "Healthy Grains, Happy Families"), an enterprise-grade digital ecosystem designed for wholesale and retail pulses and wheat trading operations. 

The platform optimizes daily logistics, coordinates dealer networks, drives CRM follow-ups, automates invoice generation, and logs secure payment audits for Cash and Bank Cheque transactions. 

---

## 🌾 Platform Architecture & Tech Stack

The system is split into a modern decoupled architecture:

```
                  ┌────────────────────────────────────────┐
                  │          React + Vite Frontend         │
                  │   (TailwindCSS, Framer Motion, Lucide)  │
                  └───────────────────┬────────────────────┘
                                      │
                         REST API Requests (HTTPS)
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │             Django Backend             │
                  │     (REST Framework, SimpleJWT, Celery) │
                  └───────────┬───────────────┬────────────┘
                              │               │
                    SQL Queries               │ Task Queue
                              │               │
                              ▼               ▼
                  ┌───────────────┐       ┌───────────────┐
                  │ MySQL Database│       │  Redis Cache  │
                  └───────────────┘       └───────────────┘
```

### Backend (Python/Django)
- **Django 5.0+** & **Django REST Framework (DRF)** for robust RBAC-secured REST endpoints.
- **django-environ** for unified configuration injection.
- **PyMySQL & mysqlclient** dual-drivers to ensure compatibility on local development and cloud hosting servers.
- **Celery & Redis** for background batch reports, asynchronous reminders, and data pruning.
- **WhiteNoise** for high-performance static asset compression and caching directly from WSGI.

### Frontend (React/Vite)
- **React 19** with **Vite** for sub-second hot module reloading and optimized production builds.
- **TailwindCSS v4** for premium responsive typography, fluid grids, and sleek layouts.
- **Framer Motion** for subtle, interactive micro-animations.
- **Lucide React** for modern, crisp UI iconography.

---

## 🛠️ Folder Structure

```
grainheart-agro/
├── .github/workflows/      # GitHub Actions CI/CD automation pipelines
├── backend/                # Django REST API application source code
│   ├── accounts/           # Auth, user profiles, dealers & territories
│   ├── crm/                # Enquiries, leads, follow-ups, and notifications
│   ├── products/           # Catalogue, quality grades, and wishlists
│   ├── orders/             # Order logs, carts, and checkout validation
│   ├── payments/           # Cash & bank cheque transaction verification
│   ├── reports/            # Excel/PDF report generation tasks
│   └── grain_dealer/       # Main Django configuration & URL settings
├── frontend/               # React + Vite application source code
│   ├── src/
│   │   ├── components/     # UI elements (Navbar, Hero, WholesaleForm, etc.)
│   │   ├── assets/         # High-resolution optimized product graphics
│   │   └── App.jsx         # Primary application entrypoint
│   └── nginx.conf          # Frontend static routing & proxy configuration
├── docker/                 # Production-grade Dockerfiles for containers
└── docker-compose.yml      # Multi-container local execution setup
```

---

## 🚀 Local Installation & Quickstart

### Option 1: Multi-Container Setup via Docker Compose (Recommended)
Enables Django backend, React frontend, MySQL DB, Redis cache, and Celery worker instantly:
```bash
docker compose up --build
```
- Frontend: `http://localhost/`
- Backend API: `http://localhost:8000/`

---

### Option 2: Manual Installation

#### 1. Backend API Server Setup
1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   ```
2. Activate the virtual environment:
   - **Windows**: `.\.venv\Scripts\activate`
   - **macOS/Linux**: `source .venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and initialize settings:
   ```bash
   cp .env.example .env
   ```
5. Apply database migrations and start development server:
   ```bash
   python manage.py migrate
   python manage.py runserver 8001
   ```

#### 2. Frontend React Client Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
- Local URL: `http://localhost:5173/`

---

## 📊 Core Database Schema (MySQL Single Database)

The database schema guarantees strict integrity across business components:
- **accounts**: `users`, `dealers`, `territories`, `dealer_documents`
- **products**: `products`, `categories`, `quality_grades`, `wishlists`
- **orders**: `orders`, `order_items`, `carts`, `cart_items`
- **payments**: `payments`, `invoices`
- **crm**: `enquiries`, `leads`, `followups`, `customer_interactions`
- **analytics**: `reports`, `kpi_trackers`, `seo_metadata`, `audit_logs`

---

## 🌐 Production Deployment Flow

### 1. Backend (Hosted on Render)
- **Service Type**: Python Web Service.
- **Build Command**: `chmod +x build.sh && ./build.sh` (installs python packages, runs migrations, collects static files via WhiteNoise).
- **Start Command**: `gunicorn grain_dealer.wsgi:application`
- **Environment Variables**:
  - `DEBUG`: `False`
  - `SECRET_KEY`: *Your Secure Key*
  - `ALLOWED_HOSTS`: `grain-dealer-backend.onrender.com`
  - `DATABASE_URL`: `mysql://<user>:<password>@<host>:<port>/<db_name>` (e.g. from Clever Cloud MySQL)

### 2. Frontend (Hosted on Vercel)
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend.onrender.com`

---

## 🧪 Testing and Security Verification
Run the integrated Django test suite locally to verify code integrity:
```bash
cd backend
python manage.py test
```
All **55 unit tests** run across authentication, role-based view protections, CRM lifecycle progression, and financial calculations to ensure zero regressions.
