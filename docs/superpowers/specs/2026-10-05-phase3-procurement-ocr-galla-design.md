# Kirana Pro — Phase 3: Procurement, Free-Tier Bill OCR, Daily Galla & Loyalty Spec

## Overview

Phase 3 expands Kirana Pro into an end-to-end operational engine for Indian kirana store owners ("chacha ki dukaan"). Building upon the foundation of Phase 1 (Core & Catalog) and Phase 2 (POS Billing & Khata), Phase 3 delivers three critical subsystems:
1. **Wholesaler Procurement & Free-Tier Bill OCR (खरीददारी व बिल स्कैनर):** Supplier directory, automated parsing of distributor invoices (e.g. Parle / N R Enterprises) via free on-device/WASM OCR, and atomic stock inwarding.
2. **Daily Galla & Profit/Loss Analytics (दैनिक गल्ला व मुनाफ़ा):** Morning cash drawer opening, night settlement with shortage/surplus detection, and real-time gross profit analytics.
3. **WhatsApp Udhar Payment Reminders & Loyalty (उधार वसूली व ग्राहक डिस्काउंट):** 1-tap WhatsApp payment reminders with direct NPCI UPI links and store loyalty points.

**Constraint:** 100% Free-tier only. Zero paid APIs (Google Cloud Vision is strictly avoided; on-device Expo ML Kit / client-side Tesseract.js WASM and standard NPCI UPI links are used).

---

## 1. Subsystem 1: Supplier Master & Purchase Invoices + Free-Tier OCR

### 1.1 Data Models (`@kirana-pro/shared`)

#### Supplier (`packages/shared/src/types/supplier.ts`)
```typescript
export type SupplierType = 'Wholesaler' | 'Distributor' | 'Direct';

export interface Supplier {
  id: string;
  storeId: string;
  name: string;             // e.g., "N R ENTERPRISES"
  phone: string;            // e.g., "7415545631"
  gstin?: string;           // e.g., "23NMQPK6686L1Z0"
  address?: string;
  city?: string;
  contactPerson?: string;
  type: SupplierType;
  totalPurchases: number;   // cumulative purchase amount in ₹
  totalPaid: number;        // total paid to supplier
  balance: number;          // pending credit payable to supplier
  invoiceCount: number;
  createdAt: number;        // epoch ms
  updatedAt: number;
}
```

#### Purchase Invoice & Items (`packages/shared/src/types/purchase.ts`)
```typescript
import { ProductUnit } from './product';

export interface PurchaseItem {
  productId?: string;        // mapped existing product ID if matched
  productName: string;       // e.g., "20-20 Classic Butter 14.44g"
  barcode?: string;
  hsnCode?: string;          // e.g., "19059030"
  quantity: number;          // outer quantity (e.g., 2)
  innerQty?: number;         // e.g., 12
  totalQty: number;          // effective individual units added to stock
  uom: string;               // original bill UOM string e.g., "PB", "JAR", "BOX"
  uomMapped: ProductUnit;    // 'packet' | 'piece' | 'box' | 'kg' | 'g' | 'liter' | 'ml'
  rate: number;              // purchase unit cost (₹)
  grossAmt: number;          // rate * totalQty
  discount: number;
  taxableAmt: number;        // grossAmt - discount
  cgstRate: number;          // e.g., 2.5
  cgstAmt: number;
  sgstRate: number;          // e.g., 2.5
  sgstAmt: number;
  totalAmt: number;          // taxableAmt + cgstAmt + sgstAmt
  isNewProduct: boolean;
  confidence: number;        // OCR match confidence (0 - 100)
}

export interface PurchaseInvoice {
  id: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  invoiceNo: string;         // supplier invoice reference number
  invoiceDate: number;       // epoch ms
  imageURL?: string;         // local or storage uri
  items: PurchaseItem[];
  subtotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  totalTax: number;
  roundOff: number;
  netPayable: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  paidAmt: number;
  createdBy: string;
  createdAt: number;
}

export interface PurchaseInvoiceDraft {
  supplierName?: string;
  invoiceNo?: string;
  items: PurchaseItem[];
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  netPayable: number;
  confidence: number;
}
```

