# Design Spec: Phase 4 + 5 Combined – Smart Reorder Engine & Dukaan Analytics Dashboard

## 1. Overview & Goal
For Indian Kirana store owners, managing when and how much to restock—and understanding whether the shop is actually profitable each day—is usually done on rough paper estimates. 

This phase delivers two high-impact systems:
1. **Smart Procurement & Reorder Engine**: Analyzes POS sales velocity to predict stock run-out dates, automatically generates reorder recommendations, and provides 1-tap WhatsApp purchase orders directly to suppliers.
2. **Dukaan Profit & Business Analytics Dashboard**: Gives the shopkeeper clear, visual clarity on daily/weekly/monthly sales, gross profit margins, payment breakdowns (Cash vs. UPI vs. Khata), slow-moving dead stock, and GST tax summaries for accounting.

---

## 2. Core User Stories & Workflows

### A. Smart Reorders (Procurement)
- **As a Dukaan Owner**, I want to see which items are running out soon based on how fast they are selling over recent days.
- **As a Dukaan Owner**, I want the app to calculate the suggested reorder batch size (e.g., 24 packets of Maggi) so I don't run out or overstock.
- **As a Dukaan Owner**, I want to generate a formatted WhatsApp purchase order to my distributor (e.g. "Laxmi FMCG Distributors") with 1 click, containing item names, quantities, and delivery notes.

### B. Business Analytics & Profit Reports
- **As a Dukaan Owner**, I want to know my **Net Daily Profit (₹)** and **Profit Margin (%)**, calculated as `Revenue - Cost of Goods Sold (COGS)`.
- **As a Dukaan Owner**, I want to see the split of payments collected: **Cash (Galla)** vs. **UPI** vs. **Khata (Udhar)**.
- **As a Dukaan Owner**, I want to identify my **Top 5 Bestsellers** and **Dead / Slow Stock** so I can stop buying items that don't sell.
- **As a Dukaan Owner**, I want a **GST Breakdown Report** (0%, 5%, 12%, 18%) to easily share monthly numbers with my accountant/CA.

---

## 3. Architecture & Data Model

### Data Entities & Services
1. **`AnalyticsService` (`apps/mobile/src/services/analytics.ts`):**
   - Aggregates invoices from Firestore (`stores/{storeId}/invoices`) across date ranges (Today, Last 7 Days, This Month).
   - Computes:
     - `grossSales`: Sum of all invoice grand totals.
     - `totalCost`: Sum of `(item.quantity * item.purchasePrice)` for all sold items.
     - `netProfit`: `grossSales - totalCost`.
     - `averageOrderValue`: `grossSales / invoiceCount`.
     - `paymentBreakdown`: Total cash, total UPI, total credit (udhar).
     - `topSellingProducts`: Array of top items ranked by units sold and revenue.
     - `gstBreakdown`: Slabs (0%, 5%, 12%, 18%) with taxable values and tax collected.

2. **`ReorderService` (`apps/mobile/src/services/reorder.ts`):**
   - Calculates **Daily Sales Velocity**: Units sold per day over the last 7–14 days.
   - Computes **Days of Stock Remaining**: `currentStock / dailyVelocity`.
   - **Urgency Classification**:
     - `CRITICAL`: $\le 1$ day remaining or already 0 (red).
     - `HIGH`: $\le 3$ days remaining (yellow).
     - `NORMAL`: $> 3$ days remaining (green).
   - **Recommended Order Quantity**: Target buffer of 7–14 days of sales:
     $$\text{Recommended Qty} = \max(0, (\text{dailyVelocity} \times \text{bufferDays}) - \text{currentStock})$$
   - **WhatsApp Order Formatter**:
     Constructs WhatsApp deep link: `whatsapp://send?phone=+91...&text=...` with clean, formatted grocery order list in Hindi/English.

---

## 4. User Interface Architecture

1. **Analytics & Reports Screen (`AnalyticsScreen.tsx`):**
   - **Date Range Selector**: `[ Today ] [ Last 7 Days ] [ This Month ]`
   - **KPI Overview Cards**:
     - Gross Revenue (`₹14,520`)
     - Net Dukaan Profit (`+₹2,680` • `18.5% Margin`)
     - Total Invoices / Customers (`42 orders`)
     - Avg. Bill Size (`₹345`)
   - **Payment Collection Breakdown**:
     - Visual horizontal progress bars: Cash (`₹8,400`), UPI (`₹4,800`), Khata Udhar (`₹1,320`).
   - **Top 5 Bestsellers vs Dead Stock**:
     - Fast moving vs zero sales in last 14 days.
   - **GST Summary Table**:
     - 0%, 5%, 12%, 18% taxable values and CGST/SGST collected.

2. **Smart Reorder Screen / Tab (`SmartReorderScreen.tsx`):**
   - **Urgent Reorder Alert Banner**: Highlights critical items running out in $< 48$ hours.
   - **Reorder List with Velocity Metrics**:
     - Item name, category, and current stock.
     - Sales rate: e.g., `⚡ 6 units / day • Stock runs out in 1.5 days!`.
     - Recommended replenishment quantity with `+` and `-` adjustments.
   - **Distributor / Wholesaler Selection**:
     - Select from saved suppliers (e.g. Ramesh Cash & Carry, Laxmi FMCG).
   - **1-Tap WhatsApp Purchase Order Button**:
     - Generates pre-formatted order message:
       ```
       *Sharma Kirana Store - Purchase Order*
       Date: 06 Oct 2026
       Supplier: Ramesh Wholesale

       Please supply the following items:
       1. Maggi 70g - 24 packets
       2. Tata Salt 1kg - 20 packets
       3. Fortune Oil 1L - 12 packets

       Delivery Address: Shop 4, Main Market.
       Please confirm stock & dispatch.
       ```

---

## 5. Non-Functional & Quality Constraints
- **Zero Paid APIs**: Runs 100% on client-side calculation + Firestore queries; WhatsApp uses native URL schemes.
- **Offline / Local Fallback**: Gracefully calculates analytics on starter dataset and local memory when offline.
- **High Performance**: Computes metrics in $< 50$ms without blocking UI.
- **Test Coverage**: Dedicated Jest unit tests for velocity algorithms, profit calculations, and WhatsApp formatting.

---

## 6. Verification Plan
- Unit tests in `apps/mobile/src/__tests__/analytics.test.ts` and `apps/mobile/src/__tests__/reorder.test.ts`.
- Visual validation in browser at `http://localhost:8081` using `browser_subagent`.
