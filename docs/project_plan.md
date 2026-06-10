# Project Plan & Delivery Roadmap
## Project: Healthy Grains, Happy Families
### Execution Plan for Phases 1-10

---

## 1. Complete Phase Roadmap

The project is structured in 10 sequential delivery phases. Each phase is independently testable, deployable, and documented.

```
┌──────────────────────────────────────┐
│   Phase 1: Project Setup & Auth Core │  <-- CURRENT PHASE
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 2: Database Design & Models  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 3: Auth API & User Profiles  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 4: Product Catalogue API     │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 5: Orders & Payments Module  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 6: Dealer Management Module  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 7: CRM & Enquiry Pipeline    │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 8: Admin Dashboard & Reports │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 9: SEO & Security Hardening  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│   Phase 10: Testing, DevOps & Prod   │
└──────────────────────────────────────┘
```

---

## 2. Current Phase: Phase 1 Detailed Implementation Checklist

Here is the exact task breakdown for completing Phase 1 setup and architecture verification:

### 2.1 Backend Setup Tasks
- [ ] **Initialize `accounts` App**: Create the Django app to house users, roles, and profiles.
- [ ] **Define Custom User Model**: Prevent future database migration issues by subclassing `AbstractUser` as `User`.
- [ ] **Configure Django settings**:
  - Load environment values safely from `.env` via `django-environ`.
  - Enforce `AUTH_USER_MODEL = 'accounts.User'`.
  - Configure MySQL details in `DATABASES`.
- [ ] **Implement Logging System**:
  - Write errors and warnings to `logs/django.log`.
  - Output clean console logging for development tracking.
- [ ] **Setup Health Checks API**:
  - Implement `/api/health/` views querying MySQL connectivity and checking Redis connectivity.

### 2.2 Frontend Validation
- [ ] **Verify compilation**: Confirm Vite and Tailwind CSS build output compiles to static files without dependency errors.

### 2.3 Quality & Verification
- [ ] **System Checks**: Run Django system verification to verify configuration soundness.
- [ ] **Database Setup**: Execute initial migrations on the local MySQL database.
- [ ] **Sanity Tests**: Create integration tests ensuring the health check API behaves correctly.
- [ ] **Git Tracking**: Confirm untracked directories are correctly staged for future commits.

---

## 3. Elaborated Phase 5: Order & Payment Processing Specifications

Phase 5 will establish the order checkout and cash/cheque clearance engines.

### 3.1 Key Deliverables in Phase 5
1. **Shopping Cart APIs**:
   - `POST /api/v1/cart/create/`
   - `POST /api/v1/cart/add-item/`
   - `PUT /api/v1/cart/update-item/`
   - `DELETE /api/v1/cart/remove-item/`
   - `GET /api/v1/cart/`
2. **Order Core Views**:
   - `POST /api/v1/orders/create/`
   - `GET /api/v1/orders/`
   - `GET /api/v1/orders/{id}/`
   - `PUT /api/v1/orders/status/`
3. **Payment Management APIs**:
   - `POST /api/v1/payments/create/`
   - `POST /api/v1/payments/verify/`
   - `GET /api/v1/payments/`
4. **Invoice Engine & Downloads**:
   - `GET /api/v1/invoices/`
   - `GET /api/v1/invoices/{id}/`
   - `GET /api/v1/invoices/download/`

### 3.2 Security Controls Checklist
- [ ] **Authorization Validation**: Cart edits are strictly scoped to matching user tokens; order updates require Employee role.
- [ ] **Transaction Guarding**: Run checks inside a SQL isolation transaction block.
- [ ] **Fraud Protection**: Limit cheque submission counts and flag consecutive failed validations.

### 3.3 Test Plan Coverage
- **Unit Tests**: Check cart total logic, payment model transitions, and PDF generator outputs.
- **Integration Tests**: Simulate race conditions on checking out remaining inventory.

---

## 4. Elaborated Phase 6: Dealer Management Specifications

