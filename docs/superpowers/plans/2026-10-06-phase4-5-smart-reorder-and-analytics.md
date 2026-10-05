# Implementation Plan: Phase 4 + 5 Combined – Smart Reorder Engine & Dukaan Analytics

## User Review Required

> [!IMPORTANT]
> This plan covers both Phase 4 (Smart Procurement & Predictive Reorders) and Phase 5 (Dukaan Daily Profit, Payment Split & GST Analytics).
> All logic is 100% free-tier, client-side performant, and includes WhatsApp order dispatching.

---

## Proposed Changes

### 1. Core Logic & Analytics Services

#### [NEW] [analytics.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/services/analytics.ts)
- Compute Gross Revenue, Cost of Goods Sold (COGS), and Net Profit.
- Aggregate payment breakdowns (Cash vs. UPI vs. Khata Udhar).
- Calculate Top 5 Bestsellers and Slow-Moving / Dead Stock.
- Generate GST Tax Slab breakdown (0%, 5%, 12%, 18%) for accounting.

#### [NEW] [reorder.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/services/reorder.ts)
- Calculate daily sales velocity per item from recent bills.
- Estimate days of stock remaining (`currentStock / dailyVelocity`).
- Classify urgency: `CRITICAL` ($\le 1$ day / out), `HIGH` ($\le 3$ days), `NORMAL`.
- Calculate recommended replenishment quantity to reach a 7–14 day buffer.
- Format structured WhatsApp purchase order message with items, quantities, and delivery notes.

---

### 2. Unit Testing Suite

#### [NEW] [analytics.test.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/__tests__/analytics.test.ts)
- Verify revenue, COGS, net profit, margin calculations, and GST slab breakdown.

#### [NEW] [reorder.test.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/__tests__/reorder.test.ts)
- Verify sales velocity, run-out estimation, reorder quantity sizing, and WhatsApp text formatting.

---

### 3. User Interface Screens

#### [NEW] [SmartReorderScreen.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/screens/procurement/SmartReorderScreen.tsx)
- Reorder alert cards for critical items running out.
- Sales velocity metrics and configurable reorder quantities (`+` / `-`).
- Supplier selector (choose from registered suppliers or direct phone input).
- 1-Tap WhatsApp Purchase Order launcher.

#### [NEW] [AnalyticsScreen.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/screens/analytics/AnalyticsScreen.tsx)
- Date range picker (`Today`, `Last 7 Days`, `This Month`).
- Financial KPIs (Gross Sales, Net Profit, Average Ticket Size).
- Visual payment split (Cash in Galla vs UPI vs Khata).
- Bestsellers and Slow-moving stock lists.
- GST Tax Report card.

#### [MODIFY] [PurchaseNavigator.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/navigation/PurchaseNavigator.tsx) & [MainTabNavigator.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/navigation/MainTabNavigator.tsx)
- Add "Smart Reorder" and "Analytics & Reports" routes and accessible entry points.

---

## Verification Plan

### Automated Tests
```bash
npm --prefix apps/mobile test -- --watchAll=false
```

### Manual Browser Verification
- Open `http://localhost:8081`
- Verify **Smart Reorder Screen**: Test sales velocity indicators, run-out warnings, and WhatsApp PO generation.
- Verify **Analytics Screen**: Toggle date ranges, verify revenue, net profit margin, payment breakdown bars, and GST tax summary.
