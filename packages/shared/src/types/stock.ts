export type StockMovementType = 'in' | 'out' | 'adjustment';
export type StockMovementReason = 'purchase' | 'sale' | 'damage' | 'expiry' | 'return' | 'correction';

export interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string | null;
  performedBy: string;
  createdAt: string;
}
