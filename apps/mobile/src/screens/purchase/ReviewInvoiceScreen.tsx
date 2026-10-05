import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { useSupplierStore } from '../../store/supplierStore';
import { recordPurchaseInvoice } from '../../services/purchase';
import { colors } from '../../theme';
import {
  PurchaseInvoiceDraft,
  PurchaseItem,
  Supplier,
  PurchaseInvoice,
} from '@kirana-pro/shared';

export const ReviewInvoiceScreen = ({ route, navigation }: any) => {
  const { user } = useAuthStore();
  const storeId = user?.storeId || 'dev_store_001';
  const products = useProductStore((state) => state.products);
  const suppliers = useSupplierStore((state) => state.suppliers);

  const draft: PurchaseInvoiceDraft = route.params?.draft;
  const initialSupplier: Supplier | undefined = route.params?.supplier;

  const [items, setItems] = useState<PurchaseItem[]>(() => {
    // Attempt auto-match each item to existing catalog products by name
    return (draft.items || []).map((item) => {
      const match = products.find(
        (p) =>
          p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
          item.productName.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) {
        return {
          ...item,
          productId: match.id,
          isNewProduct: false,
        };
      }
      return item;
    });
  });

  const [supplierId, setSupplierId] = useState(
    initialSupplier?.id || (suppliers.length > 0 ? suppliers[0].id : 'sup_parle_01')
  );
  const [supplierName, setSupplierName] = useState(
    initialSupplier?.name || draft.supplierName || 'N R ENTERPRISES (Parle)'
  );
  const [invoiceNo, setInvoiceNo] = useState(
    draft.invoiceNo || `NR/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live totals
  const subtotal = items.reduce((sum, i) => sum + i.taxableAmt, 0);
  const totalCGST = items.reduce((sum, i) => sum + i.cgstAmt, 0);
  const totalSGST = items.reduce((sum, i) => sum + i.sgstAmt, 0);
  const totalTax = totalCGST + totalSGST;
  const netPayable = Math.round((subtotal + totalTax) * 100) / 100;

  const handleConfirmInwarding = async () => {
    try {
      setIsSubmitting(true);

      const finalInvoice: PurchaseInvoice = {
        id: `purch_${Date.now()}`,
        storeId,
        supplierId,
        supplierName,
        invoiceNo,
        invoiceDate: Date.now(),
        items,
        subtotal,
        totalDiscount: 0,
        totalCGST,
        totalSGST,
        totalTax,
        roundOff: 0,
        netPayable,
        paymentStatus: 'Unpaid',
        paidAmt: 0,
        createdBy: user?.uid || 'owner',
        createdAt: Date.now(),
      };

      await recordPurchaseInvoice(storeId, finalInvoice);

      Alert.alert(
        'Stock Updated Successfully! 🎉',
        `Inwarded ${items.length} items from ${supplierName}. Net Payable: ₹${netPayable.toFixed(2)}`,
        [
          {
            text: 'View Purchases',
            onPress: () => navigation.navigate('SupplierList'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Inwarding Failed', err.message || 'Could not record invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemRow = ({ item, index }: { item: PurchaseItem; index: number }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemIndex}>#{index + 1}</Text>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.productName}
        </Text>
        {item.isNewProduct ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>+ New Item</Text>
          </View>
        ) : (
          <View style={styles.matchedBadge}>
            <Text style={styles.matchedBadgeText}>✓ Matched</Text>
          </View>
        )}
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>HSN</Text>
          <Text style={styles.detailVal}>{item.hsnCode || '—'}</Text>
        </View>

        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Inward Qty</Text>
          <Text style={styles.detailValBold}>
            {item.totalQty} {item.uomMapped}s
          </Text>
        </View>

        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Unit Rate</Text>
          <Text style={styles.detailVal}>₹{item.rate.toFixed(2)}</Text>
        </View>

        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Total (inc. GST)</Text>
          <Text style={styles.detailValHighlight}>₹{item.totalAmt.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryLabel}>Supplier / Agency</Text>
            <Text style={styles.summarySupplier}>{supplierName}</Text>
            <Text style={styles.summaryInvNo}>Bill: {invoiceNo}</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>🎯 88% Match</Text>
          </View>
        </View>

        <View style={styles.taxSplitRow}>
          <View style={styles.taxCol}>
            <Text style={styles.taxLabel}>Subtotal</Text>
            <Text style={styles.taxVal}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.taxCol}>
            <Text style={styles.taxLabel}>CGST (2.5%)</Text>
            <Text style={styles.taxVal}>₹{totalCGST.toFixed(2)}</Text>
          </View>
          <View style={styles.taxCol}>
            <Text style={styles.taxLabel}>SGST (2.5%)</Text>
            <Text style={styles.taxVal}>₹{totalSGST.toFixed(2)}</Text>
          </View>
          <View style={styles.taxCol}>
            <Text style={styles.taxLabel}>Net Payable</Text>
            <Text style={styles.netPayableVal}>₹{netPayable.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Extracted Line Items ({items.length})
      </Text>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(_, idx) => `item_${idx}`}
        renderItem={renderItemRow}
        contentContainerStyle={styles.listContent}
      />

      {/* Footer Inward Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, isSubmitting && styles.confirmBtnDisabled]}
          onPress={handleConfirmInwarding}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>
              ✓ Confirm & Inward to Stock ({items.length} items)
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summarySupplier: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  summaryInvNo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  taxSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  taxCol: {
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  taxVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  netPayableVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIndex: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    marginRight: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  newBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
  },
  matchedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchedBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  detailCol: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  detailVal: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailValBold: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  detailValHighlight: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
