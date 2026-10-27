# ShopifyCore Engine (Apex Commerce)
> **Reverse-Engineered Shopify Core Architecture** built using clean-room principles.

A modular, self-hostable e-commerce platform that implements the core foundational mechanics of **Shopify**:

- 🧬 **Cartesian Option-Variant Matrix Engine**: Full multi-axis product options (`Size`, `Color`, `Material`) generating discrete variant nodes with autonomous SKUs, inventory counts, and price levels.
- ⚡ **Optimistic Cart & Sub-second Inventory Lock**: Persistent client state with instant free-shipping calculations, promo code validations (`WELCOME20`, `SAVE50`, `FREESHIP`), and atomic inventory decrement upon order placement.
- 🛒 **Shopify 1-Page / Split-Screen Checkout**: Complete high-conversion checkout experience featuring Express Wallets (Shop Pay, Apple Pay, Google Pay mocks), shipping rate calculators, and simulated payment gateway.
- 🎛️ **Merchant Admin Portal (Polaris UI)**: High-density merchant control center with live KPI metrics (Sales, Orders, AOV, Conversion), order fulfillment queue with tracking number dispatch, automated variant matrix builder, and customer CRM.
- 🔌 **Shopify REST & Storefront API Simulator**: Interactive developer sandbox delivering exact schema parity with Shopify's public Admin APIs (`/admin/api/2024-01/...`).
- ⚡ **Direct React & dist.zip Hosting Engine (Vercel Architecture)**: Zero-config edge deployment engine for React single-page applications and headless storefronts. Upload or drop a `dist.zip` file directly to have it unpacked, routed (`/* -> index.html`), and hosted with sub-resource asset mapping (`/hosted/:id/assets/...`). Also supports sub-millisecond JSX compilation via `esbuild`, live multi-file studio with hot reload, sandbox previews, and custom domain management.

---

## Architecture Overview

```
shopify-engine/
├── index.html                   # HTML entry point with Polaris font & favicon
├── package.json                 # Dependencies (React 19, Tailwind v4, Lucide)
├── vite.config.js               # Fast Vite compiler setup
├── src/
│   ├── main.jsx                 # Application bootstrapping
│   ├── App.jsx                  # Main router (Storefront, Checkout, Admin, API)
│   ├── index.css                # Tailwind v4 & Polaris utility styles
│   ├── context/
│   │   └── StoreContext.jsx     # Reactive store engine, inventory lock & cart machine
│   ├── data/
│   │   └── seedData.js          # Catalog, variants, orders, customers & settings
│   └── components/
│       ├── Navigation.jsx       # Header, mode switcher (Storefront/Admin/API), cart trigger
│       ├── storefront/
│       │   ├── HeroBanner.jsx   # Dynamic hero showcase
│       │   ├── ProductGrid.jsx  # Collection tabs, keyword search, sorting
│       │   ├── ProductCard.jsx  # Item card with badges & quick selection
│       │   ├── ProductDetailModal.jsx # Full PDP with variant matrix resolver
│       │   ├── CartDrawer.jsx   # Slide-out drawer with free shipping progress meter
│       │   ├── CheckoutPage.jsx # Shopify 1-page checkout
│       │   └── OrderConfirmationModal.jsx # Celebration confetti & order timeline
│       ├── admin/
│       │   ├── AdminLayout.jsx  # Polaris sidebar layout
│       │   ├── DashboardView.jsx # KPI tiles, sales breakdown, recent orders
│       │   ├── ProductsView.jsx # Catalog management & inventory levels
│       │   ├── ProductFormModal.jsx # Automated variant matrix generator
│       │   ├── OrdersView.jsx   # Fulfillment queue & tracking generator
│       │   ├── CustomersView.jsx # Lifetime value (LTV) customer directory
│       │   ├── DiscountsView.jsx # Promotional rules engine
│       │   └── SettingsView.jsx # Shop configuration & factory reset
│       └── api/
│           └── ApiExplorer.jsx  # Live Shopify REST/GraphQL schema playground
```

---

## Quick Start

### 1. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

### 2. Build for Production
```bash
npm run build
```

### 3. Test Promo Codes in Checkout
- `WELCOME20`: 20% off total order
- `FREESHIP`: Free express courier shipping
- `SAVE50`: $50 off orders over $150