Phase 6 will establish the onboarding pipeline, commission calculations, and dashboards for Dealers.

### 4.1 Key Deliverables in Phase 6
1. **Dealer Onboarding APIs**:
   - `POST /api/v1/dealers/register/`
   - `GET /api/v1/dealers/`
   - `GET /api/v1/dealers/{id}/`
   - `PUT /api/v1/dealers/update/`
2. **Territory Routing APIs**:
   - `POST /api/v1/territories/`
   - `GET /api/v1/territories/`
   - `PUT /api/v1/territories/update/`
3. **Commission Ledger Engine**:
   - `GET /api/v1/commissions/`
   - `POST /api/v1/commissions/calculate/`
   - `GET /api/v1/commissions/report/`
4. **Dealer Dashboard Widget Endpoints**:
   - `GET /api/v1/dealer-analytics/`
   - `GET /api/v1/territory-analytics/`

### 4.2 Security Controls Checklist
- [ ] **Tax verification checks**: Format check on PAN & GST strings.
- [ ] **Document Sandboxing**: Uploaded document files are saved in secure locations with UUID file names and checked for dangerous file headers.
- [ ] **Access Guarding**: Non-admins cannot query registration parameters or other dealer commission records.

### 4.3 Test Plan Coverage
- **Unit Tests**: Test GST format validators, commission payout mathematics, and territory checks.
- **Integration Tests**: Simulate a full registration -> verification -> territory order payment -> commission record automation cycle.

---

## 5. Elaborated Phase 7: Customer Enquiry & CRM Specifications

Phase 7 will establish enquiry submission structures, CRM pipelines, follow-ups, and email/SMS/WhatsApp queues.

### 5.1 Key Deliverables in Phase 7
1. **Enquiry Management APIs**:
   - `POST /api/v1/enquiries/`
   - `GET /api/v1/enquiries/`
   - `GET /api/v1/enquiries/{id}/`
   - `PUT /api/v1/enquiries/update/`
2. **CRM Lead Pipeline APIs**:
   - `POST /api/v1/leads/`
   - `GET /api/v1/leads/`
   - `GET /api/v1/leads/{id}/`
   - `PUT /api/v1/leads/update/`
3. **Follow-Up Management APIs**:
   - `POST /api/v1/followups/`
   - `GET /api/v1/followups/`
   - `PUT /api/v1/followups/update/`
4. **Notification APIs**:
   - `GET /api/v1/notifications/`
   - `PUT /api/v1/notifications/read/`
5. **CRM Analytics Board**:
   - `GET /api/v1/crm-analytics/`
   - `GET /api/v1/conversion-report/` & `GET /api/v1/revenue-report/`

### 5.2 Security Controls Checklist
- [ ] **Lead Ownership Validation**: Prevent Sales Executives from viewing/editing leads assigned to other team members unless admin permissions are granted.
- [ ] **Rate Limiting on Enquiries**: Enforce a strict rate limit to protect against spam bots.
- [ ] **Notification Filtering**: Verify user identity matches notification target before marking alerts as read.

### 5.3 Test Plan Coverage
- **Unit Tests**: Verify lead priority auto-calculation based on enquiry types, test SMS service logs.
- **Integration Tests**: Verify lead conversion pipeline.

---

## 6. Elaborated Phase 8: Admin Dashboard & Reporting Specifications

Phase 8 will establish the business intelligence dashboards, KPI calculators, report schedulers, and exports formats.

### 6.1 Key Deliverables in Phase 8
1. **Dashboard UI Data APIs**:
   - `GET /api/v1/dashboard/executive/`
   - `GET /api/v1/dashboard/sales/`
   - `GET /api/v1/dashboard/inventory/`
   - `GET /api/v1/dashboard/dealers/`
   - `GET /api/v1/dashboard/crm/`
   - `GET /api/v1/dashboard/customers/`
2. **Report Generation APIs**:
   - `GET /api/v1/reports/`
   - `POST /api/v1/reports/generate/`
   - `GET /api/v1/reports/download/`
