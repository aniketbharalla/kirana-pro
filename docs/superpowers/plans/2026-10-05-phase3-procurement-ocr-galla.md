# Kirana Pro Phase 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete wholesaler procurement system with free-tier bill OCR, atomic stock inwarding, Daily Galla (cash drawer) settlement, profit analytics, and WhatsApp Udhar payment reminders with dynamic UPI links.

**Architecture:** Turborepo monorepo with `@kirana-pro/shared` handling invoice OCR regex parsing, UOM mapping, and WhatsApp UPI link construction; `apps/mobile` handling on-device bill scanning, review & atomic stock incrementing, and Galla closing; `apps/dashboard` handling supplier master, Tesseract.js browser bill upload, and financial oversight.

**Tech Stack:** React Native (Expo SDK), Next.js 15, Firebase Firestore atomic `runTransaction`, Zustand, Zod, TypeScript, Jest, Tesseract.js.

**Spec:** `docs/superpowers/specs/2026-10-05-phase3-procurement-ocr-galla-design.md`

## Global Constraints

- 100% free-tier only — zero paid dependencies (strictly avoiding Google Cloud Vision)
- TypeScript strict mode in all packages
- Atomic stock increment and rollback on invoice receipt via Firestore `runTransaction`
- UOM normalization: map `PB`, `PBG`, `PKT` to `packet`, `JAR`, `BOX` to `box`, etc.
- Derived true pack quantity logic: `totalQty = Math.round(grossAmt / rate)` for outer pack bills
- Desktop UI strictly in Light Theme as primary default
- UPI pay links formatted to NPCI standard: `upi://pay?pa=...&pn=...&am=...&cu=INR`

## Review Focus

1. **OCR Derived Pack Multipliers:** On distributor bills (like Parle `2PB`), `totalQty` must be derived correctly as `grossAmt / rate` (e.g. `102.04 / 4.25 = 24`), preventing under-inwarding stock.
2. **Atomic Stock Rollback:** If adding 10 products fails on product #9, zero products must have stock modified and no purchase record created.
3. **New Product Markup on Inwarding:** New products auto-created from invoices must have selling price default to `Math.round(rate * 1.2)` (20% markup) and valid category.
4. **Daily Galla Expected Cash Formula:** Expected cash must strictly equal `openingCash + systemSalesCash + systemUdharRepaid - expenses`.
5. **WhatsApp UPI Link Encoding:** Phone numbers, store names, and UPI URIs must be URL-safe encoded with no unescaped characters.

---

### Task 1: Shared Models, Invoice OCR Regex & Financial Helpers

**Files:**
- Create: `packages/shared/src/types/supplier.ts`
- Create: `packages/shared/src/types/purchase.ts`
- Create: `packages/shared/src/types/galla.ts`
- Create: `packages/shared/src/validation/supplier.ts`
- Create: `packages/shared/src/validation/purchase.ts`
- Create: `packages/shared/src/utils/invoiceOCR.ts`
- Create: `packages/shared/src/utils/khataReminder.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/__tests__/invoiceOCR.test.ts`
- Test: `packages/shared/src/__tests__/khataReminder.test.ts`

**Interfaces:**
- Produces:
  - `Supplier`, `PurchaseItem`, `PurchaseInvoice`, `PurchaseInvoiceDraft`, `DailyGallaSession` types
  - `parseInvoiceText(rawText: string): PurchaseInvoiceDraft`
  - `mapUOM(uom: string): ProductUnit`
  - `formatWhatsAppUdharReminder(customerName: string, balance: number, storeName: string, upiVpa: string): string`

- [ ] **Step 1: Write tests for `parseInvoiceText` and `formatWhatsAppUdharReminder`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement data types, Zod schemas, `invoiceOCR.ts`, and `khataReminder.ts`**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Export all from `packages/shared/src/index.ts` and commit**

---

### Task 2: Supplier Master & Purchase Inwarding Service with Atomic Stock Increment

**Files:**
- Create: `apps/mobile/src/services/supplier.ts`
- Create: `apps/mobile/src/services/purchase.ts`
- Create: `apps/mobile/src/store/supplierStore.ts`
- Modify: `firestore.rules`
- Test: `apps/mobile/src/__tests__/supplierStore.test.ts`
- Test: `apps/mobile/src/__tests__/purchaseService.test.ts`

**Interfaces:**
- Consumes: `Supplier`, `PurchaseInvoice`, `Product`
- Produces:
  - `getSuppliers(storeId: string): Promise<Supplier[]>`
  - `createSupplier(storeId: string, data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier>`
  - `recordPurchaseInvoice(storeId: string, invoice: PurchaseInvoice): Promise<void>`
  - `useSupplierStore`: Zustand store for active suppliers and purchase history

- [ ] **Step 1: Write tests for atomic purchase recording (verifying stock increment & rollback on error)**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `services/supplier.ts`, `services/purchase.ts`, and `supplierStore.ts`**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit**

