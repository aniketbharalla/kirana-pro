# Phase 10 Design Spec: Desktop Web Dashboard Full Parity

## Overview
Phase 10 upgrades the Next.js 15 desktop dashboard (`apps/dashboard`) to achieve 100% feature parity with the Kirana Pro mobile application. The desktop dashboard is designed for kirana shop owners ("seth ji" or store managers) to sit at their counter PC/laptop and manage back-office operations: filing GST returns, reviewing daily cashier shift cash settlements, analyzing business profit & margin charts, bulk managing product catalogs via CSV, and managing inventory reorders.

## Target User & Philosophy
- **User**: Kirana owner / back-office manager using a counter laptop, desktop, or tablet browser.
- **Constraints**: 100% free-tier services. Zero paid charting or reporting dependencies. Native SVG/CSS data visualization. Ultra-fast page loads (<1s).

---

## Key Modules to Build

### 1. GST Reports & GSTR-1 Filing Portal (`/gst`)
- **Period Filter**: Current month, previous month, or custom financial quarter (e.g. Oct 2026, Q3 FY26-27).
- **Tax Breakdown Metric Cards**:
  - Total Gross Sales (₹)
  - Taxable Value (₹)
  - Total GST Collected (₹) (with CGST + SGST split)
  - B2B Invoices vs B2C Invoices count
- **B2B Invoices Table**:
  - Filterable list of invoices with Buyer GSTIN, customer name, date, invoice #, taxable value, and GST rate.
- **HSN Summary Table**:
  - Aggregated by HSN code, description, unit (kg/pkt), quantity, taxable value, and tax rate.
- **Export Actions**:
  - 📥 **Download GSTR-1 Portal JSON**: Download standard government JSON format generated via `@kirana-pro/shared` `generateGstr1ReturnJson`.
  - 📊 **Export Accountant CSV**: Download formatted CSV spreadsheet ready for WhatsApping or emailing to the shop's Chartered Accountant (CA).

### 2. Profit & Loss Analytics and Visual Charts (`/analytics`)
- **Financial Health KPIs**:
  - Gross Revenue (₹)
  - Cost of Goods Sold / Procurement Cost (₹)
  - Net Gross Profit (₹)
  - Profit Margin % (e.g. 14.8%)
  - Average Order Value (₹)
- **Visual Trend Charts (Pure SVG / CSS)**:
  - Daily Revenue & Profit Trend (interactive multi-bar/line chart).
  - Payment Mode Breakdown (Cash vs UPI vs Khata pie/bar distribution).
  - Category Margin Breakdown (Flour vs Oil vs Spices vs Snacks vs Loose grains).
- **Date Range Filters**: Today, Last 7 Days, This Month, All Time.

### 3. Staff, Cashiers & Counter Shift Register (`/staff`)
- **Active Shifts & Cash Audit**:
  - Cashier name, Counter number (e.g. Counter 1, Counter 2), Opening float, Cash sales recorded, UPI sales recorded.
  - Expected cash vs Actual closing cash.
  - Cash Discrepancy indicator (🟢 Matched, 🔴 Shortage, 🟡 Surplus).
- **Staff Directory & PIN Management**:
  - Staff list with roles (Owner, Manager, Cashier, Helper).
  - 4-digit PIN status & permissions.

### 4. Smart Reorder & Procurement Alerts (`/reorder`)
- **Stock Depletion Forecasting**:
  - Products with stock below `minStockAlert` or projected to run out within 3 days.
  - Current stock level, daily consumption velocity, suggested reorder pack quantity.
- **Wholesale Order Builder**:
  - Estimated supplier investment needed (₹).
  - Group by primary distributor / category.
  - "📲 Copy WhatsApp PO" button to immediately send formatted order list to mandi / wholesaler.

### 5. Product CSV Bulk Import & Export (`/products`)
- **CSV Import Modal**:
  - Drag-and-drop or select CSV file.
  - Parse headers: name, nameHindi, barcode, category, purchasePrice, sellingPrice, gstRate, unit, currentStock, minStockAlert.
  - Validation preview with error highlighting.
  - Download sample CSV template.
- **CSV Export**:
  - 1-click download of all store products as CSV.

### 6. Hardware & Thermal Printer Hub (`/hardware`)
- **Printer Configuration**:
  - 58mm (32 chars) vs 80mm (48 chars) roll width.
  - Connection type: Web Bluetooth, WebUSB, or System Browser Print.
  - Auto-cut and Cash Drawer kick options.
- **Live Test Actions**:
  - "Print Test Receipt" with store header & formatting.
  - "Trigger Cash Drawer Kick" pulse.

---

## Technical Stack & Architecture
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript.
- **Styling**: Vanilla CSS Modules / Inline typed CSS styles for zero runtime overhead and maximum styling flexibility.
- **Shared Core**: `@kirana-pro/shared` for all types, GSTR-1 builders, ESC/POS formatters, and calculations.
