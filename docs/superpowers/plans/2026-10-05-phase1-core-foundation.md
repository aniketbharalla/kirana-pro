# Kirana Pro Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core foundation of Kirana Pro — a kirana store management app with auth, store setup, product catalog, stock management, and taraju calculator.

**Architecture:** Turborepo monorepo with three packages: `apps/mobile` (Expo/React Native), `apps/dashboard` (Next.js 15), and `packages/shared` (types, constants, validation). Firebase Firestore for data, Firebase Auth for authentication (Google + Phone OTP). All services free-tier.

**Tech Stack:** Expo SDK 52+, React Native Paper, React Navigation 7, Zustand, Next.js 15 (App Router), Firebase 11, Zod, TypeScript, Jest

**Spec:** `docs/superpowers/specs/2026-10-05-phase1-core-foundation-design.md`

## Global Constraints

- All services must be free-tier — zero paid dependencies
- TypeScript strict mode in all packages
- Firebase Firestore for persistence; no other database
- Firebase Auth with Google and Phone OTP providers only
- Expo managed workflow (no native module ejection)
- All shared types/validation live in `packages/shared`, imported by both apps
- Product units: `kg`, `g`, `liter`, `ml`, `piece`, `packet`, `dozen`, `box`
- GST rates: `0`, `5`, `12`, `18`, `28`
- Currency: INR only

## Review Focus

1. **Firestore transaction atomicity on stock updates** — concurrent stock-in and stock-out on the same product must not produce negative stock or lost writes; expect Firestore transaction retry behavior
2. **Taraju calculation rounding** — ₹7 of an item at ₹50/kg = 140g, not 140.0000001g; user expects whole grams for display
3. **Auth state persistence across app restarts** — closing and reopening the app must not require re-login; Firebase Auth session must persist
4. **Barcode scanner permission denial** — user denying camera permission must see a clear fallback (manual barcode entry), not a crash
5. **Store setup incomplete state** — user who authenticates but kills the app mid-wizard must be routed back to wizard on next open, not to the dashboard

---

### Task 1: Monorepo Scaffold & Shared Package

**Files:**
- Create: `package.json` (root workspace)
- Create: `turbo.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/store.ts`
- Create: `packages/shared/src/types/product.ts`
- Create: `packages/shared/src/types/stock.ts`
- Create: `packages/shared/src/constants/categories.ts`
- Create: `packages/shared/src/constants/units.ts`
- Create: `packages/shared/src/validation/product.ts`
- Create: `packages/shared/src/validation/store.ts`
- Test: `packages/shared/src/__tests__/validation.test.ts`

**Interfaces:**
- Consumes: Nothing (first task)
- Produces:
  - `UserProfile` type — `{ uid, displayName, email, phoneNumber, photoURL, authProvider, storeId, role, createdAt, updatedAt }`
  - `Store` type — `{ id, name, type, address, gstNumber, logoURL, ownerId, staffIds, settings, createdAt, updatedAt }`
  - `StoreSettings` type — `{ currency, weightUnit, defaultTaxRate, invoicePrefix, invoiceCounter }`
  - `Product` type — `{ id, storeId, name, nameHindi, category, barcode, purchasePrice, sellingPrice, gstRate, unit, isLoose, pricePerUnit, currentStock, minStockAlert, imageURL, isActive, createdAt, updatedAt }`
  - `StockMovement` type — `{ id, storeId, productId, type, reason, quantity, previousStock, newStock, note, performedBy, createdAt }`
  - `PRODUCT_CATEGORIES: Array<{ id: string; name: string; nameHindi: string }>` — 15 pre-defined kirana categories
  - `PRODUCT_UNITS: Array<{ value: string; label: string; labelHindi: string }>` — 8 unit types
  - `GST_RATES: number[]` — `[0, 5, 12, 18, 28]`
  - `productSchema: ZodSchema` — Zod validation for product creation/update
  - `storeSchema: ZodSchema` — Zod validation for store creation

- [ ] **Step 1: Initialize root workspace**

