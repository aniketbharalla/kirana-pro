import { create } from 'zustand';
import { PrinterWidth, PrinterConnectionType, PrinterSettings, ScaleReading } from '@kirana-pro/shared';

export interface HardwareState {
  // Printer State
  printerWidth: PrinterWidth;
  connectionType: PrinterConnectionType;
  printerName: string;
  autoCut: boolean;
  autoKickDrawer: boolean;
  isPrinterConnected: boolean;

  // Electronic Scale State
  isScaleConnected: boolean;
  scaleWeight: number;         // current live weight in kg
  scaleUnit: 'kg' | 'g';
  isScaleStable: boolean;
  isSimulatedScale: boolean;
  lastScaleReading: ScaleReading | null;

  // Printer Actions
  setPrinterWidth: (width: PrinterWidth) => void;
  setConnectionType: (type: PrinterConnectionType) => void;
  setPrinterName: (name: string) => void;
  setAutoCut: (enabled: boolean) => void;
  setAutoKickDrawer: (enabled: boolean) => void;
  setPrinterConnected: (connected: boolean) => void;
  getPrinterSettings: () => PrinterSettings;

  // Scale Actions
  setScaleConnected: (connected: boolean) => void;
  setScaleWeight: (weight: number, isStable?: boolean) => void;
  setSimulatedScale: (simulated: boolean) => void;
  tareScale: () => void;
}

export const useHardwareStore = create<HardwareState>((set, get) => ({
  printerWidth: '58mm',
  connectionType: 'system',
  printerName: 'Generic 58mm Thermal Printer',
  autoCut: true,
  autoKickDrawer: true,
  isPrinterConnected: true,

  isScaleConnected: false,
  scaleWeight: 0.0,
  scaleUnit: 'kg',
  isScaleStable: true,
  isSimulatedScale: false,
  lastScaleReading: null,

  setPrinterWidth: (printerWidth) => set({ printerWidth }),
  setConnectionType: (connectionType) => set({ connectionType }),
  setPrinterName: (printerName) => set({ printerName }),
  setAutoCut: (autoCut) => set({ autoCut }),
  setAutoKickDrawer: (autoKickDrawer) => set({ autoKickDrawer }),
  setPrinterConnected: (isPrinterConnected) => set({ isPrinterConnected }),

  getPrinterSettings: () => {
    const s = get();
    return {
      width: s.printerWidth,
      connection: s.connectionType,
      autoCut: s.autoCut,
      autoKickDrawer: s.autoKickDrawer,
      deviceName: s.printerName,
    };
  },

  setScaleConnected: (isScaleConnected) => set({ isScaleConnected }),
  setScaleWeight: (weight, isStable = true) => {
    const rounded = Math.round(weight * 1000) / 1000;
    const reading: ScaleReading = {
      weight: rounded,
      unit: 'kg',
      isStable,
      timestamp: new Date().toISOString(),
    };
    set({
      scaleWeight: rounded,
      isScaleStable: isStable,
      lastScaleReading: reading,
    });
  },
  setSimulatedScale: (isSimulatedScale) => {
    set({ isSimulatedScale, isScaleConnected: isSimulatedScale });
    if (isSimulatedScale) {
      // Default initial weight on simulated scale
      set({ scaleWeight: 1.25, isScaleStable: true });
    }
  },
  tareScale: () => set({ scaleWeight: 0.0, isScaleStable: true }),
}));