3. **Analytics Streams**:
   - `GET /api/v1/analytics/revenue/` & `GET /api/v1/analytics/orders/`
   - `GET /api/v1/analytics/inventory/`

### 6.2 Security Controls Checklist
- [ ] **Role-Based Report Access**: Access is restricted based on role.
- [ ] **Report link signing**: Generate temporary URLs for files containing secure validation hashes.
- [ ] **Resource limit safety checks**: Limit dates filters range to prevent query memory exhaustion.

### 6.3 Test Plan Coverage
- **Unit Tests**: Test Celery statistical aggregation logic, Excel workbook structural outputs.
- **Integration Tests**: Verify end-to-end report pipeline.

---

## 7. Elaborated Phase 9: SEO, Performance & Security Specifications

Phase 9 will configure critical performance caching, SSL terminations, Nginx security profiles, SEO JSON-LD injection templates, and audit configurations.

### 7.1 Key Deliverables in Phase 9
1. **Dynamic SEO APIs**:
   - `GET /api/v1/seo/metadata/` (Fetch path-based SEO title, description, open graph tags)
   - `/sitemap.xml` (Root sitemap indexing product and category resources dynamically)
   - `/robots.txt` (Search index directives restricting crawler access on `/admin/` and `/api/` endpoints)
2. **Django Settings hardening**:
   - Enable SSL cookies: `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`
   - Enforce HSTS headers: `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`
   - Map `SECURE_CONTENT_TYPE_NOSNIFF = True`, `SECURE_BROWSER_XSS_FILTER = True`
3. **Redis Caching Optimization**:
   - Configure cache templates for Catalog, Categories, and calculated KPI metrics.
   - Design signal-based eviction methods to maintain fresh data.
4. **Nginx Security Rules file**:
   - Implement rate limit directives, terminate TLS 1.3, configure Content Security Policy (CSP) configurations.
5. **GDPR Ready Controls & Consent**:
   - Design Cookie Consent pop-up hooks.
   - Configure audit logging model (`audit_logs`) tracking actions and actor credentials.

### 7.2 Security Controls Checklist
- [ ] **File upload validations**: Check MIME types and verify file extension signatures to block scripts execution.
- [ ] **SQL injection safeguards**: Audit Django ORM calls to ensure zero occurrences of custom raw queries strings.
- [ ] **Cross-Origin checks**: Confirm allowed CORS hosts match only authorized domains.

### 7.3 Test Plan Coverage
- **Performance Benchmarking**: Run Lighthouse scripts verifying PageSpeed index scores $\ge 90$ and check Core Web Vitals timings.
- **Vulnerability Checks**: Execute dependency checks (`pip audit` or equivalent) and check security settings configuration via `python manage.py check --deploy`.

---

## 8. Master Roadmap (Phases 2-10)

| Phase | Core Deliverable | Key Tech Elements |
| :--- | :--- | :--- |
| **Phase 2** | Database Models | Models, Migrations, Constraints, Indexing. |
| **Phase 3** | Authentication APIs | JWT, OTP over SMS/Email, Profiles, User registration. |
| **Phase 4** | Products Catalogue | Search & Filters (slugs, SKU), Review System, Wishlists. |
| **Phase 5** | Orders & Payment Processing | Cart, Cash & Cheque payment tracking, Invoice PDF export. |
| **Phase 6** | Dealer Dashboard | Territory Mapping, Commission ledger, Sales Analytics. |
| **Phase 7** | CRM Module | Enquiries tracker, Sales Exec allocation, Lead status flow. |
| **Phase 8** | Reporting Suite | Sales charts (PDF/Excel exports), Inventory low-stock alerts. |
| **Phase 9** | Security & SEO | HTTPS, Security Headers, Robots.txt, Sitemap.xml. |
| **Phase 10** | Deployment & DevOps | Docker containers, Nginx proxy, CI/CD, Production staging. |
