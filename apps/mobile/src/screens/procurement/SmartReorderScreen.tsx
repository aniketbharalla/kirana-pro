import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useProductStore } from '../../store/productStore';
import { useSupplierStore } from '../../store/supplierStore';
import { useAuthStore } from '../../store/authStore';
import {
  computeReorderRecommendations,
  formatWhatsAppPurchaseOrder,
  generateWhatsAppOrderUrl,
} from '../../services/reorder';
import { Invoice } from '@kirana-pro/shared';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirestoreDb } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const SmartReorderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { products } = useProductStore();
  const { suppliers } = useSupplierStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    suppliers.length > 0 ? suppliers[0].id : null
  );
  const [customPhone, setCustomPhone] = useState(
    suppliers.length > 0 && suppliers[0].phone ? suppliers[0].phone : '9876543210'
  );
  const [deliveryNote, setDeliveryNote] = useState('Please confirm stock and dispatch today.');

  // Editable item quantities for the purchase order
  const [orderQuantities, setOrderQuantities] = useState<Map<string, number>>(new Map());

  // Fetch recent invoices to calculate sales velocity
  useEffect(() => {
    const fetchRecentInvoices = async () => {
      if (!user?.storeId) return;
      setLoading(true);
      try {
        const db = getFirestoreDb();
        const invCol = collection(db, 'stores', user.storeId, 'invoices');
        const q = query(invCol, orderBy('createdAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as Invoice);
        setInvoices(list);
      } catch (e) {
        console.warn('Could not fetch invoices for velocity:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvoices();
  }, [user?.storeId]);

  const reorderSummary = computeReorderRecommendations(products, invoices, 7);

  // Initialize order quantities from suggestions
  useEffect(() => {
    const qMap = new Map<string, number>();
    reorderSummary.recommendations.forEach((rec) => {
      if (rec.suggestedQty > 0) {
        qMap.set(rec.product.id, rec.suggestedQty);
      }
    });
    setOrderQuantities(qMap);
  }, [products, invoices]);

  const handleUpdateQty = (productId: string, delta: number) => {
    setOrderQuantities((prev) => {
      const next = new Map(prev);
      const current = next.get(productId) || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        next.delete(productId);
      } else {
        next.set(productId, updated);
      }
      return next;
    });
  };

  const handleSelectSupplier = (suppId: string) => {
    setSelectedSupplierId(suppId);
    const found = suppliers.find((s) => s.id === suppId);
    if (found?.phone) {
      setCustomPhone(found.phone);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Items included in the purchase order
  const itemsToOrder = reorderSummary.recommendations
    .filter((r) => (orderQuantities.get(r.product.id) || 0) > 0)
    .map((r) => ({
      product: r.product,
      quantity: orderQuantities.get(r.product.id) || 0,
      cost: (orderQuantities.get(r.product.id) || 0) * (r.product.purchasePrice || 0),
    }));

  const totalPOCost = itemsToOrder.reduce((acc, i) => acc + i.cost, 0);

  const handleSendWhatsAppOrder = async () => {
    if (itemsToOrder.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least 1 item with quantity > 0 to send.');
      return;
    }

    const storeName = user?.displayName ? `${user.displayName}'s Dukaan` : 'Kirana Store';
    const supplierName = selectedSupplier?.name || 'Wholesale Distributor';

    const orderPayload = itemsToOrder.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      unit: i.product.unit || 'units',
    }));

    const message = formatWhatsAppPurchaseOrder(
      storeName,
      supplierName,
      orderPayload,
      deliveryNote
    );

    const url = generateWhatsAppOrderUrl(customPhone, message);

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${customPhone}&text=${encodeURIComponent(message)}`);
      }
    } catch {
      Alert.alert(
        'WhatsApp Order Ready',
        'Could not open WhatsApp app automatically. You can copy the order details.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconCircle}>
            <Feather name="zap" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Smart Reorder Engine</Text>
            <Text style={styles.headerSub}>
              Stock burn velocity & 1-tap WhatsApp purchase orders
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="x" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.backBtnText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* KPI Alert Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconBadge}>
            <Feather name="alert-triangle" size={18} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              {reorderSummary.criticalCount} Critical • {reorderSummary.highCount} Low Stock Items
            </Text>
            <Text style={styles.alertDesc}>
              Items marked Critical will run out within 24–48 hours based on recent billing velocity.
            </Text>
          </View>
        </View>

        {/* Supplier Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Select Wholesaler / Distributor</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.supplierScroll}
          >
            {suppliers.map((supp) => {
              const isSelected = selectedSupplierId === supp.id;
              return (
                <TouchableOpacity
                  key={supp.id}
                  style={[styles.supplierPill, isSelected && styles.supplierPillActive]}
                  onPress={() => handleSelectSupplier(supp.id)}
                >
                  <Feather
                    name="briefcase"
                    size={12}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.supplierPillText,
                      isSelected && styles.supplierPillTextActive,
                    ]}
                  >
                    {supp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.phoneInputRow}>
            <Text style={styles.inputPrefix}>WhatsApp Phone: +91</Text>
            <TextInput
              style={styles.phoneInput}
              keyboardType="phone-pad"
              value={customPhone}
              onChangeText={setCustomPhone}
              placeholder="10-digit mobile..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Recommended Items List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>2. Replenishment Recommendations</Text>
            <Text style={styles.selectedCountBadge}>
              {itemsToOrder.length} items (₹{totalPOCost.toLocaleString('en-IN')})
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            reorderSummary.recommendations.map((rec) => {
              const qty = orderQuantities.get(rec.product.id) || 0;
              const isCritical = rec.urgency === 'CRITICAL';
              const isHigh = rec.urgency === 'HIGH';

              return (
                <View
                  key={rec.product.id}
                  style={[
                    styles.itemCard,
                    isCritical && styles.itemCardCritical,
                    isHigh && styles.itemCardHigh,
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{rec.product.name}</Text>
                      {rec.product.nameHindi ? (
                        <Text style={styles.itemHindi}>{rec.product.nameHindi}</Text>
                      ) : null}
                    </View>

                    {/* Urgency Badge */}
                    <View
                      style={[
                        styles.urgencyBadge,
                        isCritical
                          ? styles.badgeCritical
                          : isHigh
                          ? styles.badgeHigh
                          : styles.badgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          isCritical
                            ? styles.textCritical
                            : isHigh
                            ? styles.textHigh
                            : styles.textNormal,
                        ]}
                      >
                        {isCritical
                          ? 'CRITICAL'
                          : isHigh
                          ? 'LOW STOCK'
                          : 'SUFFICIENT'}
                      </Text>
                    </View>
                  </View>

                  {/* Velocity & Stock Metrics */}
                  <View style={styles.metricRow}>
                    <Text style={styles.metricText}>
                      Stock:{' '}
                      <Text style={{ fontWeight: '700', color: colors.text }}>
                        {rec.product.currentStock} {rec.product.unit}
                      </Text>
                    </Text>
                    <Text style={styles.metricDot}>•</Text>
                    <Text style={styles.metricText}>
                      Velocity:{' '}
                      <Text style={{ fontWeight: '700', color: colors.primary }}>
                        {rec.dailyVelocity}/day
                      </Text>
                    </Text>
                    <Text style={styles.metricDot}>•</Text>
                    <Text style={styles.metricText}>
                      Runs out in:{' '}
                      <Text
                        style={{
                          fontWeight: '700',
                          color: isCritical ? colors.danger : colors.systemOrange,
                        }}
                      >
                        {rec.daysRemaining !== null ? `${rec.daysRemaining} days` : 'N/A'}
                      </Text>
                    </Text>
                  </View>

                  {/* Quantity Adjustment Controls */}
                  <View style={styles.qtyControlRow}>
                    <View>
                      <Text style={styles.costLabel}>
                        Cost: ₹{rec.product.purchasePrice || 0} / unit
                      </Text>
                      <Text style={styles.totalLineCost}>
                        Line Total: ₹{(qty * (rec.product.purchasePrice || 0)).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateQty(rec.product.id, -5)}
                      >
                        <Text style={styles.stepBtnText}>-5</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateQty(rec.product.id, -1)}
                      >
                        <Text style={styles.stepBtnText}>-1</Text>
                      </TouchableOpacity>

                      <View style={styles.qtyDisplay}>
                        <Text style={styles.qtyDisplayText}>{qty}</Text>
                        <Text style={styles.qtyUnitText}>{rec.product.unit}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateQty(rec.product.id, 1)}
                      >
                        <Text style={styles.stepBtnText}>+1</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateQty(rec.product.id, 5)}
                      >
                        <Text style={styles.stepBtnText}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Delivery Note */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Special Delivery Instructions</Text>
          <TextInput
            style={styles.noteInput}
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            placeholder="e.g. Please deliver before 3 PM, dispatch with invoice..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        {/* WhatsApp Dispatch Button */}
        <TouchableOpacity
          style={styles.dispatchBtn}
          activeOpacity={0.88}
          onPress={handleSendWhatsAppOrder}
        >
          <Feather name="share-2" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.dispatchBtnTitle}>
              Send WhatsApp Purchase Order (₹{totalPOCost.toLocaleString('en-IN')})
            </Text>
            <Text style={styles.dispatchBtnSub}>
              Directly dispatches formatted PO to {selectedSupplier?.name || 'Supplier'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 84, 85, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 84, 85, 0.25)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  alertIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 84, 85, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  alertDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  selectedCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  supplierScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  supplierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  supplierPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  supplierPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  supplierPillTextActive: {
    color: '#FFFFFF',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  inputPrefix: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 8,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCardCritical: {
    borderColor: 'rgba(234, 84, 85, 0.4)',
    backgroundColor: 'rgba(234, 84, 85, 0.04)',
  },
  itemCardHigh: {
    borderColor: 'rgba(255, 159, 67, 0.4)',
    backgroundColor: 'rgba(255, 159, 67, 0.04)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemHindi: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCritical: {
    backgroundColor: 'rgba(234, 84, 85, 0.12)',
  },
  badgeHigh: {
    backgroundColor: 'rgba(255, 159, 67, 0.12)',
  },
  badgeNormal: {
    backgroundColor: 'rgba(40, 199, 111, 0.12)',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textCritical: {
    color: colors.danger,
  },
  textHigh: {
    color: colors.systemOrange,
  },
  textNormal: {
    color: colors.systemGreen,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metricText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metricDot: {
    fontSize: 11,
    color: colors.border,
  },
  qtyControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  costLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  totalLineCost: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  qtyDisplay: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 42,
  },
  qtyDisplayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  qtyUnitText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    fontSize: 12,
    color: colors.text,
    minHeight: 50,
  },
  dispatchBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
    marginBottom: 24,
  },
  dispatchBtnTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  dispatchBtnSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    marginTop: 2,
  },
});
