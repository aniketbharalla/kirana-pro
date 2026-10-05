'use client';

import React, { useState } from 'react';
import { BillsTable } from '../../components/BillsTable';
import { Invoice } from '@kirana-pro/shared';

const STARTER_INVOICES: Invoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-0042',
    storeId: 'demo_store_1',
    items: [
      {
        productId: 'prod_1',
        name: 'Aashirvaad Shudh Chakki Atta 5kg',
        unit: 'packet',
        isLoose: false,
        quantity: 1,
        unitPrice: 250,
        discount: 0,
        gstRate: 0,
        taxableAmount: 250,
        gstAmount: 0,
        totalAmount: 250,
      },
      {
        productId: 'prod_2',
        name: 'Tata Salt Vacuum Evaporated 1kg',
        unit: 'packet',
        isLoose: false,
        quantity: 2,
        unitPrice: 28,
        discount: 0,
        gstRate: 0,
        taxableAmount: 56,
        gstAmount: 0,
        totalAmount: 56,
      },
    ],
    subtotal: 306,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 306,
    paymentMode: 'cash',
    paymentStatus: 'paid',
    amountPaid: 306,
    amountDue: 0,
    cashTendered: 500,
    changeDue: 194,
    createdAt: '2026-10-05T09:30:00.000Z',
    createdBy: 'demo_owner',
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-2026-0043',
    storeId: 'demo_store_1',
    items: [
      {
        productId: 'prod_3',
        name: 'Loose Basmati Chawal (Premium)',
        nameHindi: 'खुला बासमती चावल',
        unit: 'kg',
        isLoose: true,
        quantity: 2.5,
        unitPrice: 50,
        discount: 0,
        gstRate: 0,
        taxableAmount: 125,
        gstAmount: 0,
        totalAmount: 125,
      },
      {
        productId: 'prod_5',
        name: 'Maggi 2-Minute Masala Noodles 70g',
        unit: 'packet',
        isLoose: false,
        quantity: 4,
        unitPrice: 14,
        discount: 0,
        gstRate: 12,
        taxableAmount: 50,
        gstAmount: 6,
        totalAmount: 56,
      },
    ],
    subtotal: 175,
    discountTotal: 0,
    taxTotal: 6,
    grandTotal: 181,
    paymentMode: 'upi',
    paymentStatus: 'paid',
    amountPaid: 181,
    amountDue: 0,
    createdAt: '2026-10-05T10:15:00.000Z',
    createdBy: 'demo_owner',
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-2026-0044',
    storeId: 'demo_store_1',
    customer: {
      id: 'cust_demo_1',
      name: 'Ramesh Sharma (Pandit Ji)',
      phoneNumber: '9876543210',
    },
    items: [
      {
        productId: 'prod_6',
        name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        unit: 'packet',
        isLoose: false,
        quantity: 2,
        unitPrice: 145,
        discount: 10,
        gstRate: 5,
        taxableAmount: 266.67,
        gstAmount: 13.33,
        totalAmount: 280,
      },
    ],
    subtotal: 266.67,
    discountTotal: 10,
    taxTotal: 13.33,
    grandTotal: 280,
    paymentMode: 'credit',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    amountDue: 280,
    createdAt: '2026-10-05T11:45:00.000Z',
    createdBy: 'demo_owner',
  },
];

export default function BillsPage() {
  const [invoices] = useState<Invoice[]>(STARTER_INVOICES);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sales & Invoices</h1>
          <p style={styles.subtitle}>
            Live counter bills, payment modes breakdown, and 58mm thermal receipts
          </p>
        </div>
      </div>

      <BillsTable invoices={invoices} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
};
