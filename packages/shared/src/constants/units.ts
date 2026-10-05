import { ProductUnit } from '../types/product';

export interface ProductUnitConstant {
  value: ProductUnit;
  label: string;
  labelHindi: string;
}

export const PRODUCT_UNITS: ProductUnitConstant[] = [
  { value: 'kg', label: 'Kilogram (kg)', labelHindi: 'किलो (kg)' },
  { value: 'g', label: 'Gram (g)', labelHindi: 'ग्राम (g)' },
  { value: 'liter', label: 'Litre (L)', labelHindi: 'लीटर (L)' },
  { value: 'ml', label: 'Millilitre (ml)', labelHindi: 'मिलीलीटर (ml)' },
  { value: 'piece', label: 'Piece (pc)', labelHindi: 'पीस (pc)' },
  { value: 'packet', label: 'Packet (pkt)', labelHindi: 'पैकेट (pkt)' },
  { value: 'dozen', label: 'Dozen (dz)', labelHindi: 'दर्जन (dz)' },
  { value: 'box', label: 'Box', labelHindi: 'डिब्बा (box)' },
];

export const GST_RATES: readonly [0, 5, 12, 18, 28] = [0, 5, 12, 18, 28] as const;