Create root `package.json` with npm workspaces pointing to `apps/*` and `packages/*`. Create `turbo.json` with `build`, `dev`, `test`, and `lint` pipelines. Install `turbo` as root dev dependency.

```bash
npm init -y
npm install turbo --save-dev
```

- [ ] **Step 2: Create shared package with TypeScript types**

Create `packages/shared/` with its `package.json` (name: `@kirana-pro/shared`), `tsconfig.json` (strict mode), and all type files per the spec's data models. Export types for `UserProfile`, `Store`, `StoreSettings`, `Product`, `StockMovement`. Create `constants/categories.ts` with 15 kirana product categories (Atta/Flour, Dal/Pulses, Rice, Oil/Ghee, Spices/Masala, Sugar/Jaggery, Tea/Coffee, Snacks/Namkeen, Beverages, Dairy, Soap/Detergent, Personal Care, Cleaning, Stationery, Other) each with `id`, `name`, and `nameHindi`. Create `constants/units.ts` with 8 units each having `value`, `label`, `labelHindi`. Export `GST_RATES`.

- [ ] **Step 3: Write validation tests**

```typescript
// packages/shared/src/__tests__/validation.test.ts
describe('productSchema', () => {
  it('accepts valid product with all required fields', () => { /* sellingPrice: 50, unit: 'kg', gstRate: 5 */ });
  it('rejects product with negative sellingPrice', () => { /* sellingPrice: -10 → error */ });
  it('rejects product with invalid unit', () => { /* unit: 'bushel' → error */ });
  it('rejects product with invalid gstRate', () => { /* gstRate: 7 → error */ });
  it('accepts product with isLoose true and pricePerUnit set', () => {});
});
describe('storeSchema', () => {
  it('accepts valid store with required fields', () => {});
  it('rejects store without name', () => { /* name: '' → error */ });
  it('accepts store with optional gstNumber null', () => {});
  it('rejects store with invalid pincode', () => { /* pincode: 'abc' → error */ });
});
```

- [ ] **Step 4: Implement Zod validation schemas**

`validation/product.ts` — `productSchema` using `z.object()` with spec constraints (gstRate enum, unit enum, non-negative prices).
`validation/store.ts` — `storeSchema` with required name, valid type enum, 6-digit pincode regex, optional gstNumber.

- [ ] **Step 5: Run tests, verify all pass**

```bash
cd packages/shared && npx jest --verbose
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo with shared types, constants, and validation"
```

---

### Task 2: Firebase Configuration

**Files:**
- Create: `firebase.json`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Create: `packages/shared/src/firebase/config.ts`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Consumes: Nothing
- Produces:
  - `firebaseConfig` object — exported from `packages/shared/src/firebase/config.ts`, reads from environment variables
  - `initializeFirebase(): FirebaseApp` — initialization function
  - `getFirestoreDb(): Firestore` — Firestore instance getter
  - `getFirebaseAuth(): Auth` — Auth instance getter
  - Firestore security rules in `firestore.rules` per the spec (Section 9)

- [ ] **Step 1: Create Firebase project config**

Create `firebase.json` with Firestore and Storage configurations. Create `firestore.indexes.json` (empty array for now). Create `.gitignore` with `node_modules/`, `.env`, `*.local`, `.expo/`, `.next/`, `dist/`, `.turbo/`.

- [ ] **Step 2: Write Firestore security rules**

Create `firestore.rules` with the exact rules from spec Section 9: user profile self-access, store access via `isStoreAccess()` helper (owner or staffIds member), product CRUD for store members with delete restricted to owner, stock movements as immutable audit log (create only, no update/delete).

- [ ] **Step 3: Create Firebase config module**

