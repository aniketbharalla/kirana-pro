# MasterX UI Kit & Sky Frosted Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Kirana Pro desktop dashboard (`apps/dashboard`) with a unified MasterX UI Kit design system and replace the login portal with the daylight sky frosted glass experience while preserving 100% of Firebase authentication, real-time Firestore sync, and POS billing logic.

**Architecture:** Establish MasterX design tokens in `globals.css` (Plus Jakarta Sans, Inter tabular typography, modern slate canvas `#F8FAFC`, card surface `#FFFFFF`, and Electric Indigo/Emerald accents). Rebuild `login/page.tsx` into a celestial sky frosted portal with rounded pill inputs and social auth buttons. Refactor `Sidebar.tsx` and `DashboardShell.tsx` into the crisp MasterX navigation shell, then update `page.tsx`, `StatsGrid.tsx`, `ProductsTable.tsx`, and `pos/page.tsx`.

**Tech Stack:** Next.js 14 App Router, TypeScript, React 18, Firebase Auth & Firestore, CSS Variables & Design Tokens.

**Spec:** [docs/superpowers/specs/2026-10-10-masterx-ui-redesign-design.md](file:///Users/aniketjain/Projects/kirana-pro/docs/superpowers/specs/2026-10-10-masterx-ui-redesign-design.md)

## Global Constraints
- Typography: Plus Jakarta Sans (headings, counters), Inter (body, tabular numbers).
- Primary background: `#F8FAFC`, Surface: `#FFFFFF`, Border: `#E2E8F0`, Primary Indigo: `#4F46E5`, Emerald: `#10B981`.
- Preserve all existing auth routines: `signInWithGoogle`, `sendPhoneOtp`, `verifyPhoneOtp`, `staffSignIn`, `startStaffShift`.
- Zero broken routes: `npm run build` in `apps/dashboard` must compile all 19 routes cleanly.

## Review Focus
- Phone OTP input formatting and reCAPTCHA verifier lifecycle must remain intact.
- Staff PIN verification and Shift Counter register must remain fully functional.
- StoreId resolution (`store_${user.uid}`) and live Firestore subscriptions must not be altered.
- Responsive container sizing for wide desktop POS displays (minimum 980px viewport).
- Active route detection in Sidebar must accurately highlight the current pathname.

---

### Task 1: Design Tokens & Typography in `globals.css`

**Files:**
- Modify: `apps/dashboard/src/app/globals.css`

**Interfaces:**
- Consumes: Google Fonts (`Plus Jakarta Sans`, `Inter`)
- Produces: MasterX CSS variables (`--mx-bg`, `--mx-surface`, `--mx-border`, `--mx-primary`, `--mx-emerald`, `--mx-text-primary`, `--mx-shadow-card`, etc.)

- [ ] **Step 1: Update typography import and define MasterX design tokens**
  Define `--font-display`, `--font-body`, canvas backgrounds, surfaces, borders, shadows, and utility classes (`.mx-card`, `.mx-pill`, `.mx-display`).
- [ ] **Step 2: Verify CSS parsing with Next.js**
  Run: `npm run build --workspace=dashboard`
  Expected: Build succeeds without CSS syntax errors.
- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/src/app/globals.css
  git commit -m "feat(dashboard): define MasterX design system tokens and typography"
  ```

---

### Task 2: Daylight Sky Frosted Portal in `login/page.tsx`

**Files:**
- Modify: `apps/dashboard/src/app/login/page.tsx`

**Interfaces:**
- Consumes: Firebase Auth functions (`signInWithGoogle`, `sendPhoneOtp`, `verifyPhoneOtp`), `useAuth` (`staffSignIn`, `startStaffShift`)
- Produces: Atmospheric celestial sky backdrop, floating frosted card, dark charcoal CTA, social auth buttons, smooth persona toggles.

- [ ] **Step 1: Implement sky background, orbital rings, and brand header badge**
  Add background styling matching the reference image (`#A7CEEE` to `#EDF6FC` gradient, concentric white circular lines, top-left brand chip `🏪 Kirana Pro`).
- [ ] **Step 2: Build the frosted glass container and persona switch**
  Build 460px card with `backdrop-filter: blur(32px)`, 32px border radius, top icon chip (`➔]`), and clean persona toggle ("👑 Store Owner" / "🧑‍💼 Staff & Cashier").
- [ ] **Step 3: Restyle inputs, charcoal CTA button, and social pills**
  Pill inputs with prefix icons, `#18181B` "Get Started" / "Get OTP" action button, dotted divider, and social buttons (Google, Phone OTP, Staff PIN).
- [ ] **Step 4: Verify login page renders and compiles**
  Run: `npm run build --workspace=dashboard`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add apps/dashboard/src/app/login/page.tsx
  git commit -m "feat(dashboard): revamp login portal to daylight sky frosted glass design"
  ```

---

### Task 3: MasterX Sidebar & Header Navigation Shell

**Files:**
- Modify: `apps/dashboard/src/components/Sidebar.tsx`
- Modify: `apps/dashboard/src/components/DashboardShell.tsx`

**Interfaces:**
- Consumes: `usePathname`, `useAuth`
- Produces: Crisp white MasterX sidebar with active indigo pills, categorized navigation, sticky elevated header with store and staff status badges.

- [ ] **Step 1: Update `Sidebar.tsx` to MasterX styling**
  White surface (`#FFFFFF`), border divider (`#E2E8F0`), active link state pill (`#EEF2FF` background, `#4F46E5` label, left indicator bar), grouped navigation sections, and footer status card.
- [ ] **Step 2: Update `DashboardShell.tsx` top header**
  Sticky white header, store name in `Plus Jakarta Sans`, active store badge, F4 POS quick launch button, user initials chip, and sign out button.
- [ ] **Step 3: Verify build**
  Run: `npm run build --workspace=dashboard`
  Expected: PASS
- [ ] **Step 4: Commit**
  ```bash
  git add apps/dashboard/src/components/Sidebar.tsx apps/dashboard/src/components/DashboardShell.tsx
  git commit -m "feat(dashboard): overhaul navigation shell and sidebar with MasterX aesthetics"
  ```

---

### Task 4: MasterX KPI Stats Grid & Command Center

**Files:**
- Modify: `apps/dashboard/src/app/page.tsx`
- Modify: `apps/dashboard/src/components/StatsGrid.tsx`

**Interfaces:**
- Consumes: `Product[]`, `StockMovement[]` from `storeService`
- Produces: Modern MasterX Hero Command Card, 4 elevated KPI stat cards with colored icon chips, bold metric typography, and live inventory status chips.

- [ ] **Step 1: Update `StatsGrid.tsx` to MasterX metric cards**
  White cards, subtle borders, soft-tinted icon chips (Indigo, Amber, Rose, Emerald), 28px `Plus Jakarta Sans` metric values, and status pill badges.
- [ ] **Step 2: Update `page.tsx` Hero Command Banner**
  MasterX hero card with clean typography and updated action buttons (`⚡ POS Quick Billing (F4)`, `➕ Add Product`, `⚡ Inward via OCR`).
- [ ] **Step 3: Verify build**
  Run: `npm run build --workspace=dashboard`
  Expected: PASS
- [ ] **Step 4: Commit**
  ```bash
  git add apps/dashboard/src/app/page.tsx apps/dashboard/src/components/StatsGrid.tsx
  git commit -m "feat(dashboard): update overview command center and KPI stats grid"
  ```

---

### Task 5: MasterX High-Density Products Catalog Table

**Files:**
- Modify: `apps/dashboard/src/components/ProductsTable.tsx`

**Interfaces:**
- Consumes: `Product[]`
- Produces: MasterX data table with rounded search bar, category chips, `#F8FAFC` uppercase header, alternating row highlights, and stock health chips.

- [ ] **Step 1: Refactor table styles in `ProductsTable.tsx`**
  Apply MasterX table styling: modern search toolbar, subtle row dividers, status pills (In Stock, Low Stock, Out of Stock), and clean action buttons.
- [ ] **Step 2: Verify build**
  Run: `npm run build --workspace=dashboard`
  Expected: PASS
- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/src/components/ProductsTable.tsx
  git commit -m "feat(dashboard): restyle products catalog table with MasterX high-density layout"
  ```

---

### Task 6: MasterX POS Quick Billing Layout Refinement

**Files:**
- Modify: `apps/dashboard/src/app/pos/page.tsx`

**Interfaces:**
- Consumes: `Product[]`, POS cart state, Taraju scale calculator
- Produces: High-density POS interface with MasterX colors, elevated white billing cart, GST breakdown, and receipt actions.

- [ ] **Step 1: Update POS billing screen colors and card styling**
  Align product search cards, cart item list, scale calculator, payment mode buttons, and invoice total cards with MasterX tokens.
- [ ] **Step 2: Verify build**
  Run: `npm run build --workspace=dashboard`
  Expected: PASS
- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/src/app/pos/page.tsx
  git commit -m "feat(dashboard): refine POS quick billing layout to match MasterX UI Kit"
  ```

---

### Task 7: End-to-End Build Verification, Visual Validation & Regression Testing

**Files:**
- Verify: Full dashboard workspace

- [ ] **Step 1: Run complete build**
  Run: `npm run build --workspace=dashboard`
  Expected: 19/19 routes compiled successfully with zero TypeScript or linting errors.
- [ ] **Step 2: Run test suites**
  Run: `npm test`
  Expected: All unit and integration test suites pass.
- [ ] **Step 3: Browser visual validation**
  Inspect `http://localhost:3000/login` and `http://localhost:3000/` to confirm visual fidelity with MasterX and sky frosted glass references.
- [ ] **Step 4: Final commit & cleanup**
  ```bash
  git commit --allow-empty -m "chore(dashboard): complete MasterX UI Kit and Sky Frosted Portal revamp"
  ```
