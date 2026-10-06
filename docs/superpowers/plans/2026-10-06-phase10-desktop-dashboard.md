# Implementation Plan: Phase 10 — Desktop Web Dashboard Full Parity

## Overview
Phase 10 brings the Next.js 15 desktop dashboard (`apps/dashboard`) to complete parity with the mobile app across GST return filing, business profit analytics charts, cashier counter shift registers, smart reorder forecasting, CSV bulk product catalog import/export, and thermal printer settings.

---

## Tasks

### Task 1: Navigation & Global Shell Updates
- **[EDIT]** `apps/dashboard/src/components/Sidebar.tsx`:
  - Add navigation items for:
    - 🏛️ GST & Tax Returns (`/gst`)
    - 📈 Profit Analytics (`/analytics`)
    - 🧑‍💼 Staff & Counters (`/staff`)
    - 🔄 Smart Reorder (`/reorder`)
    - 🖨️ Hardware & Printers (`/hardware`)
  - Update layout badges and responsive styling.

### Task 2: GST Center & GSTR-1 Return Filing (`apps/dashboard/src/app/gst`)
- **[NEW]** `apps/dashboard/src/app/gst/page.tsx`:
  - Monthly period selector.
  - Tax overview summary cards: Taxable sales, CGST, SGST, IGST, B2B count, B2C total.
  - B2B invoices ledger table with Buyer GSTIN.
  - HSN summary breakdown table.
  - "Download GSTR-1 JSON" (valid government JSON schema via `@kirana-pro/shared`).
  - "Export CA Audit CSV" (instant download for tax accountant).

### Task 3: Profit & Margin Analytics (`apps/dashboard/src/app/analytics`)
- **[NEW]** `apps/dashboard/src/app/analytics/page.tsx`:
  - Financial KPI metric cards: Total Revenue, Total Cost of Goods Sold, Gross Profit, Gross Margin %, Average Basket Value.
  - Interactive SVG revenue vs profit multi-column bar chart.
  - Payment method share chart (Cash vs UPI vs Khata).
  - Category sales & margin distribution breakdown.
  - Time range selector (Today, 7 Days, 30 Days, All Time).

### Task 4: Staff & Cashier Shift Register (`apps/dashboard/src/app/staff`)
- **[NEW]** `apps/dashboard/src/app/staff/page.tsx`:
  - Counter shift register audit table:
    - Shift Date, Cashier Name, Counter #, Opening Float, Cash Sales, UPI Sales, Total Expected Cash, Counted Cash, Discrepancy (Shortage/Overage badge).
  - Staff directory table with roles and 4-digit PIN setup status.

### Task 5: Smart Reorder & Procurement Alerts (`apps/dashboard/src/app/reorder`)
- **[NEW]** `apps/dashboard/src/app/reorder/page.tsx`:
  - Low stock & out of stock alerts.
  - Reorder calculation: stock level, minimum alert threshold, suggested quantity, estimated cost.
  - "📲 Copy WhatsApp PO" button for sending instant purchase orders to wholesale distributors.

### Task 6: Product Catalog CSV Bulk Import & Export (`apps/dashboard/src/app/products`)
- **[EDIT]** `apps/dashboard/src/app/products/page.tsx` & `ProductsTable.tsx`:
  - "📥 Import Products CSV" button + modal with CSV parsing and preview validation.
  - "📤 Export Products CSV" button.
  - "Sample CSV Template" download.

### Task 7: Hardware & Thermal Printer Settings (`apps/dashboard/src/app/hardware`)
- **[NEW]** `apps/dashboard/src/app/hardware/page.tsx`:
  - 58mm / 80mm roll width selector.
  - Connection type selector (System / Bluetooth / USB).
  - Test print receipt generator via browser / ESC/POS.
  - Test cash drawer kick button.

### Task 8: Verification & Suite Pass
- Verify `npm --prefix apps/dashboard run build` builds cleanly.
- Verify `npm --prefix packages/shared test` and `npm --prefix apps/mobile test`.
- Merge and push to `origin/main`.
