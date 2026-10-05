# Kirana Pro Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete high-speed POS billing engine, customer Khata (udhar ledger), dynamic UPI QR code generator, 58mm thermal receipts, and WhatsApp bill sharing for Kirana Pro.

**Architecture:** Turborepo monorepo with `@kirana-pro/shared` handling tax, UPI URI generation, and receipt formatting; `apps/mobile` handling high-speed touch POS and camera-assisted checkout; `apps/dashboard` handling live billing oversight and customer ledger management.

**Tech Stack:** React Native (Expo SDK), Next.js 15, Firebase Firestore, Zustand, Zod, TypeScript, Jest

**Spec:** `docs/superpowers/specs/2026-10-05-phase2-pos-billing-design.md`

## Global Constraints

- All services must be free-tier — zero paid dependencies
- TypeScript strict mode in all packages
- Firebase Firestore for persistence; atomic transactions on inventory deduction and khata ledger updates
- Standard NPCI UPI URI generation (`upi://pay?pa=...`) for instant zero-fee QR payment
- Desktop UI must strictly maintain Light Theme as primary default
- GST rates supported: 0, 5, 12, 18, 28 with half-half CGST and SGST splits for intra-state sales

## Review Focus

1. **Atomic Stock Decrement on Sale** — when a 5-item bill is completed, all 5 items must have their stock decreased atomically and cannot go negative without explicit confirmation
2. **GST Rounding & Subtotal Accuracy** — item taxable amount + GST must equal total item amount to 2 decimal places with no floating-point rounding drifts
3. **Taraju Bridge to Cart** — adding loose items from Taraju calculator (e.g. ₹5 chawal -> 100g) must appear in active cart as loose item with quantity 0.100 kg
4. **Khata Ledger Consistency** — customer current balance must equal sum of debits (udhar sales) minus credits (repayments)
5. **WhatsApp Message Formatting** — receipt text must be safely URI encoded and readable on both WhatsApp Web and mobile WhatsApp

---

### Task 1: Shared Models, GST Math & Receipt Utilities

**Files:**
- Create: `packages/shared/src/types/invoice.ts`
- Create: `packages/shared/src/types/customer.ts`
- Create: `packages/shared/src/utils/gst.ts`
- Create: `packages/shared/src/utils/receipt.ts`
- Create: `packages/shared/src/utils/upi.ts`
- Create: `packages/shared/src/validation/invoice.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/__tests__/gst.test.ts`
- Test: `packages/shared/src/__tests__/receipt.test.ts`

**Interfaces:**
- Consumes: `Product` type from Task 1
- Produces:
  - `InvoiceItem`, `Invoice`, `CustomerKhata`, `KhataTransaction` types
  - `calculateItemGST(price: number, quantity: number, gstRate: number, discount?: number): InvoiceItemMath`
  - `generateInvoiceNumber(prefix: string, counter: number): string`
  - `generateUpiUri(vpa: string, payeeName: string, amount: number, note: string): string`
  - `formatWhatsAppReceipt(invoice: Invoice, storeName: string): string`

- [ ] **Step 1: Write GST and Receipt unit tests**
- [ ] **Step 2: Implement GST math & invoice number generator**
- [ ] **Step 3: Implement UPI URI and WhatsApp receipt formatting**
- [ ] **Step 4: Implement Zod validation for Invoice and Customer**
- [ ] **Step 5: Run tests and verify all pass**
- [ ] **Step 6: Commit**

---

### Task 2: Mobile Cart Store & Billing POS Screen

**Files:**
- Create: `apps/mobile/src/store/cartStore.ts`
- Create: `apps/mobile/src/services/invoice.ts`
- Create: `apps/mobile/src/screens/bills/BillingScreen.tsx`
- Create: `apps/mobile/src/components/bills/CartItemList.tsx`
- Create: `apps/mobile/src/components/bills/QuickItemPicker.tsx`
- Test: `apps/mobile/src/__tests__/cartStore.test.ts`

**Interfaces:**
- Consumes: `useProductStore`, `Invoice`, `InvoiceItem`
- Produces:
  - `useCartStore` with `addItem`, `updateQuantity`, `removeItem`, `setDiscount`, `clearCart`, `getTotals`
  - `createInvoice(storeId: string, invoice: Invoice): Promise<Invoice>`
  - `BillingScreen` with interactive cart and search bar

- [ ] **Step 1: Write cart store tests**
- [ ] **Step 2: Implement cart Zustand store**
- [ ] **Step 3: Implement invoice creation service with Firestore atomic transaction**
- [ ] **Step 4: Build CartItemList and QuickItemPicker components**
- [ ] **Step 5: Build high-speed BillingScreen**
- [ ] **Step 6: Run tests and commit**

