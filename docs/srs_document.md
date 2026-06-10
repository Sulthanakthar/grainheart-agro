# Software Requirements Specification (SRS)
## Project: Healthy Grains, Happy Families
### Enterprise Pulses & Wheat Wholesale/Retail Dealership Platform
### Version: 1.0

---

## 1. Executive Summary & Vision

"Healthy Grains, Happy Families" is a wholesale and retail pulses and wheat dealership business. This platform acts as a unified digital ecosystem designed to optimize daily trading operations, facilitate dealer recruitment, manage customer relationships, automate order processing, track inventory, and secure Cash and Bank Cheque transactions. 

The application utilizes a single unified MySQL database for high-performance indexing, transactional integrity, and data safety, eliminating multi-database complexity while satisfying premium UI/UX, mobile-first design, and international security standards.

---

## 2. Stakeholder & Business Analysis

### 2.1 Target Audience
- **Families (Retail Customers)**: Seek high-quality pulses/wheat (Sortex/High Sortex) at competitive pricing.
- **Wholesale Buyers (Grocery Stores, Restaurants, Distributors)**: Purchase in bulk, requiring wholesale pricing, volume discounts, invoice generation, and custom quote approvals.
- **Dealers**: Authorized local representatives who receive territory assignments and earn commissions (2% to 5%) on sales.

### 2.2 Product Quality Tiers
The business maintains strict grain quality categories which dictate pricing:
1. **High Sortex (Grade Level: Premium, Priority 1)**: Export quality, advanced electronic color-sorted sorting, 100% purity, zero impurities.
2. **Sortex (Grade Level: Standard Premium, Priority 2)**: High-quality sorted grains, standard daily family consumption.
3. **Fine Quality (Grade Level: Economy, Priority 3)**: Budget-friendly pricing, clean, reliable machine-cleaned quality.

---

## 3. User Roles & RBAC Permission Matrix

The platform implements a strict hierarchical Role-Based Access Control (RBAC) policy.

```
          [Administrator]
                 │
         [Sales Executive]
                 │
        [Inventory Manager]
                 │
              [Dealer]
                 │
             [Customer]
                 │
              [Guest]
```

### 3.1 Permission Matrix

| Feature Module | Guest | Customer | Dealer | Inventory Manager | Sales Executive | Administrator |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse / Search Products** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Cart & Checkout** | - | ✓ (Retail) | ✓ (Wholesale) | - | - | ✓ |
| **Submit Enquiry / CRM** | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| **View Dealer Dashboard** | - | - | ✓ | - | - | ✓ |
| **Manage Inventory & Stock**| - | - | - | ✓ | - | ✓ |
| **Assign Leads & CRM Status**| - | - | - | - | ✓ | ✓ |
| **User & Dealer Onboarding** | - | - | - | - | - | ✓ |
| **System Settings & Backups**| - | - | - | - | - | ✓ |

---

## 4. Business Workflows & Lifecycle States

### 4.1 Retail Order Workflow
1. **Browse Catalogue**: Customer filters products by Category (Toor Dal, Chana Dal, etc.) and Quality Grade.
2. **Shopping Cart**: Add selected grains with quantity validation (based on available stock).
3. **Checkout**: Enters delivery address and selects payment method (**Cash** or **Bank Cheque** details).
4. **Order Creation**: Generates order tracking code, reserves stock in inventory.
5. **Invoice Generation**: Renders dynamic downloadable PDF invoice.
6. **Order Tracking**: Updates from *Pending* -> *Confirmed* -> *Packed* -> *Ready For Dispatch* -> *Dispatched* -> *Out For Delivery* -> *Delivered*.

