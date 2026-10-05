import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  Product,
  productSchema,
} from '@kirana-pro/shared';
import { useProductStore } from '../store/productStore';
import { recordStockMovement } from './stock';

export const addProduct = async (
  storeId: string,
  data: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<Product> => {
  // Validate schema
  productSchema.parse({
    storeId,
    name: data.name,
    nameHindi: data.nameHindi,
    category: data.category,
    barcode: data.barcode,
    purchasePrice: data.purchasePrice,
    sellingPrice: data.sellingPrice,
    gstRate: data.gstRate,
    unit: data.unit,
    isLoose: data.isLoose,
    pricePerUnit: data.pricePerUnit,
    currentStock: data.currentStock,
    minStockAlert: data.minStockAlert,
    imageURL: data.imageURL,
  });

  const db = getFirestoreDb();
  const productsCol = collection(db, 'stores', storeId, 'products');
  const productRef = doc(productsCol);
  const productId = productRef.id;
  const now = new Date().toISOString();

  const newProduct: Product = {
    ...data,
    id: productId,
    storeId,
    name: data.name.trim(),
    nameHindi: data.nameHindi?.trim(),
    barcode: data.barcode ? data.barcode.trim() : null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(productRef, newProduct);

  // If initial stock was entered, log an initial stock movement
  if (data.currentStock > 0) {
    try {
      await recordStockMovement(storeId, productId, {
        type: 'in',
        quantity: data.currentStock,
        reason: 'purchase',
        note: 'Initial catalog onboarding stock',
        performedBy: userId,
      });
    } catch (e) {
      console.warn('Initial stock movement log warning:', e);
    }
  }

  return newProduct;
};

export const updateProduct = async (
  storeId: string,
  productId: string,
  data: Partial<Product>
): Promise<void> => {
  const db = getFirestoreDb();
  const productRef = doc(db, 'stores', storeId, 'products', productId);
  const now = new Date().toISOString();

  await updateDoc(productRef, {
    ...data,
    updatedAt: now,
  });
};

export const softDeleteProduct = async (
  storeId: string,
  productId: string
): Promise<void> => {
  await updateProduct(storeId, productId, { isActive: false });
};

export const fetchProducts = async (storeId: string): Promise<Product[]> => {
  const db = getFirestoreDb();
  const productsCol = collection(db, 'stores', storeId, 'products');
  useProductStore.getState().setLoading(true);

  try {
    const snap = await getDocs(productsCol);
    const list = snap.docs
      .map((d) => d.data() as Product)
      .filter((p) => p.isActive !== false);

    useProductStore.getState().setProducts(list);
    return list;
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  } finally {
    useProductStore.getState().setLoading(false);
  }
};

export const subscribeToProducts = (storeId: string): (() => void) => {
  const db = getFirestoreDb();
  const productsCol = collection(db, 'stores', storeId, 'products');
  useProductStore.getState().setLoading(true);

  return onSnapshot(
    productsCol,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as Product)
        .filter((p) => p.isActive !== false);

      useProductStore.getState().setProducts(list);
    },
    (err) => {
      console.error('Products listener error:', err);
      useProductStore.getState().setLoading(false);
    }
  );
};
