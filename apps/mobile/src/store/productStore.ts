import { create } from 'zustand';
import { Product } from '@kirana-pro/shared';

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

      // Category filter
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }

      // Search query filter (matches name or barcode)
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
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