### 4.2 Wholesale Order Workflow
1. **Bulk Selection**: Dealer or Wholesale Buyer adds bulk quantities (metric tons/bags) to a quote cart.
2. **Quotation Request**: Customer submits a bulk order inquiry.
3. **Negotiation Pipeline**: Sales Executive receives quotation request, updates CRM lead, assigns territory dealer, inputs negotiated price.
4. **Approval & Invoice**: Customer approves the final quote, order is created, invoice is generated.
5. **Dispatch & Delivery**: Inventory manager verifies stock release, status tracks dispatch.

### 4.3 Order Status Workflow
An order transitions through the following lifecycle status values:
- `Pending`, `Confirmed`, `Packed`, `Ready For Dispatch`, `Dispatched`, `Out For Delivery`, `Delivered`, `Cancelled`.

### 4.4 Payment Status Workflow
The transaction verification pipeline runs as follows:
- `Pending`, `Received`, `Verification Pending`, `Verified`, `Completed`, `Rejected`.

### 4.5 Cash & Cheque Specific Workflows
- **Cash**: Handed to delivery, verified by corporate accountant, completed.
- **Cheque**: Logged, collected, verification pending, bank clearance verified, completed.

### 4.6 Dealer Onboarding & Approval Workflow
- Registration details, document uploads, admin review, activation, territory mapping.

### 4.7 Customer Enquiry & CRM Lead Workflow
- Enquiries submitted, leads logged, assigned, follow-ups scheduled, priority auto-scaled, status progresses, notifications dispatched.

### 4.8 Business Intelligence & Executive Decision Workflow
- Data aggregated, KPI parameters cached, real-time widget rendering, export downloads (PDF, Excel, CSV) generated and scheduled.

### 4.9 Optimization, Security & Compliance Workflow
To secure the business and enhance discoverability, the system executes audit and protection layers:
1. **SEO Optimization Loop**: System compiles schemas and pages with descriptive meta tags (Title, Description, Open Graph tags, Local Business JSON-LD) and updates `sitemap.xml` and `robots.txt` dynamic indices on database catalogue changes.
2. **Performance Aggregator**: Assets undergo code splitting, lazy loading, compression (Gzip/Brotli), WebP image conversion, Redis caching (Product/Category keys), and connection pooling to satisfy Core Web Vitals targets:
   - **Google PageSpeed Score**: $\ge 90$ (Mobile & Desktop).
   - **Largest Contentful Paint (LCP)**: $< 2.5$ seconds.
   - **First Input Delay (FID)**: $< 100$ ms.
   - **Cumulative Layout Shift (CLS)**: $< 0.1$.
3. **OWASP Security Filters**: Requests pass Nginx hardening blocks (TLS 1.3, CSP Headers, DDoS protection rules), rate limiters, file type validators, and the Django ORM firewall.
4. **Compliance Records**: Audit logs record all access details. Consent boxes handle cookie preferences, and automated data retention runs to clean outdated customer/lead listings safely in accordance with GDPR privacy policies.

---

## 5. Core Tables Schema (Single MySQL Database)

To maintain high performance and enforce absolute transactional integrity, the database relies on the following schema definitions:

### 5.1 `carts`
- `id` (bigint, PK, auto-increment)
- `customer_id` (bigint, FK to users)
- `total_amount` (decimal 12,2)
- `total_items` (int)
- `status` (varchar)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.2 `cart_items`
- `id` (bigint, PK, auto-increment)
- `cart_id` (bigint, FK to carts, cascade)
- `product_id` (bigint, FK to products)
- `quantity` (int)
- `unit_price` (decimal 10,2)
- `total_price` (decimal 12,2)
- `created_at` (datetime)

### 5.3 `orders`
- `id` (bigint, PK, auto-increment)
- `customer_id` (bigint, FK to users)
- `order_number` (varchar, Unique)
- `order_type` (varchar)
- `subtotal` (decimal 12,2)
- `discount` (decimal 12,2)
- `tax_amount` (decimal 12,2)
- `total_amount` (decimal 12,2)
- `order_status` (varchar)
- `payment_status` (varchar)
- `delivery_address` (text)
- `notes` (text)
- `created_at` (datetime)
- `updated_at` (datetime)
- `created_by` (bigint, null)
- `updated_by` (bigint, null)
- `is_deleted` (boolean)
- `deleted_at` (datetime, null)