### 1.2 Invoice OCR Regex & Text Parser (`packages/shared/src/utils/invoiceOCR.ts`)
Distributor invoices in India (especially FMCG like Parle, Britannia, ITC) follow a standard tabular print:
- **Columns:** S.No, HSN Code, Item Description, MRP, UOM1, UOM2, Rate, Gross, CGST/SGST.
- **Pack Multipliers:** Often billed as outer packs (e.g. `2PB` with rate `₹4.25` and gross `₹102.04`). The true unit quantity is derived via `totalQty = Math.round(grossAmt / rate)` (e.g. `102.04 / 4.25 = 24` packets).
- **UOM Normalization:**
  - `PB`, `PBG`, `PKT` -> `'packet'`
  - `JAR`, `BOX` -> `'box'`
  - `PCS` -> `'piece'`
  - `KG`, `LTR` -> `'kg'`, `'liter'`
- **Tax Breakdown:** Standard FMCG tax split is intra-state 5% (CGST 2.5% + SGST 2.5%) or 12%/18%.
- **Parser Signature:**
  ```typescript
  export function parseInvoiceText(rawText: string): PurchaseInvoiceDraft;
  export function mapUOM(uom: string): ProductUnit;
  ```

### 1.3 Free-Tier OCR Engine
- **Mobile (`apps/mobile`):**
  - Camera & Image selection via `expo-image-picker`.
  - On-device text recognition with graceful offline parsing.
  - Full manual review screen allowing the storekeeper to edit prices, quantities, and map lines to existing catalog products with a searchable picker.
- **Web Dashboard (`apps/dashboard`):**
  - Drag-and-drop file upload zone.
  - Client-side browser recognition using `tesseract.js` WASM engine (100% free, zero backend API keys).

### 1.4 Atomic Stock Inwarding (`services/purchase.ts`)
When the store owner confirms a purchase invoice, a Firestore `runTransaction` executes:
1. For each item:
   - If `productId` exists: updates `currentStock += item.totalQty` and logs a `stockMovement` (`type: 'in', reason: 'purchase'`).
   - If `isNewProduct`: creates a new product document in `/stores/{storeId}/products` with default markup (`sellingPrice = Math.round(rate * 1.2)`), initial stock `item.totalQty`, and logs a `stockMovement`.
2. Stores the invoice document in `/stores/{storeId}/purchases/{purchaseId}`.
3. Updates `/stores/{storeId}/suppliers/{supplierId}`: increments `totalPurchases += netPayable`, updates `balance += (netPayable - paidAmt)`, and increments `invoiceCount`.

---

## 2. Subsystem 2: Daily Galla (Cash Drawer) & Profit/Loss Analytics

### 2.1 Daily Galla Session Model (`packages/shared/src/types/galla.ts`)
```typescript
export interface DailyGallaSession {
  id: string;
  storeId: string;
  date: string;               // YYYY-MM-DD
  openedAt: number;           // epoch ms
  closedAt?: number;
  openingCash: number;        // e.g. ₹2,000 kept in drawer at start of day
  systemSalesCash: number;    // total cash collected from invoices
  systemSalesUPI: number;     // total UPI collected
  systemSalesUdhar: number;   // total Udhar given
  systemUdharRepaid: number;  // cash collected from khata repayments
  expenses: number;           // petty cash taken out for chai/cleaning/etc.
  expectedClosingCash: number;// openingCash + systemSalesCash + systemUdharRepaid - expenses
  actualClosingCash?: number; // physical cash counted at night
  cashDifference?: number;    // actualClosingCash - expectedClosingCash (shortage / surplus)
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  closedBy?: string;
}
```

### 2.2 Profit & Margin Analytics (`packages/shared/src/utils/analytics.ts`)
- **Gross Profit per Item:** `(sellingPrice - purchasePrice) * quantity`
- **Gross Margin %:** `((totalRevenue - totalCOGS) / totalRevenue) * 100`
- **Dead Stock Detector:** Identifies catalog items with zero stock movements or sales in the last 30 days.

