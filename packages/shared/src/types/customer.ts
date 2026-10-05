export interface CustomerKhata {
  id: string;
  storeId: string;
  name: string;
  phoneNumber: string;
  address?: string;
  currentBalance: number;  // Positive: Customer owes store; Negative: Customer advance
  creditLimit?: number;
  loyaltyPoints?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type KhataTransactionType = 'debit' | 'credit';

export interface KhataTransaction {
  id: string;
  storeId: string;
  customerId: string;
  type: KhataTransactionType; // debit = udhar goods purchase (+ balance); credit = payment repaid (- balance)
  amount: number;
  invoiceId?: string;
  note?: string;
  performedBy: string;
  createdAt: string;
}
