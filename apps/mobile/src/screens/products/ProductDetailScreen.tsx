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
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { softDeleteProduct } from '../../services/product';
import { fetchStockHistory } from '../../services/stock';
import { Product, StockMovement } from '@kirana-pro/shared';

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
        .then((items: StockMovement[]) => setHistory(items.slice(0, 5)))
        .catch((e: any) => console.warn('Could not load stock history:', e))
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
            activeOpacity={0.85}
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
              <Feather name="maximize" size={14} color="#82808B" style={{ marginRight: 6 }} />
              <Text style={styles.barcodeLabel}>Barcode:</Text>
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
              <Feather name="plus" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.stockInBtnText}>Inward Stock</Text>
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
              <Text style={[styles.priceValue, { color: '#28C76F' }]}>
                +{marginPercent}% (₹{marginAmount})
              </Text>
            </View>
          </View>
        </View>

        {/* Loose Scale / Taraju Info */}
        {product.isLoose && (
          <View style={styles.tarajuNotice}>
            <View style={styles.tarajuIconBox}>
              <Feather name="sliders" size={18} color="#7367F0" />
            </View>
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
            <ActivityIndicator color="#7367F0" />
          ) : history.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              No recent movements logged. Inward stock to start audit history.
            </Text>
          ) : (
            history.map((m) => (
              <View key={m.id} style={styles.historyRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather
                      name={m.type === 'in' ? 'arrow-down-left' : 'arrow-up-right'}
                      size={14}
                      color={m.type === 'in' ? '#28C76F' : '#EA5455'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.historyType}>
                      {m.type === 'in' ? 'Stock In' : 'Stock Out'} ({m.reason})
                    </Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(m.createdAt).toLocaleDateString()} • By {m.performedBy.slice(0, 8)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyQty,
                    { color: m.type === 'in' ? '#28C76F' : '#EA5455' },
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
          activeOpacity={0.85}
        >
          <Feather name="trash-2" size={16} color="#EA5455" style={{ marginRight: 6 }} />
          <Text style={styles.deleteBtnText}>Remove from Catalog</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  scroll: {
    padding: 16,
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
    color: '#4B465C',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#7367F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4B465C',
  },
  hindiName: {
    fontSize: 14,
    color: '#82808B',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#EDEBFD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7367F0',
  },
  barcodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F0F2',
  },
  barcodeLabel: {
    fontSize: 12,
    color: '#82808B',
    marginRight: 6,
  },
  barcodeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B465C',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#82808B',
    marginBottom: 10,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4B465C',
  },
  stockUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#82808B',
  },
  alertThreshold: {
    fontSize: 12,
    color: '#A8AAAE',
    marginTop: 2,
  },
  stockInBtn: {
    backgroundColor: '#7367F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  stockInBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    color: '#82808B',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B465C',
    marginTop: 4,
  },
  tarajuNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEBFD',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
    marginBottom: 14,
  },
  tarajuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tarajuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7367F0',
  },
  tarajuSub: {
    fontSize: 11,
    color: '#5D596C',
    marginTop: 2,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#82808B',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F2',
  },
  historyType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B465C',
  },
  historyDate: {
    fontSize: 11,
    color: '#82808B',
    marginTop: 2,
  },
  historyQty: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#FCE4E4',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EA5455',
    marginTop: 10,
  },
  deleteBtnText: {
    color: '#EA5455',
    fontWeight: '600',
    fontSize: 14,
  },
});
