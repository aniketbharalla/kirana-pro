# Kirana Pro — Phase 9: Hardware Integrations Design Spec

## Overview
Phase 9 integrates physical counter hardware into Kirana Pro:
1. **ESC/POS Thermal Receipt Printers** (Bluetooth, USB, and System print) for 58mm and 80mm roll printers.
2. **Automatic Cash Drawer Kick** triggered via ESC/POS pulses (`ESC p 0 25 250`) on bill completion.
3. **Electronic Weighing Scale (Taraju)** RS-232 / USB / Bluetooth serial scale integration, parsing continuous ASCII weights directly into Taraju and Billing screens.

---

## 1. ESC/POS Command Generator (`@kirana-pro/shared`)

### 1.1 Specifications
- **Paper Roll Widths**:
  - `58mm`: 32 printable characters per line.
  - `80mm`: 48 printable characters per line.
- **Commands**:
  - Init: `[0x1B, 0x40]` (`ESC @`)
  - Center Align: `[0x1B, 0x61, 0x01]` (`ESC a 1`)
  - Left Align: `[0x1B, 0x61, 0x00]` (`ESC a 0`)
  - Right Align: `[0x1B, 0x61, 0x02]` (`ESC a 2`)
  - Bold On: `[0x1B, 0x45, 0x01]` (`ESC E 1`)
  - Bold Off: `[0x1B, 0x45, 0x00]` (`ESC E 0`)
  - Double Size: `[0x1D, 0x21, 0x11]` (`GS ! 0x11`)
  - Normal Size: `[0x1D, 0x21, 0x00]` (`GS ! 0x00`)
  - Cut Paper: `[0x1D, 0x56, 0x41, 0x03]` (`GS V A 3`)
  - Kick Drawer: `[0x1B, 0x70, 0x00, 0x19, 0xFA]` (`ESC p 0 25 250`)

### 1.2 Formatted Receipt Layout
```
================================
     SHARMA KIRANA STORE
   Main Market, Delhi-110006
      GSTIN: 07AABCK1234F1Z5
       Ph: +91 98765 43210
================================
Bill: INV-2026-0042   Date: 06-10-26
Counter: 1            Cashier: Rohan
--------------------------------
ITEM         QTY  RATE    AMOUNT
--------------------------------
Atta 5kg       2   250    500.00
Tata Salt 1kg  3    28     84.00
Chawal Loose 1.5kg  50     75.00
--------------------------------
Subtotal:                 659.00
Tax (CGST+SGST):           24.50
--------------------------------
TOTAL AMOUNT:           ₹659.00
Payment: CASH         Recd: ₹700
Change Due:               ₹41.00
================================
  Scan UPI QR Below to Pay
  [ UPI QR Payload / Text ]
================================
   Dhanyawaad! Phir Padharein!
      Powered by Kirana Pro
================================
```

---

## 2. Digital Weighing Scale (Taraju) Protocol

### 2.1 Scale Output Formats
Standard Indian electronic retail scales (Essae, Phoenix, Eagle, Avery Berkel) send ASCII serial strings at 9600 baud rate:
1. **Essae / Toledo standard**: `ST,GS,+001.250kg\r\n`
2. **Simple ASCII**: `001.250\r\n`
3. **Weight with Tare**: `WT: 001.250 KG  TARE: 000.000 KG\r\n`

### 2.2 Parser Function
`parseScaleWeight(dataStr: string): { weight: number, unit: string, isStable: boolean } | null`
Extracts numeric kilograms/grams and stability flags.

---

## 3. Architecture in `apps/mobile`

1. **Hardware Store (`src/store/hardwareStore.ts`)**:
   - `printerType: '58mm' | '80mm'`
   - `connectionType: 'bluetooth' | 'usb' | 'system'`
   - `printerName?: string`
   - `autoCut: boolean`
   - `autoDrawerKick: boolean`
   - `scaleConnected: boolean`
   - `scaleWeight: number` (live reading in kg)
   - `scaleUnit: 'kg' | 'g'`
   - `isSimulatedScale: boolean`

2. **Printer Service (`src/services/printerService.ts`)**:
   - `generateReceiptBytes(invoice, store, settings): Uint8Array`
   - `printInvoice(invoice, store): Promise<boolean>`
   - `testPrint(store): Promise<boolean>`
   - `kickCashDrawer(): Promise<boolean>`

3. **Scale Service (`src/services/scaleService.ts`)**:
   - `connectScale(): Promise<boolean>`
   - `disconnectScale(): void`
   - `setSimulatedWeight(weight: number): void`

4. **UI Screens & Components**:
   - `PrinterSettingsScreen.tsx`: Select roll width, printer connection, auto-cut/drawer toggles, test receipt button, weighing scale connection & simulation controls.
   - `TarajuScreen.tsx` update: Displays live scale weight bar with "Capture Weight ⚖️" button.
   - `CheckoutModal.tsx` & Bill Details: "Print 58mm/80mm Thermal Receipt (🖨️)" button with automatic cash drawer opening.
