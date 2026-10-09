# Design Specification: MasterX UI Kit & Sky Frosted Portal Redesign

## 1. Overview & Context

This specification outlines the complete visual redesign of the Kirana Pro desktop dashboard (`apps/dashboard`), transitioning from ad-hoc styling to a unified design system inspired by the **MasterX Dashboard UI Kit** and a daylight **Sky Frosted Glass** landing and authentication portal.

### References
- **MasterX Dashboard UI Kit**: `https://www.figma.com/design/52aeqWwOjdnH6oSvGNgFXE/MasterX-Dashboard-UI-Kits--Community-?node-id=1235-3630&t=KMgcOVA0DwPjkAQ1-0`
- **Landing / Auth Reference Image**: Daylight celestial atmosphere, cumulus cloud horizon, concentric halo rings, floating rounded frosted glass card (`32px` radius), dark charcoal pill action CTA (`#18181B`), rounded pill inputs with icons, and social auth cards.

---

## 2. Design System Tokens & Typography (`globals.css`)

### 2.1 Typography Hierarchy
- **Headings & Metric Numbers**: `Plus Jakarta Sans` (`600`, `700`, `800`) with tighter tracking (`letter-spacing: -0.025em`).
- **Body & Data Tables**: `Inter` (`400`, `500`, `600`) with `font-variant-numeric: tabular-nums` for precise alignment of barcodes, quantities, and Indian Rupee (₹) amounts.

### 2.2 Color Tokens
| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--mx-bg` | `#F8FAFC` | Primary light canvas background |
| `--mx-surface` | `#FFFFFF` | Card, container, and sidebar surface |
| `--mx-surface-subtle` | `#F1F5F9` | Secondary card headers and toolbar backgrounds |
| `--mx-border` | `#E2E8F0` | Subtle hairline container divider |
| `--mx-border-focus` | `#6366F1` | Active input ring |
| `--mx-primary` | `#4F46E5` | Electric Indigo primary accent |
| `--mx-primary-hover` | `#4338CA` | Indigo hover state |
| `--mx-primary-tint` | `#EEF2FF` | Indigo soft pill background |
| `--mx-emerald` | `#10B981` | POS and live revenue green |
| `--mx-emerald-hover` | `#059669` | Emerald hover state |
| `--mx-emerald-tint` | `#ECFDF5` | In-stock and completed transaction pill |
| `--mx-amber` | `#F59E0B` | Low stock and pending caution pill |
| `--mx-amber-tint` | `#FFFBEB` | Soft warning background |
| `--mx-rose` | `#EF4444` | Out of stock and destructive actions |
| `--mx-rose-tint` | `#FEF2F2` | Critical alert background |
| `--mx-text-primary` | `#0F172A` | Deep Slate high-contrast titles |
| `--mx-text-secondary` | `#475569` | Secondary labels and body copy |
| `--mx-text-muted` | `#94A3B8` | Metadata, helper texts, table captions |

### 2.3 Elevations & Radii
- **Subtle Card Shadow**: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
- **Hover / Elevated Card Shadow**: `0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)`
- **Floating Modal Shadow**: `0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`
- **Radii**: Card `16px` to `20px`, Inputs `12px` to `14px`, Auth Modal `32px`, Badges `9999px` (full pill).

---

## 3. Component Architecture & Transformations

### 3.1 Landing & Login Portal (`apps/dashboard/src/app/login/page.tsx`)
- **Atmospheric Background**:
  - CSS celestial sky gradient: `linear-gradient(180deg, #A7CEEE 0%, #D8EBF8 50%, #EDF6FC 100%)`.
  - Cloud SVG / ambient cumulus layering positioned along bottom viewport.
  - Concentric white orbital rings radiating behind the central card.
- **Top Brand Pill**:
  - Dark floating badge at top-left: `🏪 Kirana Pro` with subtle translucent border.
- **Frosted Glass Container**:
  - `backdrop-filter: blur(32px) saturate(180%)`.
  - Multi-tier elevation drop shadow with faint indigo ambient glow.
  - Entrance icon chip (`➔]`) centered at the top.
  - Persona switch pill: Store Owner (मालिक) vs Staff & Cashier (कैशियर).
  - Pill input fields with soft slate fill (`rgba(241, 245, 249, 0.85)`), border hairlines, and prefix icons.
  - Dark Charcoal CTA button: `#18181B` with smooth hover lift and active press micro-animation.
  - Dotted divider and social authentication pill buttons (Google Sign-In, Phone OTP, Staff PIN).
  - Staff counter register activation card with Counter 1/2/3 selection pills and opening cash float input.
- **Logic Invariance**: Retains 100% of Firebase Phone OTP reCAPTCHA verifier, Google popup auth, and Staff PIN verification.

### 3.2 Navigation Shell (`apps/dashboard/src/components/Sidebar.tsx` & `DashboardShell.tsx`)
- **Sidebar**:
  - Solid MasterX crisp white surface (`#FFFFFF`) with border-right (`1px solid #E2E8F0`).
  - Active nav link styling: Soft Indigo pill (`#EEF2FF`) with `#4F46E5` label, bold weight (`700`), and left accent bar.
  - Visual categorization: Sales & POS, Inventory & Catalog, Finance & Operations.
  - Footer card: Live sync status badge (`● Live Sync`), staff shift counter badge or owner name.
- **Top Header**:
  - Sticky white header with store name in `Plus Jakarta Sans`, active store badge, F4 POS quick launch button, user initials chip, and sign out button.

### 3.3 Overview Command Center (`apps/dashboard/src/app/page.tsx` & `StatsGrid.tsx`)
- **Command Hero Card**:
  - MasterX white elevated card with bold typography and quick launch buttons (`⚡ POS Quick Billing (F4)`, `➕ Add Product`, `⚡ Inward via OCR`).
- **KPI Stat Cards (`StatsGrid.tsx`)**:
  - 4 high-density metric cards (Catalog Count, Low Stock, Out of Stock, Loose Grocery).
  - Icon chips with soft pastel color fills (Indigo, Amber, Rose, Emerald).
  - High-impact numeric counters in `Plus Jakarta Sans` (`28px`, `font-weight: 800`).
  - MasterX status pill indicators.

### 3.4 Products Catalog Table (`apps/dashboard/src/components/ProductsTable.tsx`)
- High-density table layout with `#F8FAFC` header, uppercase tracked captions, alternating row hover effects, and stock status pill chips (Green = In Stock, Amber = Low Stock, Red = Out of Stock).
- Action buttons in rounded pills for quick edit, price update, and stock adjustments.

### 3.5 POS Quick Billing (`apps/dashboard/src/app/pos/page.tsx`)
- Refined high-density billing screen aligning barcode scanner search, item lookup catalog, Taraju smart scale calculator, GST summary breakdown, and thermal receipt action to the MasterX clean palette.

---

## 4. Verification & Testing Strategy

1. **Compilation Check**: Run `npm run build` inside `apps/dashboard` to verify clean Next.js App Router compilation with zero TypeScript errors.
2. **Visual Verification**: Inspect `http://localhost:3000/login` in the browser to ensure pixel-perfect fidelity with the sky/clouds and frosted card reference.
3. **Authenticated Shell Verification**: Inspect `http://localhost:3000/` and `http://localhost:3000/products` to verify MasterX sidebar navigation, KPI cards, tables, and typography hierarchy.
4. **Functional Regression Check**: Verify that Google login, Phone OTP input, Staff PIN verification, and POS billing cart additions continue functioning flawlessly.
