import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { CartItemList } from '../../components/bills/CartItemList';
import { QuickItemPicker } from '../../components/bills/QuickItemPicker';
import { Product } from '@kirana-pro/shared';

export const BillingScreen: React.FC<{ onOpenCheckout?: () => void }> = ({ onOpenCheckout }) => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { products, findByBarcode } = useProductStore();
  const {
    items,
    totals,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const clean = text.trim().toLowerCase();
    if (!clean) {
      setSearchResults([]);
      return;
    }

    const matches = products.filter(
      (p) =>
        p.isActive !== false &&
        (p.name.toLowerCase().includes(clean) ||
          p.barcode?.includes(clean) ||
          (p.nameHindi && p.nameHindi.toLowerCase().includes(clean)))
    );
    setSearchResults(matches);
  };

  const handleAddFromSearch = (product: Product) => {
    addItem(product, 1);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleScanBarcode = () => {
    navigation.navigate('ProductsTab', { screen: 'BarcodeScanner' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ POS Billing</Text>
          <Text style={styles.headerSub}>
            {user?.displayName || 'My Store'} • {items.length} items in cart
          </Text>
        </View>

        <View style={styles.headerActions}>
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                Alert.alert('Clear Cart?', 'Remove all items from current bill?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearCart },
                ]);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleScanBarcode}
            activeOpacity={0.8}
          >
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={styles.scanText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Product Bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search product name, barcode, or Hindi..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Live Search Results Dropdown */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          {searchResults.slice(0, 5).map((prod) => (
            <TouchableOpacity
              key={prod.id}
              style={styles.searchResultRow}
              onPress={() => handleAddFromSearch(prod)}
            >
              <View style={styles.searchResultLeft}>
                <Text style={styles.searchResultName}>{prod.name}</Text>
                {prod.nameHindi ? (
                  <Text style={styles.searchResultHindi}>{prod.nameHindi}</Text>
                ) : null}
              </View>
              <View style={styles.searchResultRight}>
                <Text style={styles.searchResultPrice}>₹{prod.sellingPrice}</Text>
                <Text style={styles.searchResultAdd}>+ Add</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Quick Add Chips */}
        <QuickItemPicker
          products={products}
          onSelectProduct={(p) => addItem(p, 1)}
        />

        {/* Cart Item List */}
        <CartItemList
          items={items}
          onIncrement={(id, qty) => updateQuantity(id, qty + 1)}
          onDecrement={(id, qty) => updateQuantity(id, qty - 1)}
          onRemove={(id) => removeItem(id)}
        />
      </ScrollView>

      {/* Bottom Floating Checkout Bar */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.totalsColumn}>
            <Text style={styles.totalLabel}>
              Total ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
            </Text>
            <Text style={styles.totalValue}>₹{totals.grandTotal}</Text>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            activeOpacity={0.88}
            onPress={() => {
              if (onOpenCheckout) {
                onOpenCheckout();
              } else {
                navigation.navigate('Checkout');
              }
            }}
          >
            <Text style={styles.payButtonText}>Proceed to Pay ➔</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  scanIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  scanText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 220,
    zIndex: 10,
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchResultHindi: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  searchResultRight: {
    alignItems: 'flex-end',
  },
  searchResultPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  searchResultAdd: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  totalsColumn: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  payButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