---

### Task 3: Mobile OCR Bill Scanner, Review Inwarding & Procurement Screens

**Files:**
- Create: `apps/mobile/src/services/ocrService.ts`
- Create: `apps/mobile/src/screens/purchase/SupplierListScreen.tsx`
- Create: `apps/mobile/src/screens/purchase/AddSupplierScreen.tsx`
- Create: `apps/mobile/src/screens/purchase/CreatePurchaseScreen.tsx`
- Create: `apps/mobile/src/screens/purchase/ScanInvoiceScreen.tsx`
- Create: `apps/mobile/src/screens/purchase/ReviewInvoiceScreen.tsx`
- Create: `apps/mobile/src/screens/purchase/PurchaseDetailScreen.tsx`
- Create: `apps/mobile/src/navigation/PurchaseNavigator.tsx`
- Modify: `apps/mobile/src/navigation/MainTabNavigator.tsx`

**Interfaces:**
- Consumes: `parseInvoiceText`, `recordPurchaseInvoice`, `useSupplierStore`
- Produces:
  - End-to-end mobile flow for scanning distributor bills, reviewing extracted line items, editing taxes/quantities, and 1-tap inwarding.

- [ ] **Step 1: Implement `ocrService.ts` (with on-device & sample image fallback)**
- [ ] **Step 2: Implement `SupplierListScreen.tsx` and `AddSupplierScreen.tsx`**
- [ ] **Step 3: Implement `ScanInvoiceScreen.tsx` with camera/gallery picker**
- [ ] **Step 4: Implement `ReviewInvoiceScreen.tsx` with editable items, tax summary, and product auto-matching**
- [ ] **Step 5: Wire into `PurchaseNavigator.tsx` and `MainTabNavigator.tsx`**
- [ ] **Step 6: Verify in browser and commit**

---

### Task 4: Daily Galla (Cash Drawer Settlement) & Profit Analytics

**Files:**
- Create: `apps/mobile/src/services/galla.ts`
- Create: `apps/mobile/src/store/gallaStore.ts`
- Create: `apps/mobile/src/screens/galla/DailyGallaScreen.tsx`
- Modify: `apps/mobile/src/screens/settings/SettingsScreen.tsx`
- Test: `apps/mobile/src/__tests__/gallaStore.test.ts`

**Interfaces:**
- Consumes: `DailyGallaSession`
- Produces:
  - `openGalla(openingCash: number)`
  - `closeGalla(actualCash: number, notes?: string)`
  - Live cash surplus/shortage computation

- [ ] **Step 1: Write tests for Galla cash drawer calculations**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `services/galla.ts`, `gallaStore.ts`, and `DailyGallaScreen.tsx`**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit**

---

### Task 5: WhatsApp Udhar Reminders with Dynamic UPI Link & Customer Loyalty

**Files:**
- Modify: `apps/mobile/src/screens/khata/CustomerDetailScreen.tsx`
- Modify: `apps/mobile/src/screens/pos/CheckoutModal.tsx`
- Modify: `apps/mobile/src/store/cartStore.ts`
- Test: `apps/mobile/src/__tests__/loyalty.test.ts`

**Interfaces:**
- Consumes: `formatWhatsAppUdharReminder`
- Produces:
  - 1-tap WhatsApp payment reminder on customer profile
  - Accrual of loyalty points (1 point per ₹100) and redemption during POS checkout

- [ ] **Step 1: Write tests for loyalty points calculation and redemption limit**
- [ ] **Step 2: Implement WhatsApp reminder button on `CustomerDetailScreen.tsx`**
- [ ] **Step 3: Update `CheckoutModal.tsx` with loyalty points discount checkbox**
- [ ] **Step 4: Run tests and verify all pass**
- [ ] **Step 5: Commit**

---

### Task 6: Desktop Dashboard Procurement, Web Bill Upload & Galla Hub

**Files:**
- Create: `apps/dashboard/src/app/suppliers/page.tsx`
- Create: `apps/dashboard/src/app/purchases/page.tsx`
- Create: `apps/dashboard/src/app/galla/page.tsx`
- Create: `apps/dashboard/src/components/purchases/BillUploadModal.tsx`
- Modify: `apps/dashboard/src/components/layout/Sidebar.tsx`

**Interfaces:**
- Produces:
  - Full desktop supplier ledger and purchases list
  - Drag-and-drop bill image upload modal with instant OCR text preview
  - Daily Galla settlement history

- [ ] **Step 1: Implement `/suppliers` directory and table**
- [ ] **Step 2: Implement `/purchases` ledger and `BillUploadModal.tsx`**
- [ ] **Step 3: Implement `/galla` reconciliation dashboard**
- [ ] **Step 4: Update `Sidebar.tsx` navigation**
- [ ] **Step 5: Run `npm run build` in dashboard to verify clean build**
- [ ] **Step 6: Commit**
