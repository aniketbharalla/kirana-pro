import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  getFirestoreDb,
  Product,
  productSchema,
} from '@kirana-pro/shared';
import { useProductStore, DEFAULT_STARTER_PRODUCTS } from '../store/productStore';
import {
  saveProductsLocally,
  loadProductsLocally,
  enqueuePendingProduct,
} from './localStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `prod_local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── Add Product (LOCAL-FIRST, Queued for Cloud Sync & Direct Write) ──────────

export const addProduct = async (
  storeId: string,
  data: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<Product> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  const now = new Date().toISOString();
  const productId = generateId();

  // Sanitize fields before validation to avoid any format/type crashes
  const sanitizedBarcode =
    data.barcode && typeof data.barcode === 'string' && data.barcode.trim().length > 0
      ? data.barcode.trim()
      : null;

  const sanitizedImageURL =
    data.imageURL &&
    typeof data.imageURL === 'string' &&
    (data.imageURL.startsWith('http://') || data.imageURL.startsWith('https://'))
      ? data.imageURL.trim()
      : null;

  const sanitizedPurchasePrice =
    typeof data.purchasePrice === 'number' && !isNaN(data.purchasePrice)
      ? Math.max(0, data.purchasePrice)
      : 0;

  const sanitizedSellingPrice =
    typeof data.sellingPrice === 'number' && !isNaN(data.sellingPrice)
      ? Math.max(0, data.sellingPrice)
      : 0;

  const sanitizedCurrentStock =
    typeof data.currentStock === 'number' && !isNaN(data.currentStock)
      ? data.currentStock
      : 0;

  const sanitizedMinStock =
    typeof data.minStockAlert === 'number' && !isNaN(data.minStockAlert)
      ? data.minStockAlert
      : 5;

  const validGstRates = [0, 5, 12, 18, 28];
  const sanitizedGstRate = validGstRates.includes(data.gstRate as any)
    ? data.gstRate
    : 0;

  const validUnits = ['kg', 'g', 'liter', 'ml', 'piece', 'packet', 'dozen', 'box'];
  const sanitizedUnit = validUnits.includes(data.unit) ? data.unit : 'packet';

  const cleanData = {
    storeId: effectiveStoreId,
    name: data.name ? data.name.trim() : 'Unnamed Item',
    nameHindi: data.nameHindi && data.nameHindi.trim() ? data.nameHindi.trim() : undefined,
    category: data.category && data.category.trim() ? data.category.trim() : 'General',
    barcode: sanitizedBarcode,
    purchasePrice: sanitizedPurchasePrice,
    sellingPrice: sanitizedSellingPrice,
    gstRate: sanitizedGstRate,
    unit: sanitizedUnit,
    isLoose: Boolean(data.isLoose),
    pricePerUnit:
      typeof data.pricePerUnit === 'number' && !isNaN(data.pricePerUnit)
        ? Math.max(0, data.pricePerUnit)
        : sanitizedSellingPrice,
    currentStock: sanitizedCurrentStock,
    minStockAlert: sanitizedMinStock,
    imageURL: sanitizedImageURL,
  };

  // Safe schema check
  const parseResult = productSchema.safeParse(cleanData);
  if (!parseResult.success) {
    console.warn('Product schema validation warning, proceeding with cleaned data:', parseResult.error.message);
  }

  const newProduct: Product = {
    ...cleanData,
    id: productId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } as Product;

  // 1. Save to local Zustand store immediately (instant UI update)
  const currentProducts = useProductStore.getState().products;
  const updatedProducts = [...currentProducts, newProduct];
  useProductStore.getState().setProducts(updatedProducts);

  // 2. Persist locally to storage
  try {
    await saveProductsLocally(effectiveStoreId, updatedProducts);
    // 3. Mark as pending sync (for offline queue resilience)
    await enqueuePendingProduct(effectiveStoreId, newProduct);
  } catch (localErr) {
    console.warn('Local save warning (product preserved in memory):', localErr);
  }

  // 4. Immediately write to Firestore cloud so dashboard and real-time listeners see it
  try {
    const db = getFirestoreDb();
    if (db) {
      const prodRef = doc(db, 'stores', effectiveStoreId, 'products', productId);
      await setDoc(prodRef, newProduct, { merge: true });
    }
  } catch (cloudErr) {
    console.warn('Direct Firestore cloud save note (enqueued for sync):', cloudErr);
  }

  return newProduct;
};

