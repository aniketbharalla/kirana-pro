import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  FlatList,
} from 'react-native';
import { useSupplierStore } from '../../store/supplierStore';
import { useAuthStore } from '../../store/authStore';
import { Supplier, SupplierTransaction } from '@kirana-pro/shared';
import { Feather } from '@expo/vector-icons';
import { ToastBanner } from '../../components/common/ToastBanner';
import { colors } from '../../theme';

export const SupplierDetailScreen = ({ route, navigation }: any) => {
  const { supplierId } = route.params || {};
  const { user } = useAuthStore();
  const {
    suppliers,
    recordPayment,
    getSupplierTransactions,
    getSupplierPurchases,
  } = useSupplierStore();

  const supplier: Supplier | undefined =
    suppliers.find((s) => s.id === supplierId) || route.params?.supplier;

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState(
    supplier ? String(Math.round(supplier.balance * 100) / 100) : '0'
  );
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank' | 'Cheque'>('UPI');
  const [payNote, setPayNote] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices'>('transactions');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  if (!supplier) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Wholesaler not found</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('SupplierList')}
        >
          <Text style={styles.backBtnText}>Back to Wholesalers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const transactions = getSupplierTransactions(supplier.id);
  const purchases = getSupplierPurchases(supplier.id);

  const handleRecordPayment = () => {
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) return;

    recordPayment(supplier.id, num, payMode, payNote);
    setIsPaymentModalVisible(false);
    setPaymentSuccessToast(`Payment of ₹${num.toFixed(2)} recorded successfully via ${payMode}!`);
    setTimeout(() => setPaymentSuccessToast(null), 4000);
  };

  const handleShareWhatsApp = () => {
    const text = `Namaste ${supplier.name}, here is our Kirana Pro purchase ledger update:\nTotal Purchases: ₹${supplier.totalPurchases.toFixed(2)}\nTotal Paid: ₹${(supplier.totalPaid || 0).toFixed(2)}\nCurrent Pending Balance: ₹${supplier.balance.toFixed(2)}\nThank you!`;
    const url = `whatsapp://send?phone=91${supplier.phone}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/91${supplier.phone}?text=${encodeURIComponent(text)}`);
    });
  };

  const renderTransactionItem = ({ item }: { item: SupplierTransaction }) => {
    const isPayment = item.type === 'PAYMENT';
    return (
      <View style={styles.txnCard}>
        <View style={styles.txnLeft}>
          <View
            style={[
              styles.txnIconBg,
              isPayment ? styles.txnIconPayment : styles.txnIconInvoice,
            ]}
          >
            <Feather
              name={isPayment ? 'credit-card' : 'file-text'}
              size={15}
              color={isPayment ? '#28C76F' : '#7367F0'}
            />
          </View>
          <View>
            <Text style={styles.txnTitle}>
              {isPayment ? `Payment (${item.paymentMode || 'Cash'})` : `Inward Bill #${item.invoiceNo || ''}`}
            </Text>
            <Text style={styles.txnSubtitle}>{item.note || new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.txnDate}>
              {new Date(item.createdAt).toLocaleDateString()} at{' '}
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.txnRight}>
          <Text
            style={[
              styles.txnAmount,
              isPayment ? styles.txnAmountPaid : styles.txnAmountBilled,
            ]}
          >
            {isPayment ? `- ₹${item.amount.toFixed(2)}` : `+ ₹${item.amount.toFixed(2)}`}
          </Text>
          <Text style={styles.txnBalanceLabel}>
            Bal: ₹{item.balanceAfter.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {paymentSuccessToast ? (
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <ToastBanner
            type="success"
            title="Payment Recorded"
            message={paymentSuccessToast}
            onClose={() => setPaymentSuccessToast(null)}
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Vendor Header Card */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{supplier.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{supplier.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="phone" size={11} color="#6F6B7D" />
                <Text style={styles.vendorPhone}>{supplier.phone}</Text>
              </View>
              {supplier.gstin ? (
                <Text style={styles.vendorGstin}>GST: {supplier.gstin}</Text>
              ) : null}
            </View>
          </View>

          {supplier.address ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Feather name="map-pin" size={11} color="#6F6B7D" />
              <Text style={styles.vendorAddress}>{supplier.address}</Text>
            </View>
          ) : null}
        </View>

        {/* Pending Dues Banner */}
        <View style={styles.duesCard}>
          <View style={styles.duesHeader}>
            <Text style={styles.duesLabel}>Current Amount Pending to Pay</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {supplier.balance > 0 ? 'DUE TO VENDOR' : 'SETTLED'}
              </Text>
            </View>
          </View>

          <Text style={styles.duesAmount}>₹{supplier.balance.toFixed(2)}</Text>

          <View style={styles.duesStatsRow}>
            <View style={styles.duesStat}>
              <Text style={styles.duesStatLabel}>Total Inwarded</Text>
              <Text style={styles.duesStatVal}>₹{supplier.totalPurchases.toFixed(2)}</Text>
            </View>
            <View style={styles.duesStatDivider} />
            <View style={styles.duesStat}>
              <Text style={styles.duesStatLabel}>Total Paid</Text>
              <Text style={styles.duesStatValGreen}>₹{(supplier.totalPaid || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.duesStatDivider} />
            <View style={styles.duesStat}>
              <Text style={styles.duesStatLabel}>Total Bills</Text>
              <Text style={styles.duesStatVal}>{supplier.invoiceCount || 0}</Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={() => {
                setPayAmount(String(Math.round(supplier.balance * 100) / 100));
                setIsPaymentModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Feather name="credit-card" size={14} color="#FFFFFF" />
                <Text style={styles.payNowBtnText}>Record Payment to Vendor</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsAppBtn} onPress={handleShareWhatsApp}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Feather name="message-circle" size={14} color="#FFFFFF" />
                <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inward New Bill CTA */}
        <TouchableOpacity
          style={styles.scanBillBar}
          onPress={() => navigation.navigate('ScanInvoice', { supplier })}
        >
          <View style={{ marginRight: 12 }}>
            <Feather name="camera" size={20} color="#7367F0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanBillBarTitle}>Scan & Inward New Bill</Text>
            <Text style={styles.scanBillBarSub}>Upload Parle/distributor invoice photo for OCR</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#7367F0" />
        </TouchableOpacity>

        {/* History Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'transactions' && styles.tabItemActive]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'transactions' && styles.tabTextActive,
              ]}
            >
              Payment & Bill Ledger ({transactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'invoices' && styles.tabItemActive]}
            onPress={() => setActiveTab('invoices')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'invoices' && styles.tabTextActive,
              ]}
            >
              Invoices ({purchases.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ledger Feed */}
        {activeTab === 'transactions' ? (
          transactions.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Feather name="book-open" size={32} color="#A8AAAE" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyFeedText}>No transactions recorded yet.</Text>
              <Text style={styles.emptyFeedSub}>
                Inward a bill or record a payment to start tracking vendor ledger history.
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransactionItem}
              scrollEnabled={false}
            />
          )
        ) : purchases.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Feather name="file-text" size={32} color="#A8AAAE" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyFeedText}>No invoices uploaded yet.</Text>
          </View>
        ) : (
          purchases.map((p) => (
            <View key={p.id} style={styles.invoiceCard}>
              <View style={styles.invoiceCardTop}>
                <View>
                  <Text style={styles.invoiceNo}>Bill #{p.invoiceNo}</Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(p.invoiceDate).toLocaleDateString()} • {p.items.length} items
                  </Text>
                </View>
                <Text style={styles.invoiceAmt}>₹{p.netPayable.toFixed(2)}</Text>
              </View>
              <Text style={styles.invoiceStatus}>
                Status: <Text style={{ fontWeight: '800' }}>{p.paymentStatus}</Text>
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment to {supplier.name}</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                <Feather name="x" size={18} color="#82868B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Payment Amount (₹)</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder="0.00"
            />

            <Text style={styles.inputLabel}>Payment Mode</Text>
            <View style={styles.modeRow}>
              {(['UPI', 'Cash', 'Bank', 'Cheque'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, payMode === mode && styles.modeBtnActive]}
                  onPress={() => setPayMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      payMode === mode && styles.modeBtnTextActive,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Note / Reference ID (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={payNote}
              onChangeText={setPayNote}
              placeholder="e.g. GPay UPI Ref 928374 / Cheque 00192"
            />

            <TouchableOpacity style={styles.submitPayBtn} onPress={handleRecordPayment}>
              <Text style={styles.submitPayBtnText}>
                Confirm Payment of ₹{parseFloat(payAmount || '0').toFixed(2)}
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  toast: {
    backgroundColor: '#065F46',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  vendorTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  vendorPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vendorGstin: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  vendorAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  duesCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  duesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duesLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  duesAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: 8,
  },
  duesStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  duesStat: {
    alignItems: 'center',
    flex: 1,
  },
  duesStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  duesStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  duesStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  duesStatValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  payNowBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  scanBillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEBFD',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
    marginBottom: 16,
  },
  scanBillBarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7367F0',
  },
  scanBillBarSub: {
    fontSize: 11,
    color: '#5E50EE',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 14,
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 20,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txnIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnIconPayment: {
    backgroundColor: '#ECFDF5',
  },
  txnIconInvoice: {
    backgroundColor: '#FEF3C7',
  },
  txnIconText: {
    fontSize: 16,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  txnSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txnDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txnAmountPaid: {
    color: '#059669',
  },
  txnAmountBilled: {
    color: colors.danger,
  },
  txnBalanceLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invoiceAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  invoiceStatus: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyFeedIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyFeedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  emptyFeedSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalClose: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  amountInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.primaryDark,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  submitPayBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitPayBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
