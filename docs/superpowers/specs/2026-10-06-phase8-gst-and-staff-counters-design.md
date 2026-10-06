# Kirana Pro — Phase 8: GST Tax Invoicing, GSTR-1 Filing & Multi-Counter Staff PIN Management

## Overview

Phase 8 elevates Kirana Pro from a single-user store ledger into an enterprise-grade retail POS with full compliance for Indian taxation and multi-staff operations.

### Key Capabilities
1. **GST Compliance & GSTR-1 Export**:
   - B2B vs B2C invoice classification with customer GSTIN validation (15-character standard).
   - Real-time tax breakdown (Taxable, CGST, SGST, IGST).
   - HSN/SAC summary aggregation across products sold.
   - Government-compliant GSTR-1 JSON export (ready for direct upload to GST portal).
   - CA/Accountant monthly tax report export (CSV format with full invoice-level tax breakdown).

2. **Multi-Counter POS & Staff PIN Access**:
   - Staff roles: `Owner` (full access), `Manager` (catalog + stock + reports), `Cashier` (billing & scanning only).
   - Fast 4-digit PIN authentication modal with tactile numeric keypad.
   - Counter assignment (Counter 1, Counter 2, etc.) with independent shift sessions.
   - Cashier shift open/close with opening cash, cash sales, cash tendered, and closing drawer settlement (cash handover tracking).
   - Header badge with 1-tap lock and cashier switch.

---

## 1. Data Models (`@kirana-pro/shared`)

### 1.1 GST Types (`packages/shared/src/types/gst.ts`)
```typescript
export interface HsnSummaryItem {
  hsnCode: string;
  description: string;
  uqc: string;             // Unit Quantity Code (KGS, NOS, PAC, etc.)
  totalQty: number;
  totalValue: number;
  taxableValue: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
}

export interface GSTR1B2BInvoice {
  ctin: string;            // Customer GSTIN
  inv: Array<{
    inum: string;          // Invoice Number
    idt: string;           // Invoice Date (DD-MM-YYYY)
    val: number;           // Total Invoice Value
    pos: string;           // Place of Supply state code (e.g. "07", "27")
    itms: Array<{
      num: number;
      itm_det: {
        rt: number;        // Tax Rate (0, 5, 12, 18, 28)
        txval: number;     // Taxable Value
        iamt: number;      // IGST
        camt: number;      // CGST
        samt: number;      // SGST
        csamt: number;     // Cess
      };
    }>;
  }>;
}

export interface GSTR1B2CSItem {
  sply_ty: 'INTER' | 'INTRA';
  rt: number;
  txval: number;
  camt: number;
  samt: number;
  iamt: number;
  csamt: number;
}

export interface GSTR1ExportFormat {
  gstin: string;
  fp: string;              // Financial Period (MMYYYY, e.g. "102026")
  gt: number;              // Gross Turnover
  cur_gt: number;
  b2b: GSTR1B2BInvoice[];
  b2cs: GSTR1B2CSItem[];
  hsn: { data: HsnSummaryItem[] };
  doc_issue: {
    doc_det: Array<{
      doc_num: number;
      doc_typ: string;
      docs: Array<{ from: string; to: string; totnum: number; canc: number; net_issue: number }>;
    }>;
  };
}
```

### 1.2 Staff & Counter Types (`packages/shared/src/types/staff.ts`)
```typescript
export type StaffRole = 'owner' | 'manager' | 'cashier';

export interface StaffMember {
  id: string;
  storeId: string;
  name: string;
  phone?: string;
  role: StaffRole;
  pin: string;             // 4-digit numeric PIN
  counterAssigned?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CounterSession {
  id: string;
  storeId: string;
  counterNumber: number;
  staffId: string;
  staffName: string;
  role: StaffRole;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  cashSales: number;
  upiSales: number;
  creditSales: number;
  invoiceCount: number;
  variance?: number;       // Difference between expected cash and closing cash
  notes?: string;
  isClosed: boolean;
}
```

---

## 2. Shared Utilities (`@kirana-pro/shared`)
- `isValidGSTIN(gstin: string): boolean`: Validates 15-character GSTIN.
- `generateGSTR1JSON(store, invoices, period)`: Generates valid GSTR-1 JSON.
- `generateGSTTaxSummary(invoices)`: Generates taxable & tax sums grouped by rate and HSN.
- `exportGSTReportCSV(invoices)`: Creates standard CSV spreadsheet string for accountants.

---

## 3. Mobile UI & Services (`apps/mobile`)

1. **Staff Store (`src/store/staffStore.ts`)**:
   - Current active staff (`StaffMember | null`).
   - Active counter session (`CounterSession | null`).
   - Staff directory & counter persistence.
   - Role permission guard: `hasPermission(role, action)`.

2. **PIN Lock & Keypad (`src/components/staff/StaffPINLockModal.tsx`)**:
   - Modern numeric keypad with tactile vibrations.
   - Fast counter cashier switching.
   - Lock on idle or shift change.

3. **Counter Shift Register (`src/screens/staff/CounterShiftScreen.tsx`)**:
   - Start shift with opening drawer float (e.g. ₹1,000 cash).
   - Real-time tally of bills issued by this counter cashier.
   - Close shift & cash handover verification.

4. **Staff Management (`src/screens/staff/StaffManagementScreen.tsx`)**:
   - Add new cashiers/managers with custom names and 4-digit PINs.
   - List staff with active status and quick PIN reset.

5. **GST Tax & GSTR-1 Portal (`src/screens/gst/GSTReportScreen.tsx`)**:
   - Period selector (This Month, Last Month, Quarter, Financial Year).
   - Tax summary cards (CGST, SGST, IGST, Taxable).
   - B2B vs B2C breakdown with customer GSTIN tagging.
   - HSN summary table.
   - 1-tap **Download GSTR-1 JSON** & 1-tap **Share CSV with CA / Accountant**.

6. **B2B Billing Toggle in Checkout**:
   - Option in `CheckoutModal.tsx` to add Buyer GSTIN for B2B input tax credit bills.