---

### Task 3: Taraju Bridge & Multi-Mode Checkout Modal

**Files:**
- Create: `apps/mobile/src/components/bills/CheckoutModal.tsx`
- Create: `apps/mobile/src/components/bills/UpiQrView.tsx`
- Modify: `apps/mobile/src/screens/taraju/TarajuScreen.tsx`

**Interfaces:**
- Consumes: `useCartStore`, `generateUpiUri`, `calculateWeight`
- Produces:
  - 1-tap "Add to Bill" on `TarajuScreen` that pushes loose items into `cartStore`
  - `CheckoutModal` handling Cash change, dynamic UPI QR code, and Udhar selection

- [ ] **Step 1: Connect Taraju "Add to Bill" to Cart store**
- [ ] **Step 2: Build UpiQrView displaying live UPI QR code and copy button**
- [ ] **Step 3: Build CheckoutModal with Cash denomination buttons and change calculator**
- [ ] **Step 4: Wire checkout completion to Firestore invoice creation & stock reduction**
- [ ] **Step 5: Commit**

---

### Task 4: Digital Receipts & 58mm Thermal Print Layout

**Files:**
- Create: `apps/mobile/src/screens/bills/BillReceiptScreen.tsx`
- Create: `apps/mobile/src/screens/bills/BillsHistoryScreen.tsx`
- Create: `apps/mobile/src/navigation/BillsNavigator.tsx`
- Modify: `apps/mobile/src/navigation/MainTabNavigator.tsx`

**Interfaces:**
- Consumes: `Invoice`, `formatWhatsAppReceipt`
- Produces:
  - `BillReceiptScreen` with 58mm thermal printable card, "Share on WhatsApp", and "New Bill" actions
  - `BillsHistoryScreen` with searchable past invoices
  - Replaces placeholder screen in `MainTabNavigator`

- [ ] **Step 1: Build BillReceiptScreen with 58mm thermal layout**
- [ ] **Step 2: Implement WhatsApp bill sharing via Linking API**
- [ ] **Step 3: Build BillsHistoryScreen displaying today's bills and totals**
- [ ] **Step 4: Wire BillsNavigator into MainTabNavigator**
- [ ] **Step 5: Commit**

---

### Task 5: Customer Khata Ledger (उधार खाता)

**Files:**
- Create: `packages/shared/src/types/customer.ts`
- Create: `apps/mobile/src/store/khataStore.ts`
- Create: `apps/mobile/src/services/khata.ts`
- Create: `apps/mobile/src/screens/khata/KhataScreen.tsx`
- Create: `apps/mobile/src/screens/khata/CustomerDetailScreen.tsx`
- Create: `apps/mobile/src/components/khata/AddCustomerModal.tsx`
- Create: `apps/mobile/src/components/khata/RecordPaymentModal.tsx`
- Test: `apps/mobile/src/__tests__/khataStore.test.ts`

**Interfaces:**
- Consumes: `CustomerKhata`, `KhataTransaction`
- Produces:
  - `useKhataStore`
  - `recordKhataTransaction(storeId, customerId, type, amount, note)`
  - Full Khata screen with customer balance badges and payment records

- [ ] **Step 1: Write khata store tests**
- [ ] **Step 2: Implement Khata service with atomic Firestore updates**
- [ ] **Step 3: Build AddCustomerModal and RecordPaymentModal**
- [ ] **Step 4: Build KhataScreen and CustomerDetailScreen**
- [ ] **Step 5: Run tests and commit**

---

### Task 6: Desktop Dashboard Billing & Khata Hub

**Files:**
- Create: `apps/dashboard/src/app/bills/page.tsx`
- Create: `apps/dashboard/src/app/khata/page.tsx`
- Create: `apps/dashboard/src/components/BillsTable.tsx`
- Create: `apps/dashboard/src/components/KhataTable.tsx`
- Modify: `apps/dashboard/src/components/Sidebar.tsx`
- Modify: `apps/dashboard/src/app/page.tsx`

**Interfaces:**
- Consumes: `Invoice`, `CustomerKhata`, Light Theme tokens
- Produces:
  - `/bills` route with invoices table, status filter, and receipt view
  - `/khata` route with customer credit ledger
  - Dashboard Home with Today's Sales (₹) and Active Udhar (₹) metrics

- [ ] **Step 1: Build BillsTable and `/bills` page in clean Light Theme**
- [ ] **Step 2: Build KhataTable and `/khata` page**
- [ ] **Step 3: Update Dashboard Sidebar and Home Page metrics**
- [ ] **Step 4: Verify build with `npm --prefix apps/dashboard run build`**
- [ ] **Step 5: Commit**
