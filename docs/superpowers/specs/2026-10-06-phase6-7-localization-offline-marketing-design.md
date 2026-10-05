# Design Spec: Phase 6 + 7 Combined – Multi-Language Localization, Offline-First Sync & Customer WhatsApp Marketing

## 1. Overview & Purpose
Kirana store owners across India operate in varied linguistic environments (Hindi, Hinglish, English) and frequently face intermittent internet connectivity in dense bazaars. Furthermore, collecting customer Khata debts and promoting festival ration deals is primarily conducted through WhatsApp.

This phase provides:
1. **Multi-Language Engine (`i18n`)**: Seamless 1-tap toggle between **Hindi (हिंदी)**, **Hinglish (Dukaan Vernacular)**, and **English**.
2. **Offline-First Resilience**: An offline action queue that records billing and stock events locally without network latency and auto-syncs to Firestore when internet is restored.
3. **WhatsApp Marketing & Khata UPI Collection**: Formatted debt collection notices with instant UPI payment deep links (`upi://pay?pa=...`) and shareable festival grocery offer templates.

---

## 2. Core Architecture & Modules

### A. Localization Subsystem (`packages/shared/src/i18n/` or `apps/mobile/src/i18n/`)
- **`useLanguageStore`**:
  - Selected language: `'hi' | 'hinglish' | 'en'`.
  - Stored in persistent storage.
  - `t(key, params)` translation lookup with fallback to English.
- **Translation Dictionaries**:
  - Covers: Home, Billing, Products, Stock Inwarding, Khata, Galla, Wholesalers, Analytics, Settings.
  - Distinct translations for:
    - `hi`: "आज की कुल बिक्री", "गल्ला रोकड़", "उधार खाता", "थोक खरीददारी".
    - `hinglish`: "Aaj Ki Total Bikri", "Galla Cash", "Udhar Khata", "Wholesale Stock Inward".
    - `en`: "Today's Gross Sales", "Galla Drawer Cash", "Customer Khata", "Wholesale Procurement".

### B. Offline-First Sync Engine (`apps/mobile/src/services/offlineSync.ts`)
- **Action Queue Data Structure**:
  ```ts
  export interface OfflineAction {
    id: string;
    type: 'CREATE_INVOICE' | 'UPDATE_STOCK' | 'RECORD_KHATA_PAYMENT' | 'RECORD_PURCHASE';
    payload: any;
    timestamp: string;
    retryCount: number;
  }
  ```
- **Sync Life-Cycle**:
  - `enqueueOfflineAction(action)`: Saves action to local storage.
  - `processOfflineQueue()`: Iterates pending actions and commits them via Firestore batch/runTransaction.
  - Status indicator component (`SyncStatusBanner`):
    - 🟢 `All data synced to cloud`
    - 🟡 `X operations saved offline (Tap to sync)`

### C. WhatsApp Khata UPI Collection & Customer Marketing (`apps/mobile/src/services/marketing.ts`)
- **Khata UPI Reminder Link Generator**:
  Constructs UPI URI compliant with NPCI standards:
  $$\text{upi://pay?pa=merchant@upi\&pn=StoreName\&am=Amount\&cu=INR\&tn=BillPayment}$$
  Embedded into WhatsApp reminder message with 1 tap.
- **Festival Grocery Offers Generator**:
  - Pre-packaged templates: "Monthly Rashan Package (महीने का राशन)", "Festival Sweet & Snacks Bundle", "Weekend Discount".
  - Formatted WhatsApp broadcast text with item breakdown and store contact details.
- **Digital Dukaan Catalog Link**:
  - Summarizes top in-stock products with MRP and contact details for customers to order via WhatsApp chat.

---

## 3. User Interface Screens & Components

1. **`LanguageSwitchModal.tsx` & Header Quick Toggle:**
   - 1-tap quick switcher flag/pill in top navigation (`🌐 English / हिंदी / Hinglish`).
2. **`MarketingScreen.tsx` (Dukaan Promotion & Khata Recovery Hub):**
   - **Khata Collection Fast Actions**: List of customers with overdue balances with instant **"📲 Send WhatsApp UPI Reminder"** button.
   - **Festival & Offers Generator**: Select offer type $\rightarrow$ customize discount or free gift $\rightarrow$ 1-tap WhatsApp broadcast.
   - **Digital Storefront Summary**: Copy or share Dukaan menu list directly to customer WhatsApp groups.
3. **`SyncStatusBanner.tsx`**:
   - Clean, lightweight status bar showing cloud sync state and offline pending counter.

---

## 4. Verification Plan
- Unit tests for translation resolution (`i18n.test.ts`).
- Unit tests for offline queue enqueue/dequeue/retry logic (`offlineSync.test.ts`).
- Unit tests for UPI payment link generation and marketing text formatting (`marketing.test.ts`).
- Visual testing in browser (`http://localhost:8081`).
