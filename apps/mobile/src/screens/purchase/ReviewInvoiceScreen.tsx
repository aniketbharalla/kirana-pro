import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { useSupplierStore } from '../../store/supplierStore';
import { recordPurchaseInvoice } from '../../services/purchase';
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
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [resolvedSupplierId, setResolvedSupplierId] = useState<string>(supplierId);

  // Compute live totals
  const subtotal = items.reduce((sum, i) => sum + i.taxableAmt, 0);
  const totalCGST = items.reduce((sum, i) => sum + i.cgstAmt, 0);
  const totalSGST = items.reduce((sum, i) => sum + i.sgstAmt, 0);
  const totalTax = totalCGST + totalSGST;
  const netPayable = Math.round((subtotal + totalTax) * 100) / 100;

  const handleConfirmInwarding = async () => {
    try {
      setIsSubmitting(true);

      const matchedSup = suppliers.find(
        (s) => s.name.trim().toLowerCase() === supplierName.trim().toLowerCase()
      );
      const targetSupId = initialSupplier?.id || matchedSup?.id || supplierId || `sup_${Date.now()}`;
      setResolvedSupplierId(targetSupId);

      const finalInvoice: PurchaseInvoice = {
        id: `purch_${Date.now()}`,
        storeId,
        supplierId: targetSupId,
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

      (finalInvoice as any).supplierPhone = draft.supplierPhone || '7415845631';
      (finalInvoice as any).supplierGstin = draft.supplierGstin || '23MNQPK6685L1Z0';
      (finalInvoice as any).supplierAddress = draft.supplierAddress || 'Bhopal Mandi, Bhopal';

      await recordPurchaseInvoice(storeId, finalInvoice);
      setIsSuccessModalVisible(true);
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
            <Text style={styles.newBadgeText}>New Item</Text>
          </View>
        ) : (
          <View style={styles.matchedBadge}>
            <Feather name="check" size={10} color="#7367F0" style={{ marginRight: 3 }} />
            <Text style={styles.matchedBadgeText}>Matched</Text>
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
            <Feather name="check-circle" size={12} color="#28C76F" style={{ marginRight: 4 }} />
            <Text style={styles.confidenceText}>88% Match</Text>
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
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>
                Confirm & Inward to Stock ({items.length} items)
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Inwarding Success Notification & Next Action Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsSuccessModalVisible(false);
          navigation.replace('SupplierList');
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconBadge}>
              <Feather name="check-circle" size={32} color="#28C76F" />
            </View>

            <Text style={styles.successTitle}>Stock Inwarded Successfully</Text>
            <Text style={styles.successSubtitle}>
              Catalog inventory updated for <Text style={{ fontWeight: '700' }}>{items.length} FMCG items</Text>.
            </Text>

            <View style={styles.successDetailsBox}>
              <View style={styles.successRow}>
                <Text style={styles.successDetailLabel}>Vendor / Wholesaler</Text>
                <Text style={styles.successDetailVal}>{supplierName}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successDetailLabel}>Invoice Bill No</Text>
                <Text style={styles.successDetailVal}>#{invoiceNo}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successDetailLabel}>Total Inward Value</Text>
                <Text style={styles.successDetailValBold}>₹{netPayable.toFixed(2)}</Text>
              </View>
              <View style={[styles.successRow, styles.pendingRow]}>
                <Text style={styles.pendingLabel}>Pending Amount to Pay</Text>
                <Text style={styles.pendingVal}>₹{netPayable.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.goToLedgerBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.replace('SupplierDetail', { supplierId: resolvedSupplierId });
              }}
              activeOpacity={0.85}
            >
              <Feather name="credit-card" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.goToLedgerBtnText}>
                View Vendor Ledger & Pay Dues
              </Text>
              <Feather name="chevron-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToSuppliersBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.replace('SupplierList');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.backToSuppliersBtnText}>
                Done (Back to Wholesalers)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  summaryCard: {
    backgroundColor: '#2F2B3D',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#A8AAAE',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summarySupplier: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  summaryInvNo: {
    fontSize: 12,
    color: '#A8AAAE',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#E8FADF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    color: '#28C76F',
    fontSize: 12,
    fontWeight: '600',
  },
  taxSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  taxCol: {
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: 10,
    color: '#A8AAAE',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  taxVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  netPayableVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9F43',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B465C',
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIndex: {
    fontSize: 12,
    color: '#82808B',
    fontWeight: '600',
    marginRight: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B465C',
  },
  newBadge: {
    backgroundColor: '#EDEBFD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#7367F0',
    fontSize: 10,
    fontWeight: '600',
  },
  matchedBadge: {
    backgroundColor: '#EDEBFD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchedBadgeText: {
    color: '#7367F0',
    fontSize: 10,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F0F2',
  },
  detailCol: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 10,
    color: '#82808B',
  },
  detailVal: {
    fontSize: 12,
    color: '#5D596C',
    marginTop: 2,
  },
  detailValBold: {
    fontSize: 12,
    color: '#4B465C',
    fontWeight: '600',
    marginTop: 2,
  },
  detailValHighlight: {
    fontSize: 12,
    color: '#7367F0',
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
    borderTopColor: '#DBDADE',
  },
  confirmBtn: {
    backgroundColor: '#7367F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 43, 61, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8FADF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B465C',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#82808B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 18,
    gap: 8,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDetailLabel: {
    fontSize: 12,
    color: '#82808B',
  },
  successDetailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B465C',
  },
  successDetailValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7367F0',
  },
  pendingRow: {
    borderTopWidth: 1,
    borderTopColor: '#DBDADE',
    paddingTop: 8,
    marginTop: 4,
  },
  pendingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA5455',
  },
  pendingVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EA5455',
  },
  goToLedgerBtn: {
    backgroundColor: '#7367F0',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  goToLedgerBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  backToSuppliersBtn: {
    backgroundColor: '#F8F7FA',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  backToSuppliersBtnText: {
    color: '#4B465C',
    fontWeight: '600',
    fontSize: 13,
  },
});

