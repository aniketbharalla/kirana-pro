# Implementation Plan: Phase 6 + 7 Combined – Multi-Language Localization, Offline-First Sync & Customer WhatsApp Marketing

## User Review Required

> [!IMPORTANT]
> This plan delivers:
> 1. Multi-Language Switcher (Hindi, Hinglish, English) with instantaneous runtime language switching.
> 2. Offline-First Sync Queue for recording invoices/stock movements locally when offline and syncing automatically.
> 3. WhatsApp Khata UPI Collection with instant UPI payment deep links and Customer Festival Offer Marketing.

---

## Proposed Changes

### 1. Multi-Language Subsystem

#### [NEW] [languageStore.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/store/languageStore.ts)
- Manage `language: 'hi' | 'hinglish' | 'en'`.
- `t(key, params)` helper with dictionary lookup and fallback.
- Translation tables for `hi`, `hinglish`, `en`.

#### [NEW] [LanguageSwitchModal.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/components/common/LanguageSwitchModal.tsx)
- Modal allowing 1-tap language switching between English, शुद्ध हिंदी, and हिंग्लिश.

---

### 2. Offline-First Sync Subsystem

#### [NEW] [offlineSync.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/services/offlineSync.ts)
- Local action queue: `enqueueAction`, `getPendingQueue`, `clearPendingQueue`, `processQueue`.
- Automatic offline execution fallback when network write fails.

#### [NEW] [SyncStatusBanner.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/components/common/SyncStatusBanner.tsx)
- Visual banner displaying cloud sync status (🟢 Cloud Synced / 🟡 X Pending Sync).

---

### 3. WhatsApp Marketing & Khata UPI Collection

#### [NEW] [marketing.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/services/marketing.ts)
- `generateUPILink(upiId, merchantName, amount, note)`
- `formatKhataUPIReminder(customerName, storeName, amountDue, upiId)`
- `formatFestivalOfferMessage(storeName, offerTitle, description, items, phone)`
- `formatDigitalCatalogBroadcast(storeName, products, phone)`

#### [NEW] [MarketingScreen.tsx](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/screens/marketing/MarketingScreen.tsx)
- Khata debtors list with instant 1-tap WhatsApp UPI reminder dispatch.
- Festival & Rashan offer broadcast generator.
- Digital storefront catalog sharer.

---

### 4. Unit Test Suite

#### [NEW] [i18n.test.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/__tests__/i18n.test.ts)
- Test language switching, key translation, and fallback resolution.

#### [NEW] [offlineSync.test.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/__tests__/offlineSync.test.ts)
- Test enqueueing, queue retrieval, and processing logic.

#### [NEW] [marketing.test.ts](file:///Users/aniketjain/Projects/kirana-pro/apps/mobile/src/__tests__/marketing.test.ts)
- Test UPI payment URL generation, Khata WhatsApp formatting, and festival offer construction.

---

## Verification Plan

### Automated Tests
```bash
npm --prefix apps/mobile test -- --watchAll=false
```

### Visual Browser Verification
- Open `http://localhost:8081`
- Test language switcher (Switch to Hindi $\rightarrow$ verify navigation and text updates).
- Test Marketing screen (Verify UPI reminder links, festival offer templates, digital catalog).
- Test Sync status indicator.
