# Kirana Pro — Phase 2: POS Billing, Udhar Khata Ledger & Thermal Receipts

## Overview

Phase 2 builds the core transaction engine of Kirana Pro — enabling high-speed Point of Sale (POS) checkout on both mobile and desktop, customer credit ledger (Khata / Udhar), instant UPI QR code generation, 58mm thermal receipt printing, and WhatsApp bill sharing.

**Target User:** Indian Kirana store owner and counter staff doing 100–500 transactions daily.
**Performance Goal:** Complete an average 5-item bill in under 15 seconds.
**Constraint:** 100% Free Tier (Firebase Firestore free tier, Open Food Facts free catalog, standard client-side UPI generation, zero paid SMS gateways).

---

## 1. Architecture & Data Models

### 1.1 Data Models (`@kirana-pro/shared`)

#### Invoice (`/stores/{storeId}/invoices/{invoiceId}`)
```typescript
export interface InvoiceItem {
  productId: string;
  name: string;
  nameHindi?: string;
  unit: string;
  isLoose: boolean;
  quantity: number;
  unitPrice: number;
  discount: number;       // Discount in INR per item
  gstRate: number;        // 0, 5, 12, 18, 28
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;  // e.g. "INV-2026-0001"
  storeId: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMode: 'cash' | 'upi' | 'credit' | 'split';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  amountDue: number;
  customer?: {
    id?: string;
    name: string;
    phoneNumber?: string;
  };
  cashTendered?: number;
  changeDue?: number;
  createdAt: string;
  createdBy: string;
}
```

#### Customer Khata (`/stores/{storeId}/customers/{customerId}`)
```typescript
export interface CustomerKhata {
  id: string;
  storeId: string;
  name: string;
  phoneNumber: string;
  address?: string;
  currentBalance: number;  // Positive means customer owes dukaan
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KhataTransaction {
  id: string;
  storeId: string;
  customerId: string;
  type: 'debit' | 'credit';  // debit = goods taken on udhar (+ balance); credit = payment received (- balance)
  amount: number;
  invoiceId?: string;
  note?: string;
  performedBy: string;
  createdAt: string;
}
```

#### GST Summary Helper
```typescript
export interface GSTBracketSummary {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}
```

---

## 2. Core POS Checkout Engine

### 2.1 Quick Cart & Pricing Engine
- Supports item addition via:
  1. **Barcode scan**: Instant 1-tap add or increment.
  2. **Product catalog search**: Keyword & Hindi name match.
  3. **Taraju smart bridge**: Calculated weight (e.g. 140g rice @ ₹50/kg = ₹7) sends directly to the current active cart.
- Immediate subtotal, tax breakdown, and item-level discounts.
- Live stock checks with warnings if selling quantity exceeds current inventory.

### 2.2 Payment Methods
1. **Cash (नकदी)**:
   - Built-in change calculator: Quick notes (`₹100`, `₹200`, `₹500`, `₹2000`).
   - Computes `changeDue = cashTendered - grandTotal`.
2. **UPI QR Code (यूपीआई क्यूआर)**:
   - Generates standard NPCI UPI Intent URI:
     `upi://pay?pa={storeUpiId}&pn={storeName}&am={grandTotal}&cu=INR&tn=Bill-{invoiceNumber}`
   - Renders QR code on screen for instant scanning with PhonePe, Google Pay, Paytm, or BHIM.
3. **Khata / Udhar (उधार खाता)**:
   - Selects an existing customer or quick-adds a new customer with Name and Mobile number.
   - Automatically debits customer ledger and sets `amountDue = grandTotal`.

### 2.3 Atomic Stock Invalidation
- When a bill is finalized:
  - Deducts `currentStock` for every packaged and loose item via Firestore atomic transaction (`recordStockMovement(out, sale)`).
  - Preserves full audit log of stock movements.

---

## 3. Receipts & Customer Communication

### 3.1 58mm Thermal Print Layout
- Monospaced printable layout formatted for 58mm / 2-inch and 80mm / 3-inch thermal printers:
  - Header: Store Name, Address, GSTIN, Phone, Date & Time, Invoice Number.
  - Body: Item, Qty x Rate, Total.
  - Tax Summary: CGST / SGST breakdown.
  - Footer: "धन्यवाद! फिर पधारें" (Thank you, visit again).

### 3.2 WhatsApp Bill Sharing
- Formats structured bill message:
  ```text
  🏪 *Shree Ganesh Kirana Store*
  🧾 Bill: INV-2026-0042
  📅 Date: 05 Oct 2026, 07:45 PM
  --------------------------------
  1. Aashirvaad Atta 5kg  x1 = ₹250
  2. Tata Salt 1kg        x2 = ₹56
  3. Loose Basmati (250g) x1 = ₹12.50
  --------------------------------
  💰 *Total Amount: ₹318.50*
  💳 Paid via: UPI
  --------------------------------
  धन्यवाद! फिर पधारें 🙏
  ```
- Opens WhatsApp Web or WhatsApp app with pre-filled message using standard `https://wa.me/91{phoneNumber}?text={encodedText}` URL scheme.

---

## 4. Desktop Dashboard Billing Hub

- **`/bills` Page**:
  - Filterable by date, payment mode (Cash, UPI, Khata), and customer.
  - Searchable by invoice number or product name.
  - "View / Print Bill" modal for desktop thermal printing.
- **`/khata` Page**:
  - Customer directory with live search.
  - Total pending market credit (कुल उधारी) summary card.
  - Detailed customer transaction history statement.
- **Home Dashboard KPIs**:
  - Today's Sales (₹)
  - Today's Cash vs UPI vs Udhar breakdown.
  - Bills count today.
