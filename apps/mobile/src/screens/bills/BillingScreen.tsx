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
import { Feather } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { CartItemList } from '../../components/bills/CartItemList';
import { QuickItemPicker } from '../../components/bills/QuickItemPicker';
import { POSBarcodeScannerModal } from '../../components/bills/POSBarcodeScannerModal';
import { Product } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const BillingScreen: React.FC<{ onOpenCheckout?: () => void }> = ({ onOpenCheckout }) => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { products } = useProductStore();
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
  const [scannerModalVisible, setScannerModalVisible] = useState(false);

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
    setScannerModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>POS Checkout</Text>
          <Text style={styles.headerSub}>
            {user?.displayName || 'Counter 1'} • {items.length} items in cart
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
              <Feather name="trash-2" size={13} color={colors.danger} style={{ marginRight: 4 }} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleScanBarcode}
            activeOpacity={0.8}
          >
            <Feather name="camera" size={14} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.scanText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Product Bar */}
      <View style={styles.searchBox}>
        <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, barcodes, Hindi..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
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
            <Text style={styles.payButtonText}>Proceed to Pay</Text>
            <Feather name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* POS Barcode Scanner Modal */}
      <POSBarcodeScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 84, 85, 0.12)',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    maxHeight: 240,
    zIndex: 10,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultHindi: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchResultRight: {
    alignItems: 'flex-end',
  },
  searchResultPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  searchResultAdd: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  totalsColumn: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary, // MasterX Royal Purple
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