`packages/shared/src/firebase/config.ts` — export `firebaseConfig` that reads `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` from environment. Export `initializeFirebase()`, `getFirestoreDb()`, `getFirebaseAuth()`. Create `.env.example` with placeholder values.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Firebase config, Firestore security rules, and environment setup"
```

---

### Task 3: Mobile App Scaffold & Authentication

**Files:**
- Create: `apps/mobile/` — Expo project via `npx create-expo-app`
- Create: `apps/mobile/src/services/auth.ts`
- Create: `apps/mobile/src/store/authStore.ts`
- Create: `apps/mobile/src/screens/auth/WelcomeScreen.tsx`
- Create: `apps/mobile/src/screens/auth/PhoneLoginScreen.tsx`
- Create: `apps/mobile/src/navigation/RootNavigator.tsx`
- Create: `apps/mobile/src/navigation/AuthNavigator.tsx`
- Test: `apps/mobile/src/__tests__/authStore.test.ts`

**Interfaces:**
- Consumes: `UserProfile` type from Task 1, `initializeFirebase()` and `getFirebaseAuth()` from Task 2
- Produces:
  - `signInWithGoogle(): Promise<UserCredential>` — Google sign-in flow
  - `sendPhoneOTP(phoneNumber: string): Promise<ConfirmationResult>` — sends OTP
  - `verifyOTP(confirmationResult: ConfirmationResult, code: string): Promise<UserCredential>` — verifies OTP
  - `signOut(): Promise<void>` — signs out
  - `useAuthStore` — Zustand store with `{ user: User | null, isLoading: boolean, isAuthenticated: boolean }`
  - `RootNavigator` component — switches between `AuthNavigator` and main app based on auth state
  - `AuthNavigator` component — Welcome → PhoneLogin stack

- [ ] **Step 1: Scaffold Expo app**

```bash
npx create-expo-app@latest apps/mobile --template blank-typescript
```

Install dependencies: `firebase`, `@react-native-google-signin/google-signin`, `react-native-paper`, `react-native-safe-area-context`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `zustand`, `react-native-screens`, `react-native-gesture-handler`.

- [ ] **Step 2: Write auth store tests**

```typescript
// apps/mobile/src/__tests__/authStore.test.ts
describe('authStore', () => {
  it('initializes with user null and isAuthenticated false', () => {});
  it('setUser updates user and sets isAuthenticated true', () => {});
  it('clearUser resets to initial state', () => {});
  it('setLoading toggles isLoading flag', () => {});
});
```

- [ ] **Step 3: Implement auth store**

`store/authStore.ts` — Zustand store with `user`, `isLoading`, `isAuthenticated`, and actions `setUser`, `clearUser`, `setLoading`.

- [ ] **Step 4: Run auth store tests**

```bash
cd apps/mobile && npx jest src/__tests__/authStore.test.ts --verbose
```

- [ ] **Step 5: Implement auth service**

`services/auth.ts` — `signInWithGoogle()` using `@react-native-google-signin/google-signin` + Firebase credential, `sendPhoneOTP()` using Firebase phone auth provider, `verifyOTP()`, `signOut()`. Each function wraps Firebase SDK calls and updates the auth store. Add `onAuthStateChanged` listener setup function that auto-updates auth store.

- [ ] **Step 6: Build auth screens**

`WelcomeScreen.tsx` — App logo/name "Kirana Pro", tagline "Apni dukaan, apne haath mein", two buttons: "Sign in with Google" (branded), "Sign in with Phone" (outlined). Use React Native Paper components, app's color scheme (saffron/orange primary).

`PhoneLoginScreen.tsx` — Phone number input with +91 prefix, "Send OTP" button, OTP input field (appears after OTP sent), "Verify" button. Loading states on buttons. Error messages for invalid number / wrong OTP.

- [ ] **Step 7: Build navigation structure**

`AuthNavigator.tsx` — Native stack with Welcome and PhoneLogin screens.
`RootNavigator.tsx` — Checks `useAuthStore().isAuthenticated`. If false → `AuthNavigator`. If true and no `storeId` → Store Setup (Task 5). If true and has `storeId` → Main Tab Navigator (Task 4).

- [ ] **Step 8: Wire up App entry point**

Update `apps/mobile/App.tsx` to wrap in `PaperProvider` (React Native Paper theme), `SafeAreaProvider`, and render `RootNavigator`. Initialize Firebase on mount. Set up `onAuthStateChanged` listener.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add mobile app with Google and phone auth"
```

---

