import { create } from 'zustand';
import { Product } from '@kirana-pro/shared';

export const DEFAULT_STARTER_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    storeId: 'demo_store_1',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    nameHindi: 'आशीर्वाद चक्की आटा',
    category: 'atta_flour',
    barcode: '8901030000001',
    purchasePrice: 220,
    sellingPrice: 250,
    gstRate: 0,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 250,
    currentStock: 18,
    minStockAlert: 5,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'prod_2',
    storeId: 'demo_store_1',
    name: 'Tata Salt Vacuum Evaporated 1kg',
    nameHindi: 'टाटा नमक',
    category: 'spices_masala',
    barcode: '8901030000002',
    purchasePrice: 22,
    sellingPrice: 28,
    gstRate: 0,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 28,
    currentStock: 4,
    minStockAlert: 10,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'prod_3',
    storeId: 'demo_store_1',
    name: 'Loose Basmati Chawal (Premium)',
    nameHindi: 'खुला बासमती चावल',
    category: 'rice_grains',
    barcode: null,
    purchasePrice: 40,
    sellingPrice: 50,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 50,
    currentStock: 120,
    minStockAlert: 25,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'prod_4',
    storeId: 'demo_store_1',
    name: 'Loose Shakar Cheeni (Pure Sugar)',
    nameHindi: 'खुली शक्कर चीनी',
    category: 'sugar_jaggery',
    barcode: null,
    purchasePrice: 36,
    sellingPrice: 42,
    gstRate: 0,
    unit: 'kg',
    isLoose: true,
    pricePerUnit: 42,
    currentStock: 80,
    minStockAlert: 20,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'prod_5',
    storeId: 'demo_store_1',
    name: 'Maggi 2-Minute Masala Noodles 70g',
    nameHindi: 'मैगी नूडल्स',
    category: 'snacks_namkeen',
    barcode: '8901058852331',
    purchasePrice: 11.5,
    sellingPrice: 14,
    gstRate: 12,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 14,
    currentStock: 0,
    minStockAlert: 24,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'prod_6',
    storeId: 'demo_store_1',
    name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    nameHindi: 'फॉर्च्यून रिफाइंड तेल',
    category: 'oil_ghee',
    barcode: '8906007281014',
    purchasePrice: 128,
    sellingPrice: 145,
    gstRate: 5,
    unit: 'packet',
    isLoose: false,
    pricePerUnit: 145,
    currentStock: 12,
    minStockAlert: 6,
    imageURL: null,
    isActive: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
];

export interface ProductState {
  products: Product[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string | null;

  setProducts: (products: Product[]) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;

  getLowStockProducts: () => Product[];
  getLooseProducts: () => Product[];
  getFilteredProducts: () => Product[];
  findByBarcode: (barcode: string) => Product | undefined;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  searchQuery: '',
  selectedCategory: null,

  setProducts: (products) => set({ products, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  getLowStockProducts: () => {
    const { products } = get();
    return products.filter(
      (p) => p.isActive !== false && p.currentStock <= p.minStockAlert
    );
  },

  getLooseProducts: () => {
    const { products } = get();
    return products.filter((p) => p.isActive !== false && p.isLoose);
  },

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    const query = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      if (p.isActive === false) return false;

      // Category filter with hyphen/underscore tolerance
      if (selectedCategory) {
        const normSelected = selectedCategory.replace(/-/g, '_').toLowerCase();
        const normProductCat = (p.category || '').replace(/-/g, '_').toLowerCase();
        if (
          normProductCat !== normSelected &&
          !normProductCat.includes(normSelected) &&
          !normSelected.includes(normProductCat)
        ) {
          return false;
        }
      }

      // Search query filter (matches name or barcode)
      if (query) {
        const matchesName = p.name ? p.name.toLowerCase().includes(query) : false;
        const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(query) : false;
        const matchesHindi = p.nameHindi ? p.nameHindi.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesBarcode && !matchesHindi) {
          return false;
        }
      }

      return true;
    });
  },

  findByBarcode: (barcode: string) => {
    const { products } = get();
    const clean = barcode.trim();
    return products.find((p) => p.barcode === clean && p.isActive !== false);
  },
}));