---

## 3. Subsystem 3: WhatsApp Udhar Reminders & Customer Loyalty

### 3.1 1-Tap WhatsApp Payment Reminder (`packages/shared/src/utils/khataReminder.ts`)
Constructs an automated, polite Hindi/English message containing an instant NPCI UPI payment link:
```typescript
export function formatWhatsAppUdharReminder(
  customerName: string,
  balance: number,
  storeName: string,
  upiVpa: string
): string {
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(storeName)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Khata Payment')}`;
  
  return (
    `*नमस्ते ${customerName} जी!*\n\n` +
    `आपके किराना खाते का बकाया बैलेंस *₹${balance.toFixed(2)}* है (${storeName})।\n\n` +
    `कृपया नीचे दिए गए UPI लिंक से भुगतान करें:\n` +
    `${upiLink}\n\n` +
    `धन्यवाद!\n*${storeName}*`
  );
}
```

### 3.2 Customer Loyalty Points Engine
- **Accrual:** Customers earn **1 point per ₹100** spent on fully paid bills.
- **Redemption:** 1 point = ₹1 discount during checkout (capped at 20% of cart total).
- Points balance tracked directly on `CustomerKhata.loyaltyPoints`.

---

## 4. Security Rules & Monorepo Updates

### Firestore Rules (`firestore.rules`)
```
match /stores/{storeId}/suppliers/{supplierId} {
  allow read, write: if isStoreAccess(storeId);
}

match /stores/{storeId}/purchases/{purchaseId} {
  allow read, create: if isStoreAccess(storeId);
  allow update, delete: if isOwner(storeId);
}

match /stores/{storeId}/galla/{sessionId} {
  allow read, write: if isStoreAccess(storeId);
}
```

---

## 5. Mobile & Desktop Navigation Integration

### Mobile App (`apps/mobile`)
- **Procurement Stack (`src/navigation/PurchaseNavigator.tsx`):**
  - `SupplierListScreen`: Vendor list with contact numbers and pending balance badge.
  - `AddSupplierScreen`: New supplier form (Name, Phone, GSTIN, Type).
  - `CreatePurchaseScreen`: Choice between "📷 Scan Distributor Bill" and "✍️ Manual Entry".
  - `ScanInvoiceScreen`: Camera & gallery picker with on-device OCR preview.
  - `ReviewInvoiceScreen`: Editable table with confidence scores, product auto-matcher dropdown, tax summary, and "Confirm & Inward to Stock" button.
  - `PurchaseDetailScreen`: Archived purchase view.
- **Daily Galla:**
  - Accessible via Settings/Tools tab: Open Galla modal & Close Galla day-end summary.
- **Khata Reminders:**
  - Direct WhatsApp button on `CustomerDetailScreen` triggering `formatWhatsAppUdharReminder`.

### Desktop Dashboard (`apps/dashboard`)
- `/suppliers`: Full supplier management table with purchase history and balances.
- `/purchases`: Purchase invoices list + drag-and-drop Tesseract.js OCR upload modal.
- `/galla`: Day-end settlement ledger and cash discrepancy reports.
- `/analytics`: Gross profit, top-selling items, and dead-stock reports.

---

## 6. Verification & Test Plan

1. **Unit Tests (`packages/shared/src/__tests__/`):**
   - `invoiceOCR.test.ts`: Validate parsing of Parle distributor bill (HSN, pack multipliers, CGST/SGST split, net payable calculation).
   - `galla.test.ts`: Validate expected cash math and surplus/shortage computation.
   - `khataReminder.test.ts`: Validate WhatsApp message encoding and NPCI UPI link format.
2. **Store & Atomic Operations Tests (`apps/mobile/src/__tests__/`):**
   - `purchaseStore.test.ts`: Verify atomic stock increment and supplier balance tracking.
   - `gallaStore.test.ts`: Verify day-end closing math.
3. **End-to-End Live Browser Testing:**
   - Test scanning/uploading invoice, verifying extracted rows, editing line items, and confirming atomic stock inwarding at `http://localhost:8081`.
