# Kirana Pro — Phase 1: Core Foundation Design Spec

## Overview

Phase 1 establishes the foundational architecture for Kirana Pro — a SaaS platform
for Indian kirana store owners. This phase delivers: authentication, store profile
setup, product catalog with barcode scanning, basic stock management, and the
signature Taraju (weighing scale) calculator.

**Target user:** Single kirana store owner with 1-3 staff ("chacha ki dukaan").
**Platforms:** React Native mobile app (iOS + Android) + Next.js desktop dashboard.
**Constraint:** Entirely free-tier services. Zero paid dependencies.

---

## 1. Tech Stack

| Layer              | Technology                        | Free Tier Limits                          |
|--------------------|-----------------------------------|-------------------------------------------|
| Mobile App         | React Native (Expo SDK 52+)       | Fully free, open source                   |
| Dashboard + API    | Next.js 15 (App Router)           | Free                                      |
| Database           | Firebase Firestore                | 1 GiB storage, 50k reads/day, 20k writes |
| Auth               | Firebase Auth                     | Google sign-in free, phone OTP 10k/month  |
| File Storage       | Firebase Storage                  | 5 GB, 1 GB/day downloads                  |
| Hosting (Web)      | Vercel                            | Free tier (100 GB bandwidth/month)        |
| Barcode Scanning   | expo-barcode-scanner              | Free, open source                         |
| State (Mobile)     | Zustand + AsyncStorage            | Free, open source                         |
| Navigation         | React Navigation 7                | Free, open source                         |
| UI Components      | React Native Paper (Material 3)   | Free, open source                         |

### Monorepo Structure

```
kirana-pro/
├── apps/
│   ├── mobile/          # React Native (Expo) app
│   │   ├── src/
│   │   │   ├── screens/       # Screen components
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── navigation/    # React Navigation setup
│   │   │   ├── store/         # Zustand state stores
│   │   │   ├── services/      # Firebase service wrappers
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── utils/         # Helpers (taraju calc, formatters)
│   │   │   ├── i18n/          # Internationalization setup
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── app.json
│   │   └── package.json
│   └── dashboard/       # Next.js desktop dashboard
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   ├── lib/           # Firebase config, utilities
│       │   └── types/         # Shared types
│       └── package.json
├── packages/
│   └── shared/          # Shared types, constants, validation
│       ├── src/
│       │   ├── types/         # Firestore document types
│       │   ├── constants/     # Unit conversions, categories
│       │   └── validation/    # Zod schemas
│       └── package.json
├── firebase.json        # Firebase project config
├── firestore.rules      # Security rules
├── turbo.json           # Turborepo config
└── package.json         # Root workspace
```

**Why Turborepo monorepo:** Shared types between mobile and dashboard prevent
drift. Single Firebase config. Shared validation schemas (Zod) ensure mobile
and dashboard enforce the same rules.

---

## 2. Authentication

### Flow

1. **Welcome Screen** → Two options: "Sign in with Google" / "Sign in with Phone"
2. **Google Sign-In:** Firebase Auth Google provider → redirect/popup → authenticated
3. **Phone OTP:** Enter phone number → Firebase sends OTP → verify → authenticated
4. **Post-Auth Gate:** If no store profile exists → redirect to Store Setup wizard
5. **Session:** Firebase Auth persists session. Auto-login on app reopen.

### Data Model

```typescript
// Firebase Auth provides: uid, email, phoneNumber, displayName, photoURL
// We store additional profile data in Firestore:

interface UserProfile {
  uid: string;                    // Firebase Auth UID (document ID)
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  authProvider: 'google' | 'phone';
  storeId: string | null;        // null until store is created
  role: 'owner' | 'staff';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security

- Firestore rules enforce: users can only read/write their own profile
- Store data is scoped by `storeId` — users can only access their store's data
- Staff accounts are invite-only (owner generates a code, staff joins with it)

---

## 3. Store Setup

After first login, the owner completes a one-time store setup wizard:

### Wizard Steps

1. **Store Name** — e.g., "Sharma General Store"
2. **Store Type** — Kirana / General Store / Medical / Dairy / Custom
3. **Address** — Street, city, state, pincode
4. **GST Number** (optional) — for GST invoice generation later
5. **Store Logo** (optional) — upload or skip

### Data Model

```typescript
interface Store {
  id: string;                     // Auto-generated document ID
  name: string;
  type: 'kirana' | 'general' | 'medical' | 'dairy' | 'other';
  customType?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  gstNumber: string | null;
  logoURL: string | null;
  ownerId: string;               // Firebase Auth UID
  staffIds: string[];             // UIDs of staff members
  settings: StoreSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface StoreSettings {
  currency: 'INR';               // Fixed for now
  weightUnit: 'kg' | 'g';        // Default display unit
  defaultTaxRate: number;         // e.g., 5, 12, 18 (GST slab)
  invoicePrefix: string;          // e.g., "INV-"
  invoiceCounter: number;         // Auto-incrementing
}
```

### Firestore Path

```
/stores/{storeId}
```

---

## 4. Product Catalog

### Features

- **Add product manually:** Name, category, price, unit, stock quantity, GST rate
- **Add via barcode scan:** Scan barcode → lookup in local DB or manual entry → save
- **Product categories:** Pre-defined (Atta/Flour, Dal/Pulses, Rice, Oil, Spices,
  Snacks, Beverages, Dairy, Personal Care, Cleaning, etc.) + custom categories
- **Units:** kg, g, liter, ml, piece, packet, dozen, box
- **Search & filter:** By name, category, barcode, low stock

### Data Model

```typescript
interface Product {
  id: string;                     // Auto-generated
  storeId: string;                // Parent store reference
  name: string;                   // e.g., "Toor Dal"
  nameHindi?: string;             // Hindi name for search
  category: string;               // Category ID or name
  barcode: string | null;         // Scanned barcode value
  
