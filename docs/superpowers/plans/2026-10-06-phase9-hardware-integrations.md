# Implementation Plan: Phase 9 — Hardware Integrations (Thermal Printer ESC/POS & Electronic Weighing Scale)

## Overview
Phase 9 delivers:
1. **ESC/POS Thermal Receipt Printing Subsystem**:
   - 58mm (32-col) & 80mm (48-col) byte formatting.
   - Text alignment, bolding, character sizing, tabular layout, paper cut & cash drawer kick.
   - Multi-transport: Web Bluetooth, WebUSB, and System Print fallback.
   - Test print generator.
2. **Electronic Weighing Scale (Taraju) Subsystem**:
   - Continuous serial weight parser for Essae/Phoenix/Toledo ASCII protocols.
   - Live weight stream into Taraju weighing screen.
   - Scale simulator for instant demo/testing without physical scale attached.
3. **UI & POS Integration**:
   - `hardwareStore.ts` for printer/scale state management and local persistence.
   - `PrinterSettingsScreen.tsx` for printer configuration, test prints, and scale pairing.
   - `TarajuScreen.tsx` live weight badge and auto-fill.
   - `CheckoutModal.tsx` 1-tap print and automatic cash drawer kick.

---

## Tasks

### Task 1: Shared Package ESC/POS & Scale Utilities (`packages/shared`)
- **[NEW]** `packages/shared/src/types/hardware.ts`: PrinterConfig, ScaleReading, EscPosOptions.
- **[NEW]** `packages/shared/src/utils/escpos.ts`: Byte builders for 58mm/80mm receipts, drawer kick, paper cut, test page.
- **[NEW]** `packages/shared/src/utils/scaleParser.ts`: Serial ASCII string parser for Essae/Phoenix/NCI protocols.
- **[EDIT]** `packages/shared/src/index.ts`: Export hardware types and utilities.
- **[NEW]** `packages/shared/src/__tests__/escpos.test.ts`: Test ESC/POS byte generation, line wrapping, drawer kick.
- **[NEW]** `packages/shared/src/__tests__/scaleParser.test.ts`: Test parsing of various continuous scale strings.

### Task 2: Hardware Store & Services in Mobile (`apps/mobile`)
- **[NEW]** `apps/mobile/src/store/hardwareStore.ts`: Store for printer config (58mm/80mm, Bluetooth/USB/System), drawer kick, and scale connection.
- **[NEW]** `apps/mobile/src/services/printerService.ts`: Print invoice, test print, kick cash drawer via Web Bluetooth/USB or HTML print.
- **[NEW]** `apps/mobile/src/services/scaleService.ts`: Web Serial / Bluetooth scale reader with simulation support.
- **[NEW]** `apps/mobile/src/__tests__/hardwareStore.test.ts`: Test printer settings, scale reading, drawer toggle.

### Task 3: Hardware UI Screens & POS Integration (`apps/mobile`)
- **[NEW]** `apps/mobile/src/screens/hardware/PrinterSettingsScreen.tsx`: Complete configuration screen for 58mm/80mm, test print, drawer kick, and scale calibration.
- **[EDIT]** `apps/mobile/src/screens/taraju/TarajuScreen.tsx`: Show live electronic scale indicator with 1-tap weight capture.
- **[EDIT]** `apps/mobile/src/components/bills/CheckoutModal.tsx`: Print receipt option and cash drawer kick on cash payments.
- **[EDIT]** `apps/mobile/src/screens/profile/ProfileScreen.tsx`: Add Hardware & Printer Settings tile in Dukaan section.

### Task 4: Verification & Suite Pass
- Run test suites in `packages/shared` and `apps/mobile`.
- Verify full monorepo pass.
