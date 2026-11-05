# MAISON — Premium Luxury Fashion E-Commerce Platform

> *"Where Elegance Meets Everyday Luxury."*

MAISON is a modern luxury fashion shopping platform offering a sophisticated online shopping experience with an editorial aesthetic and a 100% Python-powered business logic backend.

---

## 1. Architectural Highlights

- **80% Python Core Engine**: The entire business logic, order life-cycle, stock mutations, multi-step checkout verification, and financial calculations are written in Python 3.
- **Strict Decimal Financial Integrity**: All product prices, cart item sums, promotional discounts, shipping thresholds, and tax levies are calculated server-side using Python's `decimal.Decimal` module (`ROUND_HALF_UP`) to prevent floating-point inaccuracies.
- **Relational SQLite/ORM Architecture**: Robust schema with foreign keys, cascading deletions, indexing, and transactional guarantees across Users, Addresses, Products, ProductVariants, Categories, Carts, Orders, Coupons, and Reviews.
- **Zero-Pill Luxury Editorial Design**: Adheres strictly to high-end design constitutions—typographic hierarchy with *Cormorant Garamond* display serif and *Plus Jakarta Sans*, unboxed metadata with subtle typographic separators (`·`), measured scrims for WCAG AA 4.5:1 contrast, and single-elevation cards.
- **Multi-Step Checkout & Sandbox Payment**: 5-step checkout flow with customer verification, address validation, order review, payment sandbox (Stripe Sandbox, Cash on Delivery, Regional Gateway), and downloadable official luxury invoices.
- **Directorate Admin Console**: Real-time KPI summaries (revenue, orders, active customers, catalog count), inventory low-stock alerts, order status transitions (`Pending` $\to$ `Confirmed` $\to$ `Processing` $\to$ `Shipped` $\to$ `Delivered` $\to$ `Cancelled`), and coupon management.

---

## 2. Directory Structure

```text
maison/
├── app/
│   ├── auth/           # Registration, PBKDF2 hashing, login, addresses
│   ├── admin/          # Admin KPIs, product CRUD, order status, inventory
│   ├── products/       # Catalog filtering, faceted search, detail views
│   ├── cart/           # Persistent cart, stock verification, Decimal pricing
│   ├── wishlist/       # Saved curations and quick bag transfer
│   ├── checkout/       # Multi-step checkout & atomic stock deduction
│   ├── orders/         # Order history, tracking, returns, invoice printing
│   ├── reviews/        # Verified patron reviews & rating calculations
│   ├── newsletter/     # Private preview subscriptions
│   ├── models/         # SQLite database schema, seeding, migrations
│   └── services/       # Decimal pricing engine, HTML/PDF invoice, transactional emails
├── instance/           # SQLite database storage (maison.db)
├── run.py              # Python HTTP REST server entrypoint (port 5001)
tests/
└── test_maison.py      # Automated Python unit test suite
src/
├── components/         # React luxury UI components (Header, Hero, ProductGrid, etc.)
├── services/api.ts     # Frontend API client communicating with Python backend
├── types/              # Comprehensive TypeScript domain interfaces
└── App.tsx             # Main client application orchestration
server.ts               # Full-stack orchestrator: spawns Python backend and proxies /api/*
requirements.txt        # Python package definitions
config.py               # Application configuration
```

---

## 3. Demo Accounts & Credentials

The platform is pre-seeded with demo patrons for immediate exploration:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Atelier Admin** | `admin@maison.luxury` | `MaisonAdmin2026!` | Full Directorate Admin Console, Order fulfillment, Inventory adjustments, Coupon creation |
| **Private Patron** | `client@maison.luxury` | `MaisonClient2026!` | Order history, tracking, invoice download, cancellations, address book |

### Promotional Codes
- `MAISON10`: 10% off orders over $300 (capped at $300)
- `LUXURY20`: 20% off orders over $1,000 (capped at $500)
- `WELCOME50`: $50 fixed deduction on orders over $250

---

## 4. Local Installation & Development

### Prerequisites
- Python 3.10+
- Node.js 20+

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/maison-luxury/maison.git
   cd maison
   ```

2. Run Python Unit Tests:
   ```bash
   python3 -m unittest tests/test_maison.py
   ```

3. Install Node.js dependencies and start the full-stack server:
   ```bash
   npm install
   npm run dev
   ```

The application runs on `http://localhost:3000`. The Express server automatically boots the Python backend service on `http://127.0.0.1:5001` and seamlessly proxies all `/api/*` endpoints.
