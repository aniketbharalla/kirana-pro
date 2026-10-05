import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { softDeleteProduct } from '../../services/product';
import { fetchStockHistory } from '../../services/stock';
import { Product, StockMovement } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { products } = useProductStore();

  const productId = route.params?.productId;
  const product = products.find((p) => p.id === productId);

  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.storeId && productId) {
      setLoadingHistory(true);
      fetchStockHistory(user.storeId, productId)
        .then((items) => setHistory(items.slice(0, 5)))
        .catch((e) => console.warn('Could not load stock history:', e))
        .finally(() => setLoadingHistory(false));
    }
  }, [user?.storeId, productId]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const marginAmount = product.sellingPrice - product.purchasePrice;
  const marginPercent =
    product.purchasePrice > 0
      ? Math.round((marginAmount / product.purchasePrice) * 100)
      : 0;

  const handleDelete = () => {
    Alert.alert(
      'Remove Product',
      `Are you sure you want to deactivate "${product.name}"? It will be hidden from the catalog.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (user?.storeId) {
              await softDeleteProduct(user.storeId, product.id);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Title Card */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.nameHindi && (
                <Text style={styles.hindiName}>{product.nameHindi}</Text>
              )}
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>

          {product.barcode && (
            <View style={styles.barcodeBox}>
              <Text style={styles.barcodeLabel}>📷 Barcode:</Text>
              <Text style={styles.barcodeValue}>{product.barcode}</Text>
            </View>
          )}
        </View>

        {/* Stock Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Current Stock Level</Text>
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.stockLarge}>
                {product.currentStock}{' '}
                <Text style={styles.stockUnit}>{product.unit}</Text>
              </Text>
              <Text style={styles.alertThreshold}>
                Alert when below {product.minStockAlert} {product.unit}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stockInBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('StockIn', { productId: product.id })}
            >
              <Text style={styles.stockInBtnText}>+ Inward Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing & Margins Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Pricing & Profit Margin</Text>
          <View style={styles.priceGrid}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Selling Rate</Text>
              <Text style={styles.priceValue}>₹{product.sellingPrice}</Text>
            </View>

            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Purchase Cost</Text>
              <Text style={styles.priceValue}>₹{product.purchasePrice}</Text>
            </View>

            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Net Margin</Text>
              <Text style={[styles.priceValue, { color: '#059669' }]}>
                +{marginPercent}% (₹{marginAmount})
              </Text>
            </View>
          </View>
        </View>

        {/* Loose Scale / Taraju Info */}
        {product.isLoose && (
          <View style={styles.tarajuNotice}>
            <Text style={styles.tarajuEmoji}>⚖️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tarajuTitle}>Taraju Smart Scale Enabled</Text>
              <Text style={styles.tarajuSub}>
                Customer can ask ₹5, ₹10 or custom rupees and grams will calculate automatically.
              </Text>
            </View>
          </View>
        )}

        {/* Recent Stock Log */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Recent Stock Audit Log</Text>
          {loadingHistory ? (
            <ActivityIndicator color={colors.primary} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              No recent movements logged. Inward stock to start audit history.
            </Text>
          ) : (
            history.map((m) => (
              <View key={m.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyType}>
                    {m.type === 'in' ? '🟢 Stock In' : '🔴 Stock Out'} ({m.reason})
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(m.createdAt).toLocaleDateString()} • By {m.performedBy.slice(0, 8)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyQty,
                    { color: m.type === 'in' ? '#059669' : '#DC2626' },
                  ]}
                >
                  {m.type === 'in' ? '+' : '-'}{m.quantity} {product.unit}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Remove Product */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
        >
          <Text style={styles.deleteBtnText}>🗑️ Remove from Catalog</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  hindiName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  barcodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  barcodeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 6,
  },
  barcodeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  alertThreshold: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stockInBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  stockInBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  tarajuNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 14,
  },
  tarajuEmoji: {
    fontSize: 26,
    marginRight: 12,
  },
  tarajuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730A3',
  },
  tarajuSub: {
    fontSize: 11,
    color: '#4F46E5',
    marginTop: 2,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  historyType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyQty: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 10,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
