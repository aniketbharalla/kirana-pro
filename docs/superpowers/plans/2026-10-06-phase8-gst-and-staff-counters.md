# Implementation Plan: Phase 8 — GST Tax Invoicing, GSTR-1 Filing & Multi-Counter Staff PIN Management

## Overview
Phase 8 implements:
1. **GST Compliance & GSTR-1 Filing Subsystem**:
   - 15-char GSTIN validation and B2B invoice tagging.
   - HSN summary calculations and GSTR-1 JSON generator.
   - CA Accountant CSV export generator.
   - `GSTReportScreen.tsx` with period filters, tax cards, HSN breakdown, and GSTR-1 export.
   - B2B customer GSTIN toggle in `CheckoutModal.tsx`.

2. **Multi-Counter & Staff PIN Subsystem**:
   - Staff member data model (Owner, Manager, Cashier) with 4-digit PIN authentication.
   - Counter shift session management (open shift float, track cashier billing, close shift variance).
   - `staffStore.ts` with local persistence and role permission checker.
   - `StaffPINLockModal.tsx` numeric keypad for counter lock/unlock.
   - `StaffManagementScreen.tsx` for adding and managing cashier staff.
   - `CounterShiftScreen.tsx` for drawer handover and shift settlements.
   - Header status badge across app showing active counter cashier.

---

## Tasks & Files

### Task 1: Shared Package Models & Tax Utilities (`packages/shared`)
- **[NEW]** `packages/shared/src/types/gst.ts`: GSTIN, HsnSummaryItem, GSTR1ExportFormat, GSTPeriod.
- **[NEW]** `packages/shared/src/types/staff.ts`: StaffRole, StaffMember, CounterSession.
- **[NEW]** `packages/shared/src/utils/gstr1.ts`: `isValidGSTIN`, `generateGSTTaxSummary`, `generateGSTR1JSON`, `exportGSTReportCSV`.
- **[EDIT]** `packages/shared/src/types/invoice.ts`: Add optional `customerGstin`, `isB2B`, and `counterNumber`, `staffId` to `Invoice`.
- **[EDIT]** `packages/shared/src/index.ts`: Export new types and utilities.
- **[NEW]** `packages/shared/src/__tests__/gstr1.test.ts`: Verify GSTIN validation, GSTR-1 JSON structure, and CSV export.

### Task 2: Staff Store & PIN Authentication (`apps/mobile`)
- **[NEW]** `apps/mobile/src/store/staffStore.ts`: Zustand store for active staff, active counter session, staff directory, local persistence, and PIN validation.
- **[NEW]** `apps/mobile/src/components/staff/StaffPINLockModal.tsx`: Tactile numeric keypad for unlocking / switching counter cashiers.
- **[NEW]** `apps/mobile/src/__tests__/staffStore.test.ts`: Unit tests for PIN auth, permissions, counter shifts.

### Task 3: Counter Shift & Staff Management UI (`apps/mobile`)
- **[NEW]** `apps/mobile/src/screens/staff/StaffManagementScreen.tsx`: Add cashier, set PIN, view active staff.
- **[NEW]** `apps/mobile/src/screens/staff/CounterShiftScreen.tsx`: Shift open (float), live shift sales tally, shift close (cash handover).
- **[NEW]** `apps/mobile/src/components/staff/CounterHeaderPill.tsx`: Tap-to-switch cashier or lock counter pill in header.

### Task 4: GST Report & GSTR-1 Export Screen (`apps/mobile`)
- **[NEW]** `apps/mobile/src/screens/gst/GSTReportScreen.tsx`: Period selector, CGST/SGST/IGST breakdown, HSN table, GSTR-1 JSON export, CSV export.
- **[EDIT]** `apps/mobile/src/components/bills/CheckoutModal.tsx`: Add optional "B2B Bill (Customer GSTIN)" input toggle.
- **[EDIT]** `apps/mobile/src/screens/profile/ProfileScreen.tsx`: Add navigation tiles to GST Reports and Staff Management.
- **[NEW]** `apps/mobile/src/__tests__/gstScreen.test.ts`: Verify tax metrics calculations and HSN summary.

### Task 5: Verification & Full Suite Pass
- Run test suites across `packages/shared` and `apps/mobile`.
- Verify TypeScript compilation and runtime behavior.
