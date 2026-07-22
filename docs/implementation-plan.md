# Hair Salon Management System
## Implementation Plan & System Architecture

Prepared for: Single-location salon (small scale)
Scope: Online booking & scheduling, POS & payments, staff & inventory management, customer CRM & loyalty
Platform: Web application

---

## 1. Project Overview

This document defines the implementation plan and system architecture for a web-based hair salon management system covering four core modules: appointment booking, point-of-sale and payments, staff and inventory management, and customer relationship management with loyalty tracking. The system is scoped for a single salon location with room to add locations later without a rebuild.

### 1.1 Objectives

The system should let customers book appointments online without calling the salon, give staff a single dashboard to manage schedules and checkout, track product inventory and stylist commissions automatically, and build customer loyalty through visit history and rewards.

### 1.2 User Roles

| Role | Access |
|---|---|
| Customer | Book/cancel/reschedule appointments, view own history, loyalty balance, profile |
| Stylist | View own schedule, mark appointments complete, view assigned commissions |
| Receptionist | Manage all appointments, run checkout/POS, manage walk-ins |
| Salon Owner/Admin | Full access: staff, inventory, reports, pricing, promotions, system settings |

---

## 2. System Architecture

### 2.1 Architectural Style

A **modular monolith** is recommended over microservices. At single-salon scale, microservices add operational overhead (multiple deployments, service discovery, network latency) without a corresponding benefit — a single well-structured codebase with clearly separated modules is faster to build, easier to debug, and cheaper to run. The module boundaries (Booking, POS, Inventory/Staff, CRM) are still kept clean internally, so the system can be split into services later if the salon grows into a multi-location or multi-tenant product.

### 2.2 Layers

The diagram shared above shows five layers:

1. **Client layer** — Customer-facing web app (booking, profile, loyalty) and a separate Staff/Admin dashboard (calendar, POS, reports), both served from the same frontend codebase with role-based routing.
2. **Application layer** — A single API gateway (backend) handling all requests, plus a dedicated Auth & RBAC module issuing JWTs and enforcing role permissions on every route.
3. **Core service modules** — Four internal modules with their own logic and data boundaries: Booking & Scheduling, POS & Payments, Staff & Inventory, CRM & Loyalty. They share the same database but communicate through internal service calls, not direct table access across modules.
4. **Data layer** — PostgreSQL as the system of record; Redis for caching frequently-read data (e.g., service catalog, stylist availability) and for background job queues (reminders, receipt emails).
5. **External integrations** — Stripe for payment processing and in-person card payments (Stripe Terminal), Twilio for SMS reminders, SendGrid for transactional email, and S3-compatible object storage for images and receipts.

### 2.3 Recommended Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (React) + TypeScript, Tailwind CSS | Single codebase for customer and staff views, good SEO for the public booking page, large ecosystem |
| Backend | Node.js with NestJS (or Next.js API routes for a leaner build) | TypeScript end-to-end, structured module system that matches the architecture above |
| Database | PostgreSQL | Relational data (appointments, inventory, transactions) needs strong consistency and relational integrity |
| Cache / Queue | Redis + BullMQ | Appointment reminders and receipt emails as background jobs; caching availability lookups |
| Auth | JWT-based sessions with role-based access control (or Auth0/Clerk if outsourcing auth is preferred) | Simple to implement, salon has only 4 role types |
| Payments | Stripe (Payments + Terminal for in-store card readers) | PCI compliance handled by Stripe; supports both online deposits and in-salon checkout |
| Notifications | Twilio (SMS) + SendGrid (email) | Industry-standard, reliable delivery, good deliverability reputation |
| File storage | AWS S3 or equivalent | Stylist portfolio photos, digital receipts |
| Hosting | Managed PaaS (Render, Railway, or Fly.io) for app + managed Postgres (e.g., RDS or provider-managed) | Avoids managing servers at this scale; can migrate to AWS/GCP directly if the salon grows into a chain |
| CI/CD | GitHub Actions | Free tier is sufficient at this scale, deploys on merge to main |

### 2.4 Core Data Model (entities)