### 5.4 `order_items`
- `id` (bigint, PK, auto-increment)
- `order_id` (bigint, FK to orders, cascade)
- `product_id` (bigint, FK to products)
- `quantity` (int)
- `unit_price` (decimal 10,2)
- `total_price` (decimal 12,2)

### 5.5 `payments`
- `id` (bigint, PK, auto-increment)
- `order_id` (bigint, FK to orders, cascade)
- `payment_method` (varchar)
- `transaction_reference` (varchar)
- `amount` (decimal 12,2)
- `payment_status` (varchar)
- `verified_by` (bigint, FK to users, null)
- `payment_date` (datetime, null)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.6 `invoices`
- `id` (bigint, PK, auto-increment)
- `order_id` (bigint, FK to orders, unique)
- `invoice_number` (varchar, Unique)
- `invoice_date` (datetime)
- `invoice_total` (decimal 12,2)
- `generated_by` (bigint, FK to users, null)
- `created_at` (datetime)

### 5.7 `territories`
- `id` (bigint, PK, auto-increment)
- `territory_name` (varchar, Unique)
- `district` (varchar)
- `state` (varchar)
- `country` (varchar)
- `manager_name` (varchar)
- `status` (varchar)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.8 `dealers`
- `id` (bigint, PK, auto-increment)
- `user_id` (bigint, FK to users, unique)
- `dealer_code` (varchar, Unique)
- `business_name` (varchar)
- `owner_name` (varchar)
- `phone` (varchar)
- `email` (varchar)
- `gst_number` (varchar, Unique)
- `pan_number` (varchar, Unique)
- `territory_id` (bigint, FK to territories, null)
- `commission_rate` (decimal 4,2)
- `status` (varchar)
- `approval_date` (datetime, null)
- `created_at` (datetime)
- `updated_at` (datetime)
- `created_by` (bigint, null)
- `updated_by` (bigint, null)
- `is_deleted` (boolean)
- `deleted_at` (datetime, null)

### 5.9 `dealer_documents`
- `id` (bigint, PK, auto-increment)
- `dealer_id` (bigint, FK to dealers, cascade)
- `document_type` (varchar)
- `document_file` (varchar)
- `verification_status` (varchar)
- `uploaded_at` (datetime)

### 5.10 `commissions`
- `id` (bigint, PK, auto-increment)
- `dealer_id` (bigint, FK to dealers)
- `order_id` (bigint, FK to orders)
- `sales_amount` (decimal 12,2)
- `commission_percentage` (decimal 4,2)
- `commission_amount` (decimal 12,2)
- `payout_status` (varchar)
- `payout_date` (datetime, null)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.11 `dealer_performance`
- `id` (bigint, PK, auto-increment)
- `dealer_id` (bigint, FK to dealers, cascade)
- `month` (varchar)
- `total_orders` (int)
- `total_sales` (decimal 12,2)
- `total_customers` (int)
- `growth_percentage` (decimal 6,2)
- `updated_at` (datetime)

### 5.12 `enquiries`
- `id` (bigint, PK, auto-increment)
- `enquiry_number` (varchar, Unique)
- `customer_name` (varchar)
- `email` (varchar)
- `phone` (varchar)
- `enquiry_type` (varchar)
- `subject` (varchar)
- `message` (text)
- `source` (varchar)
- `status` (varchar)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.13 `leads`
- `id` (bigint, PK, auto-increment)
- `lead_number` (varchar, Unique)
- `enquiry_id` (bigint, FK to enquiries, unique)
- `assigned_to` (bigint, FK to users, null)
- `lead_status` (varchar)
- `priority` (varchar)
- `expected_revenue` (decimal 12,2)
- `conversion_probability` (decimal 5,2)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.14 `followups`
- `id` (bigint, PK, auto-increment)
- `lead_id` (bigint, FK to leads, cascade)
- `assigned_to` (bigint, FK to users)
- `followup_date` (datetime)
- `followup_type` (varchar)
- `notes` (text)
- `status` (varchar)
- `created_at` (datetime)

