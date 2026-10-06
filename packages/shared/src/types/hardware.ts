export type PrinterWidth = '58mm' | '80mm';
export type PrinterConnectionType = 'bluetooth' | 'usb' | 'system';

export interface PrinterSettings {
  width: PrinterWidth;
  connection: PrinterConnectionType;
  autoCut: boolean;
  autoKickDrawer: boolean;
  deviceName?: string;
  baudRate?: number;
}

export interface ScaleReading {
  weight: number;          // numeric weight in kg
  unit: 'kg' | 'g';
  isStable: boolean;
  rawString?: string;
  timestamp: string;
}

export interface EscPosReceiptStoreInfo {
  name: string;
  address?: string;
  gstin?: string;
  phone?: string;
  tagline?: string;
}