- **User** (id, role, name, email, phone, password_hash)
- **Customer** (user_id, preferences, allergies/notes, loyalty_points_balance)
- **Staff** (user_id, specialties, commission_rate, working_hours)
- **Service** (id, name, duration_minutes, price, category)
- **Appointment** (id, customer_id, staff_id, service_id[], start_time, end_time, status, source)
- **Transaction** (id, appointment_id, staff_id, line_items, subtotal, tip, tax, total, payment_method, status)
- **Product** (id, name, sku, stock_quantity, reorder_threshold, unit_cost, unit_price)
- **InventoryMovement** (id, product_id, quantity_delta, reason, timestamp)
- **LoyaltyTransaction** (id, customer_id, points_delta, reason, timestamp)
- **Notification** (id, recipient_id, channel, template, status, sent_at)

### 2.5 Non-Functional Requirements

Security is handled primarily by delegating card data to Stripe (no raw card numbers touch the system), enforcing RBAC on every API route, and encrypting data at rest and in transit. Availability targets a standard 99.5% for a single-location business — no need for multi-region redundancy at this scale, but daily automated database backups are required. Privacy requires customer data (contact info, visit history, notes) to be handled under applicable data protection rules (e.g., GDPR/CCPA depending on jurisdiction), with a clear data retention and deletion policy. The system should be designed so booking and checkout remain usable even under moderate load spikes (e.g., holiday booking rushes) without needing a redesign.

---

## 3. Implementation Plan

### Phase 0 — Discovery & Requirements (1–2 weeks)
Stakeholder interviews with the salon owner and staff, finalize service catalog and pricing rules, define booking rules (buffer times, cancellation policy, deposit requirements), wireframe the booking flow and staff dashboard.

### Phase 1 — Foundation (2–3 weeks)
Set up repository, CI/CD pipeline, hosting environment, database schema and migrations, authentication and role-based access control, base UI shell for customer and staff views.

### Phase 2 — Booking & Scheduling Module (3–4 weeks)
Service catalog management, stylist calendar and availability logic, appointment booking flow with conflict prevention, cancellation/rescheduling, waitlist handling, automated SMS/email reminders.

### Phase 3 — POS & Payments Module (3 weeks)
Checkout flow, invoice/receipt generation, Stripe integration (card-present and online), tipping, split payments, refunds, end-of-day reconciliation report.

### Phase 4 — Staff & Inventory Module (2–3 weeks)
Staff profiles and shift scheduling, commission calculation tied to completed transactions, product catalog, stock tracking with low-stock alerts, supplier/reorder notes.

### Phase 5 — CRM & Loyalty Module (2–3 weeks)
Customer profiles with visit and service history, preference/allergy notes, loyalty points accrual and redemption rules, promotional codes, targeted email/SMS campaigns.

### Phase 6 — Admin Dashboard & Reporting (2 weeks)
Revenue reports, staff performance and commission summaries, inventory reports, appointment volume analytics, exportable reports (CSV).

### Phase 7 — Testing, QA & UAT (2 weeks)
End-to-end testing of booking and checkout flows, edge cases (double-booking, payment failures, refunds), load testing for peak booking periods, user acceptance testing with actual salon staff.

### Phase 8 — Deployment & Staff Training (1 week)
Production deployment, data migration from any existing system (e.g., spreadsheet or legacy booking tool), staff training sessions, go-live support.

### Phase 9 — Post-Launch Support & Iteration (ongoing)
Bug fixes, monitoring, feature refinement based on real usage, monthly review of what's working.

**Estimated total timeline: 16–20 weeks** for a single-location build with the four modules above, assuming a small team.

### Suggested Team

One project manager/product owner (part-time), one to two full-stack developers, one UI/UX designer (part-time, front-loaded in Phases 0–1), one QA resource (part-time, front-loaded in Phase 7).

---

## 4. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Double-booking a stylist | Enforce booking conflicts at the database level (unique constraint / transaction lock), not just in the UI |
| Payment/PCI compliance burden | Use Stripe for all card handling; never store card numbers |
| Staff resistance to new system | Involve staff in Phase 0 requirements and Phase 7 UAT; keep the checkout flow as fast or faster than their current process |
| Inventory data going stale | Tie inventory deductions directly to completed transactions rather than relying on manual updates |
| No-shows / late cancellations | Configurable deposit or cancellation-fee rules in the booking module |

---

## 5. Future Extensions (post-MVP)

Multi-location support (the module boundaries above are designed to make this additive, not a rewrite), a native mobile app once the web booking flow is validated, online gift cards and package/membership sales, and a stylist-facing mobile view for schedules and commissions on the go.
