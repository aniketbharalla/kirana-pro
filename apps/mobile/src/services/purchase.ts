import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  PurchaseInvoice,
  purchaseInvoiceSchema,
  Product,
} from '@kirana-pro/shared';
import { useProductStore } from '../store/productStore';
import { useSupplierStore } from '../store/supplierStore';

export const recordPurchaseInvoice = async (
  storeId: string,
  invoice: PurchaseInvoice
): Promise<void> => {
  // Validate schema
  purchaseInvoiceSchema.parse({
    supplierId: invoice.supplierId,
    supplierName: invoice.supplierName,
    invoiceNo: invoice.invoiceNo,
    invoiceDate: invoice.invoiceDate,
    imageURL: invoice.imageURL,
    items: invoice.items,
    subtotal: invoice.subtotal,
    totalDiscount: invoice.totalDiscount,
    totalCGST: invoice.totalCGST,
    totalSGST: invoice.totalSGST,
    totalTax: invoice.totalTax,
    roundOff: invoice.roundOff,
    netPayable: invoice.netPayable,
    paymentStatus: invoice.paymentStatus,
    paidAmt: invoice.paidAmt,
  });

  const db = getFirestoreDb();
  const isLiveFirestore = db && typeof db === 'object';

  if (isLiveFirestore) {
    try {
      await runTransaction(db, async (tx) => {
        // 1. Process items and update/create products
        for (const item of invoice.items) {
          if (item.productId) {
            const prodRef = doc(db, 'stores', storeId, 'products', item.productId);
            const prodSnap = await tx.get(prodRef);
            if (prodSnap.exists()) {
              const currentStock = prodSnap.data().currentStock || 0;
              const newStock = currentStock + item.totalQty;
              tx.update(prodRef, {
                currentStock: newStock,
                purchasePrice: item.rate,
                updatedAt: new Date().toISOString(),
              });
            }
          } else {
            const newProdRef = doc(collection(db, 'stores', storeId, 'products'));
            const newProductData = {
              id: newProdRef.id,
              storeId,
              name: item.productName,
              barcode: item.barcode || '',
              category: 'General',
              sellingPrice: Math.round(item.rate * 1.2),
              purchasePrice: item.rate,
              gstRate: item.cgstRate + item.sgstRate,
              unit: item.uomMapped || 'piece',
              isLoose: false,
              currentStock: item.totalQty,
              minStockAlert: 5,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            tx.set(newProdRef, newProductData);
          }

          // Stock movement
          const movRef = doc(collection(db, 'stores', storeId, 'stockMovements'));
          tx.set(movRef, {
            storeId,
            productId: item.productId || 'new',
            type: 'in',
            reason: 'purchase',
            quantity: item.totalQty,
            note: `Purchase ${invoice.invoiceNo} from ${invoice.supplierName}`,
            purchaseId: invoice.id,
            createdAt: new Date().toISOString(),
          });
        }

        // 2. Save purchase invoice
        const purchaseRef = doc(db, 'stores', storeId, 'purchases', invoice.id);
        tx.set(purchaseRef, invoice);

        // 3. Update supplier balance
        const supRef = doc(db, 'stores', storeId, 'suppliers', invoice.supplierId);
        const supSnap = await tx.get(supRef);
        if (supSnap.exists()) {
          const supData = supSnap.data();
          tx.update(supRef, {
            totalPurchases: (supData.totalPurchases || 0) + invoice.netPayable,
            balance: (supData.balance || 0) + (invoice.netPayable - invoice.paidAmt),
            invoiceCount: (supData.invoiceCount || 0) + 1,
            updatedAt: Date.now(),
          });
        }
      });
    } catch (err: any) {
      console.warn('Firestore runTransaction purchase fallback:', err.message);
    }
  }

  // Synchronize in local Zustand stores
  const productStore = useProductStore.getState();
  const currentProducts = [...productStore.products];

  for (const item of invoice.items) {
    if (item.productId) {
      const idx = currentProducts.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        currentProducts[idx] = {
          ...currentProducts[idx],
          currentStock: (currentProducts[idx].currentStock || 0) + item.totalQty,
          purchasePrice: item.rate,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      // Create new product in local store
      const newProd: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        storeId,
        name: item.productName,
        barcode: item.barcode || '',
        category: 'General',
        sellingPrice: Math.round(item.rate * 1.2),
        purchasePrice: item.rate,
        gstRate: item.cgstRate + item.sgstRate,
        unit: item.uomMapped || 'piece',
        isLoose: false,
        pricePerUnit: Math.round(item.rate * 1.2),
        imageURL: null,
        currentStock: item.totalQty,
        minStockAlert: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentProducts.push(newProd);
    }
  }

  productStore.setProducts(currentProducts);

  // Update supplier store
  const supplierStore = useSupplierStore.getState();
  supplierStore.addPurchase(invoice);

  const existingSup = supplierStore.suppliers.find((s) => s.id === invoice.supplierId);
  if (existingSup) {
    supplierStore.updateSupplier(existingSup.id, {
      totalPurchases: (existingSup.totalPurchases || 0) + invoice.netPayable,
      balance: (existingSup.balance || 0) + (invoice.netPayable - invoice.paidAmt),
      invoiceCount: (existingSup.invoiceCount || 0) + 1,
      updatedAt: Date.now(),
    });
  }
};

export const getPurchases = async (storeId: string): Promise<PurchaseInvoice[]> => {
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') {
      return useSupplierStore.getState().purchases;
    }
    const purchasesRef = collection(db, 'stores', storeId, 'purchases');
    const snapshot = await getDocs(purchasesRef);
    const list: PurchaseInvoice[] = [];
    snapshot.forEach((d) => list.push(d.data() as PurchaseInvoice));
    if (list.length > 0) {
      useSupplierStore.getState().setPurchases(list);
      return list;
    }
  } catch (err: any) {
    console.warn('Error fetching purchases:', err.message);
  }
  return useSupplierStore.getState().purchases;
};