  // Pricing
  purchasePrice: number;          // Cost price (what you pay supplier)
  sellingPrice: number;           // MRP or selling price per unit
  gstRate: number;                // 0, 5, 12, 18, 28
  
  // Units & Measurement
  unit: 'kg' | 'g' | 'liter' | 'ml' | 'piece' | 'packet' | 'dozen' | 'box';
  isLoose: boolean;               // true for loose items (dal, rice, sugar)
  pricePerUnit: number;           // Price per base unit (₹/kg or ₹/liter)
  
  // Stock
  currentStock: number;           // Current quantity in store
  minStockAlert: number;          // Alert when stock falls below this
  
  // Metadata
  imageURL: string | null;
  isActive: boolean;              // Soft delete
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Path

```
/stores/{storeId}/products/{productId}
```

### Barcode Scanning Flow

1. Tap "Scan Barcode" button on Add Product screen
2. Camera opens with `expo-barcode-scanner`
3. On scan, search existing products for matching barcode
4. If found → show product details (already exists)
5. If not found → pre-fill barcode field, user enters remaining details
6. Save product with barcode attached

**Note:** We do NOT use any paid barcode-to-product lookup API. The store builds
its own barcode database over time. First scan = manual entry. Subsequent scans
of the same product = instant lookup.

---

## 5. Stock Management

### Features

- **Stock Dashboard:** Overview of total products, low stock alerts, out-of-stock items
- **Stock In:** Record new stock arrival (from supplier, quantity, date)
- **Stock Out:** Automatic on billing, manual adjustment for damage/expiry
- **Stock History:** Log of all stock movements with reason
- **Low Stock Alerts:** Push notification + badge when product falls below minimum

### Data Model

```typescript
interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  reason: 'purchase' | 'sale' | 'damage' | 'expiry' | 'return' | 'correction';
  quantity: number;               // Positive for in, negative for out
  previousStock: number;          // Stock before this movement
  newStock: number;               // Stock after this movement
  note: string | null;            // Optional note
  performedBy: string;            // User UID
  createdAt: Timestamp;
}
```

### Firestore Path

```
/stores/{storeId}/stockMovements/{movementId}
```

### Stock Update Strategy

Stock updates happen in two ways:
1. **Manual:** Owner adds stock via "Stock In" screen (e.g., received 50kg rice from supplier)
2. **Automatic:** When a bill is created, each line item's quantity is deducted from product stock

Both create a `StockMovement` document for audit trail. Product's `currentStock`
field is updated atomically using Firestore transactions to prevent race conditions.

---

## 6. Taraju Calculator (Signature Feature ⚖️)

### The Problem

A customer walks in and says "₹5 ka chawal de do" (give me ₹5 worth of rice).
The store owner needs to quickly calculate: if rice is ₹50/kg, then ₹5 = 100g.

### Feature Design

The Taraju screen is a dedicated, fast-access screen with:

1. **Product Selector:** Dropdown/search to pick a loose item (only shows `isLoose: true` products)
2. **Rate Display:** Shows "₹50 / kg" for the selected product
3. **Two Calculation Modes:**
   - **₹ → Weight:** Customer says amount → app shows weight to measure
     - Input: ₹5 → Output: "Measure **100g** on taraju"
   - **Weight → ₹:** Customer says weight → app shows price
     - Input: 250g → Output: "Price: **₹12.50**"
4. **Quick Amount Buttons:** ₹5, ₹10, ₹20, ₹50, ₹100 for one-tap calculation
5. **Add to Bill Button:** Adds the calculated item (product + quantity + price) directly to the current bill draft

### Calculation Logic

```typescript
// Core taraju calculation utility

function calculateWeight(pricePerKg: number, amount: number): {
  grams: number;
  display: string;
} {
  const grams = (amount / pricePerKg) * 1000;
  return {
    grams: Math.round(grams),
    display: grams >= 1000 
      ? `${(grams / 1000).toFixed(2)} kg` 
      : `${Math.round(grams)} g`
  };
}

function calculatePrice(pricePerKg: number, weightInGrams: number): {
  price: number;
  display: string;
} {
  const price = (weightInGrams / 1000) * pricePerKg;
  return {
    price: Math.round(price * 100) / 100,
    display: `₹${price.toFixed(2)}`
  };
}
```

### UX Design

- **Bottom tab bar:** Taraju gets its own dedicated tab icon (⚖️) for instant access
- **Large, readable numbers:** Store owners may have older phones or poor eyesight
- **Haptic feedback:** Vibrate on calculation for tactile confirmation
- **History strip:** Last 5 calculations shown at bottom for quick re-reference

---

## 7. Mobile App Navigation Structure

```
Bottom Tab Bar:
├── 🏠 Home (Dashboard)
│   ├── Quick stats (today's items sold, low stock count)
│   ├── Quick actions (Add Product, Stock In, New Bill)
│   └── Recent activity feed
├── 📦 Products
│   ├── Product List (search, filter, categories)
│   ├── Add/Edit Product
│   ├── Barcode Scanner
│   └── Stock In/Out
├── ⚖️ Taraju
│   ├── Product selector
│   ├── Calculator (₹→Weight / Weight→₹)
│   ├── Quick amount buttons
│   └── Add to Bill
├── 🧾 Bills (Phase 2 - placeholder for now)
│   └── Coming Soon screen
└── 👤 Profile
    ├── Store settings
    ├── Account info
    ├── Staff management (invite code)
    └── Sync settings (offline toggle)
```

---

## 8. Desktop Dashboard (Phase 1 — Minimal)

For Phase 1, the dashboard is a **read-only overview** — full features come in Phase 6.

### Pages

1. **Login** — Google sign-in only (phone OTP not needed for desktop)
2. **Dashboard Home** — Total products count, low stock alerts, recent stock movements
3. **Products** — Table view of all products with search/filter, sortable columns
4. **Stock Log** — Table view of stock movements

### Design

- Clean, minimal Material Design-inspired layout
- Sidebar navigation
- Responsive (works on tablets too)
- Dark mode support

---

## 9. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles — users can only read/write their own
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stores — only owner and staff can access
    match /stores/{storeId} {
      allow read: if isStoreAccess(storeId);
      allow write: if isStoreOwner(storeId);
      
      // Products — store members can read, owner can write
      match /products/{productId} {
        allow read: if isStoreAccess(storeId);
        allow create, update: if isStoreAccess(storeId);
        allow delete: if isStoreOwner(storeId);
      }
      
      // Stock movements — store members can read and create
      match /stockMovements/{movementId} {
        allow read: if isStoreAccess(storeId);
        allow create: if isStoreAccess(storeId);
        allow update, delete: if false; // Immutable audit log
      }
    }
    