### 5.15 `customer_interactions`
- `id` (bigint, PK, auto-increment)
- `customer_id` (bigint, FK to users)
- `lead_id` (bigint, FK to leads, null)
- `interaction_type` (varchar)
- `description` (text)
- `interaction_date` (datetime)

### 5.16 `notifications`
- `id` (bigint, PK, auto-increment)
- `user_id` (bigint, FK to users, cascade)
- `title` (varchar)
- `message` (text)
- `notification_type` (varchar)
- `is_read` (boolean)
- `created_at` (datetime)

### 5.17 `reports`
- `id` (bigint, PK, auto-increment)
- `report_name` (varchar)
- `report_type` (varchar)
- `generated_by` (bigint, FK to users, null)
- `generated_at` (datetime)
- `file_path` (varchar)
- `created_at` (datetime)

### 5.18 `dashboard_configurations`
- `id` (bigint, PK, auto-increment)
- `dashboard_name` (varchar)
- `widget_name` (varchar)
- `position` (int)
- `visibility` (boolean)
- `updated_at` (datetime)

### 5.19 `kpi_trackers`
- `id` (bigint, PK, auto-increment)
- `metric_name` (varchar, Unique)
- `metric_value` (decimal 16,4)
- `calculated_at` (datetime)

### 5.20 `seo_metadata`
- `id` (bigint, PK, auto-increment)
- `path` (varchar, Unique) - e.g. /products/toor-dal-premium
- `meta_title` (varchar)
- `meta_description` (text)
- `meta_keywords` (varchar)
- `og_title` (varchar)
- `og_description` (text)
- `og_image` (varchar)
- `canonical_url` (varchar)
- `created_at` (datetime)
- `updated_at` (datetime)

### 5.21 `audit_logs`
- `id` (bigint, PK, auto-increment)
- `user_id` (bigint, FK to users, null)
- `action` (varchar) - e.g., view_financial_report, edit_dealer_commission
- `ip_address` (varchar)
- `user_agent` (text)
- `details` (text)
- `created_at` (datetime)

---

## 6. Non-Functional & Security Requirements

- **Performance**: High-speed indexing on search targets (`products.slug`, `orders.order_number`, `invoices.invoice_number`, `dealers.dealer_code`, `enquiries.enquiry_number`, `leads.lead_number`, `kpi_trackers.metric_name`, `seo_metadata.path`). Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1. Page load times under 2 seconds.
- **Security**: Double input sanitization, Django ORM protection, parameterization of query structures, strict password hashing, CSRF tokens, JWT token expiry, and XSS filtering. Uploaded files checked and sandboxed. Enforces TLS 1.3, SSL redirects, CSP headers, HSTS, and session security.
- **Compliance**: GDPR readiness, encrypted backups, access control lists (ACLs), explicit Cookie Consent, audit trails logging, and data purging.
- **Mobile First**: Fluid Tailwind grids resizing seamlessly from 320px screens up to 4K desktop screens.
- **SEO & Marketing**: Rich-snippet JSON-LD structured schema on product pages, descriptive meta-tags, sitemaps (`sitemap.xml`), and crawling rules (`robots.txt`).
- **Audit Trails**: Global abstract models injecting `created_at`, `updated_at`, `created_by`, and `updated_by` across all tables.
- **Data Recovery**: Soft delete flag (`is_deleted` and `deleted_at`) configured globally to safeguard against loss.

---

Approved by: ________________________ (Client Signature)
Date: 2026-06-10