// ─── Update Product ────────────────────────────────────────────────────────

export const updateProduct = async (
  storeId: string,
  productId: string,
  data: Partial<Product>
): Promise<void> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  const now = new Date().toISOString();

  // Update local Zustand store
  const { products } = useProductStore.getState();
  const updatedProducts = products.map((p) =>
    p.id === productId ? { ...p, ...data, updatedAt: now } : p
  );
  useProductStore.getState().setProducts(updatedProducts);

  // Persist locally
  await saveProductsLocally(effectiveStoreId, updatedProducts).catch(() => {});

  // Enqueue for cloud sync
  const updatedItem = updatedProducts.find((p) => p.id === productId);
  if (updatedItem) {
    await enqueuePendingProduct(effectiveStoreId, updatedItem).catch(() => {});
  }

  // Immediately update Firestore in background
  try {
    const db = getFirestoreDb();
    if (db) {
      const prodRef = doc(db, 'stores', effectiveStoreId, 'products', productId);
      await setDoc(prodRef, { ...data, updatedAt: now }, { merge: true });
    }
  } catch (cloudErr) {
    console.warn('Direct Firestore cloud update note (enqueued):', cloudErr);
  }
};

// ─── Soft Delete ───────────────────────────────────────────────────────────

export const softDeleteProduct = async (
  storeId: string,
  productId: string
): Promise<void> => {
  await updateProduct(storeId, productId, { isActive: false });
};

// ─── Fetch Products (local-first) ──────────────────────────────────────────

export const fetchProducts = async (storeId: string): Promise<Product[]> => {
  const effectiveStoreId = storeId || 'demo_store_1';
  useProductStore.getState().setLoading(true);

  // 1. Load from local storage first (instant)
  try {
    const localProducts = await loadProductsLocally(effectiveStoreId);
    if (localProducts.length > 0) {
      useProductStore.getState().setProducts(localProducts);
      useProductStore.getState().setLoading(false);
      return localProducts;
    }
  } catch {}

  // 2. Fall back to starter products if nothing stored locally
  const current = useProductStore.getState().products;
  if (!current || current.length === 0) {
    useProductStore.getState().setProducts(DEFAULT_STARTER_PRODUCTS);
    await saveProductsLocally(effectiveStoreId, DEFAULT_STARTER_PRODUCTS).catch(() => {});
  }
  useProductStore.getState().setLoading(false);
  return useProductStore.getState().products;
};

// ─── Subscribe to Products (local-first with Firestore fallback) ───────────

export const subscribeToProducts = (storeId: string): (() => void) => {
  const effectiveStoreId = storeId || 'demo_store_1';

  // 1. Load from local storage immediately (no flicker)
  loadProductsLocally(effectiveStoreId)
    .then((localProducts) => {
      if (localProducts.length > 0) {
        useProductStore.getState().setProducts(localProducts);
      } else {
        const current = useProductStore.getState().products;
        if (!current || current.length === 0) {
          useProductStore.getState().setProducts(DEFAULT_STARTER_PRODUCTS);
        }
      }
    })
    .catch(() => {});

  // 2. Try realtime Firestore listener if available
  try {
    const db = getFirestoreDb();
    if (!db || typeof db !== 'object') {
      return () => {};
    }
    const productsCol = collection(db, 'stores', effectiveStoreId, 'products');

    const unsubscribe = onSnapshot(
      productsCol,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Product)
          .filter((p) => p.isActive !== false);

        if (list.length > 0) {
          useProductStore.getState().setProducts(list);
          saveProductsLocally(effectiveStoreId, list).catch(() => {});
        }
        useProductStore.getState().setLoading(false);
      },
      (err) => {
        console.warn('Realtime products listener (using local storage):', err.message);
        useProductStore.getState().setLoading(false);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Products listener skipped (running local-first):', err.message);
    useProductStore.getState().setLoading(false);
    return () => {};
  }
};