    // Helper functions
    function isStoreAccess(storeId) {
      return request.auth != null && (
        get(/databases/$(database)/documents/stores/$(storeId)).data.ownerId == request.auth.uid ||
        request.auth.uid in get(/databases/$(database)/documents/stores/$(storeId)).data.staffIds
      );
    }
    
    function isStoreOwner(storeId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/stores/$(storeId)).data.ownerId == request.auth.uid;
    }
  }
}
```

---

## 10. Offline Strategy (Phase 1 — Basic)

- **Firestore offline persistence** is enabled by default in the SDK
- Reads work offline (cached data)
- Writes are queued and synced when back online
- Phase 7 will add the manual "Sync" button in settings with conflict resolution
- For Phase 1, this automatic offline behavior is sufficient

---

## 11. Error Handling

| Scenario | Handling |
|----------|----------|
| Auth failure | Retry with clear error message in Hindi/English |
| Firestore quota exceeded | Show "Daily limit reached, try tomorrow" banner |
| Barcode scan fails | Manual entry fallback |
| Offline write conflict | Last-write-wins (Firestore default) |
| Image upload fails | Skip silently, show placeholder |

---

## 12. Testing Strategy

- **Unit tests:** Taraju calculation logic, validation schemas (Jest)
- **Component tests:** Key screens render correctly (React Native Testing Library)
- **Integration tests:** Auth flow, product CRUD, stock movements
- **Manual testing:** Barcode scanning (requires physical device)

---

## 13. Out of Scope (Phase 1)

These are explicitly deferred to later phases:
- Billing / invoice generation (Phase 2)
- Khata / credit management (Phase 3)
- Supplier management (Phase 4)
- Reports / GST helper (Phase 5)
- Advanced dashboard (Phase 6)
- Multi-language / full offline sync (Phase 7)
- WhatsApp integration (Phase 3)
- UPI payments (Phase 2)
- Customer loyalty points (Phase 3)
- Delivery management (future)
- Smart reorder AI suggestions (Phase 4)
