import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProductStore, DEFAULT_STARTER_PRODUCTS } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { subscribeToProducts, updateProduct } from '../../services/product';
import { recordStockMovement } from '../../services/stock';
import { CategoryFilter } from '../../components/products/CategoryFilter';
import { ProductCard } from '../../components/products/ProductCard';
import { colors } from '../../theme';
import { Product } from '@kirana-pro/shared';
import { Feather } from '@expo/vector-icons';
import { ToastBanner } from '../../components/common/ToastBanner';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    products,
    isLoading,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    getFilteredProducts,
  } = useProductStore();

  // Top Tab Switcher: Products Catalog vs Stock & Inventory
  const [activeTab, setActiveTab] = useState<'catalog' | 'stock'>('catalog');

  // Stock Filter: All vs Low Stock vs Out of Stock vs In Stock
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');

  // Quick Restock Modal State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');
  const [isRestocking, setIsRestocking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // If local store has no products, initialize default starter products so it's never blank
    if (!products || products.length === 0) {
      useProductStore.getState().setProducts(DEFAULT_STARTER_PRODUCTS);
    }

    if (user?.storeId) {
      const unsubscribe = subscribeToProducts(user.storeId);
      return () => unsubscribe();
    }
  }, [user?.storeId]);

  const filteredCatalog = getFilteredProducts();

  // Inventory Calculations
  const lowStockItems = products.filter(
    (p) => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.minStockAlert || 5)
  );
  const outOfStockItems = products.filter((p) => (p.currentStock || 0) === 0);
  const inStockItems = products.filter((p) => (p.currentStock || 0) > (p.minStockAlert || 5));

  const totalStockUnits = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
  const totalCostValue = products.reduce(
    (acc, p) => acc + (p.currentStock || 0) * (p.purchasePrice || 0),
    0
  );
  const totalRetailValue = products.reduce(
    (acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0),
    0
  );
  const projectedProfit = totalRetailValue - totalCostValue;

  // Filtered Stock List
  const filteredStockList = products.filter((p) => {
    if (p.isActive === false) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchHindi = p.nameHindi?.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      if (!matchName && !matchHindi && !matchBarcode) return false;
    }

    // Status filter
    if (stockStatusFilter === 'low') {
      return (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.minStockAlert || 5);
    }
    if (stockStatusFilter === 'out') {
      return (p.currentStock || 0) === 0;
    }
    if (stockStatusFilter === 'in') {
      return (p.currentStock || 0) > (p.minStockAlert || 5);
    }
    return true;
  });

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleOpenRestockModal = (product: Product) => {
    setRestockProduct(product);
    setRestockQty('10');
  };

  const handleExecuteRestock = async (qtyNumber?: number) => {
    if (!restockProduct) return;
    const addQuantity = qtyNumber !== undefined ? qtyNumber : parseInt(restockQty, 10);
    if (isNaN(addQuantity) || addQuantity <= 0) return;

    setIsRestocking(true);
    try {
      const newStock = (restockProduct.currentStock || 0) + addQuantity;

      // 1. Instant optimistic update to local store
      const updated = products.map((p) =>
        p.id === restockProduct.id ? { ...p, currentStock: newStock, updatedAt: new Date().toISOString() } : p
      );
      useProductStore.getState().setProducts(updated);

      // 2. Persist to Firestore if storeId exists
      if (user?.storeId) {
        await updateProduct(user.storeId, restockProduct.id, { currentStock: newStock }).catch(() => {});
        await recordStockMovement(user.storeId, restockProduct.id, {
          type: 'in',
          quantity: addQuantity,
          reason: 'purchase',
          note: `Quick Restock (+${addQuantity}) from Stock List`,
          performedBy: user.uid || 'owner',
        }).catch(() => {});
      }

      setToastMessage(`Restocked +${addQuantity} ${restockProduct.unit || 'units'} of ${restockProduct.name}`);
      setTimeout(() => setToastMessage(null), 3000);
      setRestockProduct(null);
    } catch (err: any) {
      console.warn('Restock execution error:', err);
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7FA" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory & Catalog</Text>
          <Text style={styles.subtitle}>
            {products.length} products • {user?.displayName ? `${user.displayName}'s Dukaan` : 'Sharma Kirana Store'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('BarcodeScanner')}
            activeOpacity={0.85}
          >
            <Feather name="maximize" size={14} color="#7367F0" style={{ marginRight: 4 }} />
            <Text style={styles.scanText}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddProduct')}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Top View Tabs */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'catalog' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('catalog')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather
              name="grid"
              size={13}
              color={activeTab === 'catalog' ? '#7367F0' : '#6F6B7D'}
            />
            <Text style={[styles.segmentText, activeTab === 'catalog' && styles.segmentTextActive]}>
              Products ({products.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'stock' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('stock')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather
              name="bar-chart-2"
              size={13}
              color={activeTab === 'stock' ? '#7367F0' : '#6F6B7D'}
            />
            <Text style={[styles.segmentText, activeTab === 'stock' && styles.segmentTextActive]}>
              Stock Register ({products.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <ToastBanner
            type="success"
            title="Stock Updated"
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color="#A8AAAE" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by product name, barcode, or Hindi..."
          placeholderTextColor="#A8AAAE"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color="#A8AAAE" />
          </TouchableOpacity>
        )}
      </View>

      {/* TAB 1: PRODUCTS CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <View style={{ flex: 1 }}>
          {/* Category Filter Pills */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {isLoading && products.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#7367F0" />
            </View>
          ) : filteredCatalog.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color="#7367F0" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No matches for "${searchQuery}". Try a different keyword or scan a barcode.`
                  : 'Add your first grocery product or scan a barcode to auto-fill!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.emptyAddBtnText}>+ Add First Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredCatalog}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => handleProductPress(item)}
                  onQuickStockIn={() => handleOpenRestockModal(item)}
                />
              )}
            />
          )}
        </View>
      )}

      {/* TAB 2: STOCK & INVENTORY REGISTER VIEW */}
      {activeTab === 'stock' && (
        <View style={{ flex: 1 }}>
          {/* Inventory Valuation KPI Banner */}
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Stock Investment</Text>
              <Text style={styles.kpiValue}>₹{totalCostValue.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiSub}>{totalStockUnits} total units in shop</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Retail Potential</Text>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>
                ₹{totalRetailValue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>+₹{projectedProfit.toLocaleString('en-IN')} profit</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: '#FECACA' }]}>
              <Text style={styles.kpiLabel}>Stock Alerts</Text>
              <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
                {lowStockItems.length + outOfStockItems.length}
              </Text>
              <Text style={styles.kpiSub}>
                {outOfStockItems.length} out • {lowStockItems.length} low
              </Text>
            </View>
          </View>

          {/* Stock Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stockFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.stockFilterPill,
                stockStatusFilter === 'all' && styles.stockFilterPillActive,
              ]}
              onPress={() => setStockStatusFilter('all')}
            >
              <Text
                style={[
                  styles.stockFilterPillText,
                  stockStatusFilter === 'all' && styles.stockFilterPillTextActive,
                ]}
              >
                All Items ({products.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stockFilterPill,
                stockStatusFilter === 'low' && styles.stockFilterPillAlert,
              ]}
              onPress={() => setStockStatusFilter('low')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather
                  name="alert-triangle"
                  size={12}
                  color={stockStatusFilter === 'low' ? '#B45309' : '#FF9F43'}
                />
                <Text
                  style={[
                    styles.stockFilterPillText,
                    stockStatusFilter === 'low' && styles.stockFilterPillAlertText,
                  ]}
                >
                  Low Stock ({lowStockItems.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stockFilterPill,
                stockStatusFilter === 'out' && styles.stockFilterPillDanger,
              ]}
              onPress={() => setStockStatusFilter('out')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather
                  name="alert-circle"
                  size={12}
                  color={stockStatusFilter === 'out' ? '#B91C1C' : '#EA5455'}
                />
                <Text
                  style={[
                    styles.stockFilterPillText,
                    stockStatusFilter === 'out' && styles.stockFilterPillDangerText,
                  ]}
                >
                  Out of Stock ({outOfStockItems.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stockFilterPill,
                stockStatusFilter === 'in' && styles.stockFilterPillSuccess,
              ]}
              onPress={() => setStockStatusFilter('in')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather
                  name="check-circle"
                  size={12}
                  color={stockStatusFilter === 'in' ? '#15803D' : '#28C76F'}
                />
                <Text
                  style={[
                    styles.stockFilterPillText,
                    stockStatusFilter === 'in' && styles.stockFilterPillSuccessText,
                  ]}
                >
                  In Stock ({inStockItems.length})
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Stock Register List */}
          <FlatList
            data={filteredStockList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.stockListContent}
            renderItem={({ item }) => {
              const currentStock = item.currentStock || 0;
              const isOut = currentStock === 0;
              const isLow = !isOut && currentStock <= (item.minStockAlert || 5);
              const profitPerUnit = (item.sellingPrice || 0) - (item.purchasePrice || 0);
              const marginPercent =
                item.sellingPrice > 0 ? Math.round((profitPerUnit / item.sellingPrice) * 100) : 0;
              const totalLineCost = currentStock * (item.purchasePrice || 0);

              return (
                <View style={styles.stockRowCard}>
                  <View style={styles.stockRowHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stockItemName}>{item.name}</Text>
                      {item.nameHindi ? (
                        <Text style={styles.stockItemHindi}>{item.nameHindi}</Text>
                      ) : null}
                      <Text style={styles.stockItemCategory}>
                        {item.category} • Barcode: {item.barcode || 'Loose Item'}
                      </Text>
                    </View>

                    {/* Stock Status Badge */}
                    <View
                      style={[
                        styles.stockBadgePill,
                        isOut
                          ? styles.stockBadgeOut
                          : isLow
                          ? styles.stockBadgeLow
                          : styles.stockBadgeGood,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgePillText,
                          isOut
                            ? styles.stockTextOut
                            : isLow
                            ? styles.stockTextLow
                            : styles.stockTextGood,
                        ]}
                      >
                        {isOut
                          ? 'Out of Stock'
                          : isLow
                          ? `Low: ${currentStock} ${item.unit}`
                          : `In Stock: ${currentStock} ${item.unit}`}
                      </Text>
                    </View>
                  </View>

                  {/* Financial & Quantity Breakdown */}
                  <View style={styles.stockFinancialRow}>
                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>Wholesale Cost</Text>
                      <Text style={styles.finValue}>₹{item.purchasePrice || 0}</Text>
                    </View>

                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>Retail MRP</Text>
                      <Text style={[styles.finValue, { color: '#0F172A' }]}>
                        ₹{item.sellingPrice || 0}
                      </Text>
                    </View>

                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>Unit Profit</Text>
                      <Text style={[styles.finValue, { color: '#28C76F' }]}>
                        +₹{profitPerUnit.toFixed(1)} ({marginPercent}%)
                      </Text>
                    </View>

                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>Stock Valuation</Text>
                      <Text style={[styles.finValue, { fontWeight: '800' }]}>
                        ₹{totalLineCost.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Restock & Actions */}
                  <View style={styles.stockActionsRow}>
                    <TouchableOpacity
                      style={styles.detailLinkBtn}
                      onPress={() => handleProductPress(item)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.detailLinkText}>View History</Text>
                        <Feather name="arrow-right" size={13} color="#7367F0" />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.restockActionBtn}
                      onPress={() => handleOpenRestockModal(item)}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="plus" size={13} color="#FFFFFF" />
                        <Text style={styles.restockActionText}>Quick Restock</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* QUICK RESTOCK BOTTOM MODAL */}
      <Modal
        visible={!!restockProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setRestockProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Inward Stock</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {restockProduct?.name} ({restockProduct?.nameHindi || ''})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRestockProduct(null)}>
                <Feather name="x" size={20} color="#6F6B7D" />
              </TouchableOpacity>
            </View>

            {/* Current Stock Banner */}
            <View style={styles.modalStockBanner}>
              <Text style={styles.modalStockBannerText}>
                Current Stock:{' '}
                <Text style={{ fontWeight: '800' }}>
                  {restockProduct?.currentStock ?? 0} {restockProduct?.unit}
                </Text>
              </Text>
              <Text style={styles.modalStockBannerCost}>
                Purchase Cost: ₹{restockProduct?.purchasePrice} • Selling: ₹
                {restockProduct?.sellingPrice}
              </Text>
            </View>

            {/* Quick 1-Tap Preset Quantity Chips */}
            <Text style={styles.presetLabel}>Select Quantity to Add (+):</Text>
            <View style={styles.presetChipsRow}>
              {[5, 10, 25, 50].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => handleExecuteRestock(preset)}
                >
                  <Text style={styles.presetChipText}>+{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Input */}
            <Text style={styles.presetLabel}>Or Custom Quantity:</Text>
            <View style={styles.customQtyRow}>
              <TextInput
                style={styles.customQtyInput}
                keyboardType="numeric"
                value={restockQty}
                onChangeText={setRestockQty}
                placeholder="Enter units..."
              />
              <TouchableOpacity
                style={styles.customSubmitBtn}
                onPress={() => handleExecuteRestock()}
                disabled={isRestocking}
              >
                {isRestocking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.customSubmitBtnText}>Add to Stock</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEBFD',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
  },
  scanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7367F0',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7367F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  toastBanner: {
    backgroundColor: '#065F46',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  clearText: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#7367F0',
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Stock Tab Styles */
  kpiContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  stockFilterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  stockFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockFilterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stockFilterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stockFilterPillTextActive: {
    color: '#FFFFFF',
  },
  stockFilterPillAlert: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  stockFilterPillAlertText: {
    color: '#B45309',
  },
  stockFilterPillDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  stockFilterPillDangerText: {
    color: '#DC2626',
  },
  stockFilterPillSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  stockFilterPillSuccessText: {
    color: '#065F46',
  },
  stockListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  stockRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stockItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockItemHindi: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  stockItemCategory: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  stockBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeGood: {
    backgroundColor: '#ECFDF5',
  },
  stockBadgeLow: {
    backgroundColor: '#FFFBEB',
  },
  stockBadgeOut: {
    backgroundColor: '#FEF2F2',
  },
  stockBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextGood: {
    color: '#065F46',
  },
  stockTextLow: {
    color: '#B45309',
  },
  stockTextOut: {
    color: '#DC2626',
  },
  stockFinancialRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 10,
    justifyContent: 'space-between',
    gap: 4,
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  finValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  stockActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailLinkBtn: {
    paddingVertical: 4,
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  restockActionBtn: {
    backgroundColor: '#7367F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  restockActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 43, 61, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6F6B7D',
    marginTop: 2,
  },
  modalClose: {
    fontSize: 18,
    color: '#6F6B7D',
    padding: 4,
  },
  modalStockBanner: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  modalStockBannerText: {
    fontSize: 14,
    color: '#2F2B3D',
  },
  modalStockBannerCost: {
    fontSize: 12,
    color: '#6F6B7D',
    marginTop: 4,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6B7D',
    marginBottom: 8,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#EDEBFD',
    borderColor: 'rgba(115, 103, 240, 0.25)',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetChipText: {
    color: '#7367F0',
    fontWeight: '700',
    fontSize: 15,
  },
  customQtyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customQtyInput: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBDADE',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  customSubmitBtn: {
    backgroundColor: '#7367F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  customSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
