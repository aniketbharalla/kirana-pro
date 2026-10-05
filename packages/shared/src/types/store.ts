export type StoreType = 'kirana' | 'general' | 'medical' | 'dairy' | 'other';

export interface StoreSettings {
  currency: 'INR';
  weightUnit: 'kg' | 'g';
  defaultTaxRate: number;
  invoicePrefix: string;
  invoiceCounter: number;
}

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Store {
  id: string;
  name: string;
  type: StoreType;
  customType?: string;
  address: StoreAddress;
  gstNumber: string | null;
  logoURL: string | null;
  ownerId: string;
  staffIds: string[];
  settings: StoreSettings;
  createdAt: string;
  updatedAt: string;
}