### Task 4: Mobile Tab Navigator & Home Screen

**Files:**
- Create: `apps/mobile/src/navigation/MainTabNavigator.tsx`
- Create: `apps/mobile/src/screens/home/HomeScreen.tsx`
- Create: `apps/mobile/src/screens/bills/BillsPlaceholderScreen.tsx`
- Create: `apps/mobile/src/screens/profile/ProfileScreen.tsx`
- Create: `apps/mobile/src/theme/index.ts`
- Create: `apps/mobile/src/components/common/StatCard.tsx`

**Interfaces:**
- Consumes: `useAuthStore` from Task 3, `Product` and `StockMovement` types from Task 1
- Produces:
  - `MainTabNavigator` component — Bottom tab bar with Home, Products, Taraju, Bills (placeholder), Profile
  - `HomeScreen` component — Quick stats cards (total products, low stock count), quick action buttons
  - `ProfileScreen` component — Store info display, sign out button
  - `appTheme` — React Native Paper MD3 theme with saffron/orange primary colors
  - `StatCard` component — reusable stat display card `({ title: string, value: string | number, icon: string, color?: string })`

- [ ] **Step 1: Create app theme**

`theme/index.ts` — MD3 theme for React Native Paper. Primary: saffron orange (#FF6B00), secondary: deep green (#1B5E20), surface: white, background: #FAFAFA. Dark mode variant. Export `appTheme` and `darkTheme`.

- [ ] **Step 2: Build StatCard component**

`components/common/StatCard.tsx` — Takes `title`, `value`, `icon` (Material Community Icons name), optional `color`. Renders a Paper `Card` with icon, large value text, and smaller title. Used on HomeScreen for at-a-glance stats.

- [ ] **Step 3: Build HomeScreen**

Placeholder version for now — shows store name from user profile, 3 StatCards (Total Products: 0, Low Stock: 0, Out of Stock: 0), and 3 quick-action `Button` components (Add Product, Stock In, New Bill). Quick actions navigate to respective screens (Products and Stock are wired in Task 6, Bill is placeholder).

- [ ] **Step 4: Build BillsPlaceholderScreen and ProfileScreen**

`BillsPlaceholderScreen` — centered icon + "Coming in Phase 2" text.
`ProfileScreen` — displays store name, owner name, email/phone from auth, "Sign Out" button calling `signOut()` from Task 3.

- [ ] **Step 5: Build MainTabNavigator**

Bottom tab bar with 5 tabs: Home (🏠), Products (📦), Taraju (⚖️), Bills (🧾), Profile (👤). Products and Taraju tabs render placeholder `View` components for now — implemented in Tasks 6 and 7. Use React Navigation's `createBottomTabNavigator` with custom themed icons.

- [ ] **Step 6: Update RootNavigator**

Wire `MainTabNavigator` into `RootNavigator` from Task 3: authenticated user with `storeId` → `MainTabNavigator`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add tab navigator, home screen, and app theme"
```

---

### Task 5: Store Setup Wizard

**Files:**
- Create: `apps/mobile/src/screens/setup/StoreSetupScreen.tsx`
- Create: `apps/mobile/src/services/store.ts`
- Create: `apps/mobile/src/store/storeStore.ts`
- Test: `apps/mobile/src/__tests__/storeStore.test.ts`

**Interfaces:**
- Consumes: `Store`, `StoreSettings`, `storeSchema` from Task 1, `getFirestoreDb()` from Task 2, `useAuthStore` from Task 3
- Produces:
  - `createStore(data: Partial<Store>): Promise<string>` — creates store doc in Firestore, returns storeId
  - `fetchStore(storeId: string): Promise<Store>` — reads store doc
  - `useStoreStore` — Zustand store with `{ store: Store | null, isLoading: boolean, setStore, fetchCurrentStore }`
  - `StoreSetupScreen` component — multi-step wizard form

- [ ] **Step 1: Write store Zustand store tests**

```typescript
describe('storeStore', () => {
  it('initializes with store null', () => {});
  it('setStore updates store data', () => {});
  it('clearStore resets to null', () => {});
});
```

- [ ] **Step 2: Implement store Zustand store**

`store/storeStore.ts` — `{ store, isLoading, setStore, clearStore, fetchCurrentStore }`.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Implement store service**

`services/store.ts` — `createStore()`: validates with `storeSchema`, writes to Firestore `/stores/{id}`, updates user profile's `storeId`, returns storeId. `fetchStore()`: reads from Firestore. Both use `getFirestoreDb()` from Task 2.

- [ ] **Step 5: Build StoreSetupScreen**

Multi-step wizard using React Native Paper's `Stepper` pattern:
1. Store Name (TextInput, required)
2. Store Type (RadioButton group: Kirana, General Store, Medical, Dairy, Other + custom TextInput)
3. Address (Street, City, State dropdown, 6-digit Pincode)
4. GST Number (optional TextInput, "Skip" button)
5. Review & Create (summary of entered data, "Create Store" button)

On submit: call `createStore()`, update `authStore.user.storeId`, navigate to MainTabNavigator.

- [ ] **Step 6: Wire into RootNavigator**

In `RootNavigator` from Task 3: authenticated user with `storeId === null` → `StoreSetupScreen`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add store setup wizard with Firestore persistence"
```

---

### Task 6: Product Catalog & Stock Management

**Files:**
- Create: `apps/mobile/src/services/product.ts`
- Create: `apps/mobile/src/services/stock.ts`
- Create: `apps/mobile/src/store/productStore.ts`
- Create: `apps/mobile/src/screens/products/ProductListScreen.tsx`
- Create: `apps/mobile/src/screens/products/AddProductScreen.tsx`
- Create: `apps/mobile/src/screens/products/ProductDetailScreen.tsx`
- Create: `apps/mobile/src/screens/products/BarcodeScannerScreen.tsx`
- Create: `apps/mobile/src/screens/stock/StockInScreen.tsx`
- Create: `apps/mobile/src/screens/stock/StockHistoryScreen.tsx`
- Create: `apps/mobile/src/navigation/ProductsNavigator.tsx`
- Create: `apps/mobile/src/components/products/ProductCard.tsx`
- Create: `apps/mobile/src/components/products/CategoryFilter.tsx`
- Test: `apps/mobile/src/__tests__/productStore.test.ts`
- Test: `apps/mobile/src/__tests__/stockService.test.ts`

**Interfaces:**
- Consumes: `Product`, `StockMovement`, `productSchema`, `PRODUCT_CATEGORIES`, `PRODUCT_UNITS`, `GST_RATES` from Task 1, `getFirestoreDb()` from Task 2, `useStoreStore` from Task 5
- Produces:
  - `addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>` — validates and writes to Firestore
  - `updateProduct(id: string, data: Partial<Product>): Promise<void>`
  - `deleteProduct(id: string): Promise<void>` — sets `isActive: false`
  - `getProducts(storeId: string): Promise<Product[]>` — real-time listener
  - `searchProducts(storeId: string, query: string): Promise<Product[]>`
  - `recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<void>` — creates movement + updates product stock atomically via Firestore transaction
  - `useProductStore` — Zustand store with `{ products, isLoading, lowStockProducts, searchQuery, filteredProducts }`

- [ ] **Step 1: Write product store tests**

```typescript
describe('productStore', () => {
  it('initializes with empty products array', () => {});
  it('setProducts updates products and derives lowStockProducts', () => {
    // product with currentStock < minStockAlert should appear in lowStockProducts
  });
  it('filterByCategory returns only products in that category', () => {});
  it('searchProducts filters by name substring (case-insensitive)', () => {});
});
```

- [ ] **Step 2: Implement product store**

`store/productStore.ts` — `{ products, isLoading, searchQuery, setProducts, setSearchQuery }` with derived `lowStockProducts` (computed from products where `currentStock <= minStockAlert`), `filteredProducts` (computed from search query + category filter).

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Write stock service tests**

```typescript
describe('recordStockMovement', () => {
  it('creates movement document with correct previousStock and newStock', () => {});
  it('updates product currentStock atomically', () => {});
  it('stock-in increases currentStock by quantity', () => {
    // previousStock: 10, quantity: 5 → newStock: 15
  });
  it('stock-out decreases currentStock by quantity', () => {
    // previousStock: 10, quantity: 3 → newStock: 7
  });
  it('prevents stock from going negative on stock-out', () => {
    // previousStock: 2, quantity: 5 → error
  });
});
```

- [ ] **Step 5: Implement product and stock services**

`services/product.ts` — CRUD operations against Firestore `/stores/{storeId}/products/{productId}`. `addProduct` validates with `productSchema`. `getProducts` sets up an `onSnapshot` real-time listener that updates `productStore`.

`services/stock.ts` — `recordStockMovement()` uses `runTransaction()`: reads current product stock, calculates new stock (rejects if negative on out), creates `StockMovement` doc, updates `product.currentStock` — all atomic.

- [ ] **Step 6: Build ProductCard and CategoryFilter components**

`ProductCard.tsx` — Paper `Card` showing product name, price (₹/unit), current stock with color coding (green normal, amber low, red out), category chip. Tap navigates to detail.
`CategoryFilter.tsx` — horizontal scrollable `Chip` list from `PRODUCT_CATEGORIES`, "All" as first option.

- [ ] **Step 7: Build ProductListScreen**

`Searchbar` at top, `CategoryFilter` below, `FlatList` of `ProductCard` components. FAB (floating action button) for "Add Product". Empty state with illustration text "No products yet — add your first product!".

- [ ] **Step 8: Build AddProductScreen**

Form with: name (TextInput), category (dropdown from PRODUCT_CATEGORIES), purchase price, selling price, GST rate (dropdown from GST_RATES), unit (dropdown from PRODUCT_UNITS), `isLoose` toggle (Switch), initial stock quantity, min stock alert level, barcode (TextInput + "Scan" icon button). "Save" button validates with `productSchema` and calls `addProduct()`.

- [ ] **Step 9: Build BarcodeScannerScreen with Smart Stock Update Flow**

Request camera permission with `expo-barcode-scanner`. On permission denied → show error message + "Enter barcode manually" button. On successful scan:
- **If barcode matches existing product in store:** Display an instant modal bottom sheet showing product name, current stock, and quick increment chips (`+1`, `+5`, `+10`, custom entry) with a 1-tap "Update Stock" button that runs `recordStockMovement(in, purchase)` and atomically updates stock.
- **If barcode does NOT exist:** Play haptic feedback and display an "Add Item" dialog/screen pre-filled with the scanned barcode, prompting the user for **Name**, **Selling Price**, and **Initial Quantity in Stock**. Saving automatically registers the product in Firestore and updates store inventory.

- [ ] **Step 10: Build ProductDetailScreen and stock screens**

`ProductDetailScreen` — shows all product info, "Edit" button, stock history list, "Stock In" and "Adjust Stock" buttons.
`StockInScreen` — select product, enter quantity, optional note, "Add Stock" button calls `recordStockMovement()` with type 'in'.
`StockHistoryScreen` — `FlatList` of `StockMovement` entries for a product, showing type icon, quantity, date, who performed it.

- [ ] **Step 11: Build ProductsNavigator and wire into tab bar**

`ProductsNavigator.tsx` — native stack: ProductList → AddProduct, ProductDetail, BarcodeScanner, StockIn, StockHistory. Replace placeholder in `MainTabNavigator` from Task 4.

- [ ] **Step 12: Update HomeScreen stats**

Wire HomeScreen's `StatCard` values to real data: Total Products = `products.length`, Low Stock = `lowStockProducts.length`, Out of Stock = products where `currentStock === 0`.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add product catalog with barcode scanning and stock management"
```

---

### Task 7: Taraju Calculator

**Files:**
- Create: `packages/shared/src/utils/taraju.ts`
- Create: `apps/mobile/src/screens/taraju/TarajuScreen.tsx`
- Create: `apps/mobile/src/components/taraju/QuickAmountButtons.tsx`
- Create: `apps/mobile/src/components/taraju/CalculationResult.tsx`
- Test: `packages/shared/src/__tests__/taraju.test.ts`

**Interfaces:**
- Consumes: `Product` type from Task 1, `useProductStore` from Task 6
- Produces:
  - `calculateWeight(pricePerKg: number, amount: number): { grams: number, display: string }` — ₹ → weight
  - `calculatePrice(pricePerKg: number, weightInGrams: number): { price: number, display: string }` — weight → ₹
  - `TarajuScreen` component — full taraju calculator screen

- [ ] **Step 1: Write taraju calculation tests**

```typescript
// packages/shared/src/__tests__/taraju.test.ts
describe('calculateWeight', () => {
  it('₹5 of ₹50/kg rice = 100g', () => {
    expect(calculateWeight(50, 5)).toEqual({ grams: 100, display: '100 g' });
  });
  it('₹100 of ₹50/kg rice = 2.00 kg', () => {
    expect(calculateWeight(50, 100)).toEqual({ grams: 2000, display: '2.00 kg' });
  });
  it('₹7 of ₹50/kg = 140g (whole grams, no floating point)', () => {
    expect(calculateWeight(50, 7)).toEqual({ grams: 140, display: '140 g' });
  });
  it('₹10 of ₹33/kg = 303g (rounds to nearest gram)', () => {
    expect(calculateWeight(33, 10)).toEqual({ grams: 303, display: '303 g' });
  });
});

describe('calculatePrice', () => {
  it('250g of ₹50/kg = ₹12.50', () => {
    expect(calculatePrice(50, 250)).toEqual({ price: 12.5, display: '₹12.50' });
  });
  it('1000g of ₹50/kg = ₹50.00', () => {
    expect(calculatePrice(50, 1000)).toEqual({ price: 50, display: '₹50.00' });
  });
  it('100g of ₹33/kg = ₹3.30', () => {
    expect(calculatePrice(33, 100)).toEqual({ price: 3.3, display: '₹3.30' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/shared && npx jest src/__tests__/taraju.test.ts --verbose
```
Expected: FAIL — `calculateWeight` and `calculatePrice` not defined.

- [ ] **Step 3: Implement taraju calculation utilities**

`packages/shared/src/utils/taraju.ts`:
- `calculateWeight(pricePerUnit, amount)` — `grams = Math.round((amount / pricePerUnit) * 1000)`, display switches to kg at >= 1000g
- `calculatePrice(pricePerUnit, weightInGrams)` — `price = Math.round((weightInGrams / 1000) * pricePerUnit * 100) / 100`, display as `₹{price.toFixed(2)}`

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/shared && npx jest src/__tests__/taraju.test.ts --verbose
```
Expected: all PASS.

- [ ] **Step 5: Build QuickAmountButtons and CalculationResult components**

`QuickAmountButtons.tsx` — Row of 5 `Chip` buttons: ₹5, ₹10, ₹20, ₹50, ₹100. On tap, calls parent callback with amount value.
`CalculationResult.tsx` — Large display card showing calculated result. In ₹→Weight mode: shows "{grams} g" or "{kg} kg" in extra-large bold font. In Weight→₹ mode: shows "₹{price}" in extra-large bold font. Includes haptic feedback (Expo Haptics) on result display.

- [ ] **Step 6: Build TarajuScreen**

Full screen with:
1. Product selector — `Searchbar` + `FlatList` filtered to `isLoose: true` products only. Shows selected product name and rate.
2. Mode toggle — `SegmentedButtons`: "₹ → Weight" / "Weight → ₹"
3. Input field — `TextInput` with numeric keyboard. Label changes based on mode ("Enter amount (₹)" or "Enter weight (g)").
4. `QuickAmountButtons` — visible only in ₹→Weight mode
5. `CalculationResult` — shows result after input
6. "Add to Bill" `Button` (disabled for Phase 1, placeholder toast "Coming in Phase 2")
7. History strip — last 5 calculations in a horizontal `ScrollView` at bottom

Auto-calculates on every keystroke (no "Calculate" button needed). Large fonts throughout for readability.

- [ ] **Step 7: Wire TarajuScreen into tab navigator**

Replace Taraju tab placeholder in `MainTabNavigator` from Task 4 with `TarajuScreen`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add taraju calculator with price-to-weight and weight-to-price modes"
```

---

### Task 8: Dashboard (Minimal Read-Only)

**Files:**
- Create: `apps/dashboard/` — Next.js project via `npx create-next-app`
- Create: `apps/dashboard/src/app/layout.tsx`
- Create: `apps/dashboard/src/app/page.tsx`
- Create: `apps/dashboard/src/app/login/page.tsx`
- Create: `apps/dashboard/src/app/products/page.tsx`
- Create: `apps/dashboard/src/app/stock/page.tsx`
- Create: `apps/dashboard/src/lib/firebase.ts`
- Create: `apps/dashboard/src/lib/auth.ts`
- Create: `apps/dashboard/src/components/Sidebar.tsx`
- Create: `apps/dashboard/src/components/StatsGrid.tsx`
- Create: `apps/dashboard/src/components/ProductsTable.tsx`
- Create: `apps/dashboard/src/components/StockLog.tsx`
- Create: `apps/dashboard/src/middleware.ts`

**Interfaces:**
- Consumes: `Product`, `StockMovement`, `Store` types from Task 1, `firebaseConfig` from Task 2
- Produces:
  - Next.js dashboard app with 4 pages: Login, Dashboard Home, Products, Stock Log
  - `Sidebar` component — navigation with active state
  - `StatsGrid` component — displays total products, low stock, out of stock counts
  - `ProductsTable` component — sortable, searchable table of products
  - `StockLog` component — chronological log of stock movements
  - Auth middleware — redirects unauthenticated users to /login

- [ ] **Step 1: Scaffold Next.js app**

```bash
npx create-next-app@latest apps/dashboard --typescript --app --src-dir --eslint --no-tailwind --import-alias "@/*"
```

Install Firebase: `npm install firebase` in `apps/dashboard`.

- [ ] **Step 2: Set up Firebase and auth for dashboard**

`lib/firebase.ts` — initialize Firebase app with config from `@kirana-pro/shared`.
`lib/auth.ts` — `signInWithGoogle()` using Firebase `GoogleAuthProvider` + `signInWithPopup`, `signOut()`, `onAuthStateChanged` wrapper.
`middleware.ts` — protect `/`, `/products`, `/stock` routes; redirect to `/login` if no auth cookie.

- [ ] **Step 3: Build login page**

`app/login/page.tsx` — centered card with Kirana Pro logo, "Sign in with Google" button. On success → redirect to `/`. Clean, minimal design with the saffron/orange brand color.

- [ ] **Step 4: Build Sidebar component**

`components/Sidebar.tsx` — vertical sidebar with: Kirana Pro logo at top, nav links (Dashboard, Products, Stock Log), sign out button at bottom. Active link highlighted with brand color. Collapsible on smaller screens.

- [ ] **Step 5: Build dashboard layout and home page**

`app/layout.tsx` — wraps children with Sidebar. Sets up Firebase auth listener.
`app/page.tsx` — Dashboard home. `StatsGrid` with 3 cards (Total Products, Low Stock, Out of Stock), recent stock movements list (last 10). Data fetched from Firestore using the authenticated user's storeId.

- [ ] **Step 6: Build Products page**

`app/products/page.tsx` — `ProductsTable`: columns for Name, Category, Price (₹), Stock, Unit, GST%, Status. Search bar filters by name. Sortable by name, price, stock. Color-coded stock column. Read-only for Phase 1.

- [ ] **Step 7: Build Stock Log page**

`app/stock/page.tsx` — `StockLog`: table of stock movements. Columns: Date, Product, Type (In/Out/Adjust), Quantity, Reason, Performed By. Newest first. Filterable by product and type.

- [ ] **Step 8: Add dark mode support**

CSS variables for light/dark themes. System preference detection via `prefers-color-scheme`. Toggle button in Sidebar.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add minimal Next.js dashboard with products and stock views"
```
