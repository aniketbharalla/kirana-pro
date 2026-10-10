import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useStoreStore } from '../../store/storeStore';
import { useStaffStore } from '../../store/staffStore';
import { useHardwareStore } from '../../store/hardwareStore';
import { kickCashDrawer } from '../../services/printerService';
import { UpiQrView } from './UpiQrView';
import { createInvoice } from '../../services/invoice';
import { fetchCustomers, createCustomer } from '../../services/khata';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CustomerKhata,
  Invoice,
  PaymentMode,
  generateInvoiceNumber,
  isValidGSTIN,
} from '@kirana-pro/shared';
import { colors } from '../../theme';

export interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { store } = useStoreStore();
  const {
    items,
    totals,
    orderDiscount,
    clearCart,
  } = useCartStore();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // B2B Tax invoice state
  const [isB2B, setIsB2B] = useState(false);
  const [buyerGstin, setBuyerGstin] = useState('');

  // Khata customer state
  const [customers, setCustomers] = useState<CustomerKhata[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerKhata | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  const grandTotal = totals.grandTotal;
  const storeId = user?.storeId || 'demo_store_1';
  const storeName = store?.name || 'Kirana Pro Dukaan';
  const storeUpi = '9876543210@paytm'; // Default / store UPI
  const invoiceNumber = generateInvoiceNumber('INV', Math.floor(Math.random() * 9000) + 1000);

  useEffect(() => {
    if (visible && storeId) {
      setCashTendered(String(grandTotal));
      fetchCustomers(storeId).then(setCustomers);
    }
  }, [visible, storeId, grandTotal]);

  const tenderedAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, Math.round((tenderedAmount - grandTotal) * 100) / 100);

  const handleQuickCash = (amount: number) => {
    setCashTendered(String(amount));
  };

  const handleCompletePayment = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout.');
      return;
    }

    setLoading(true);

    try {
      let finalCustomer = selectedCustomer
        ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            phoneNumber: selectedCustomer.phoneNumber,
          }
        : undefined;

      // If user is adding a new customer in Udhar mode
      if (paymentMode === 'credit' && isAddingNewCustomer) {
        if (!newCustomerName.trim() || newCustomerPhone.trim().length !== 10) {
          Alert.alert('Customer Details Required', 'Please enter customer name and 10-digit mobile number for Udhar.');
          setLoading(false);
          return;
        }

        const createdCust = await createCustomer(storeId, {
          name: newCustomerName.trim(),
          phoneNumber: newCustomerPhone.trim(),
        });
        finalCustomer = {
          id: createdCust.id,
          name: createdCust.name,
          phoneNumber: createdCust.phoneNumber,
        };
      } else if (paymentMode === 'credit' && !selectedCustomer) {
        Alert.alert('Select Customer', 'Please choose a customer from the Khata directory to record Udhar.');
        setLoading(false);
        return;
      }

      if (isB2B && buyerGstin.trim() && !isValidGSTIN(buyerGstin.trim())) {
        Alert.alert('Invalid GSTIN', 'Please enter a valid 15-character GSTIN (e.g. 07AABCK1234F1Z5).');
        setLoading(false);
        return;
      }

      const { activeStaff, counterNumber, recordShiftSale } = useStaffStore.getState();

      const invoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
        invoiceNumber,
        storeId,
        items,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        paymentMode,
        paymentStatus: paymentMode === 'credit' ? 'unpaid' : 'paid',
        amountPaid: paymentMode === 'credit' ? 0 : totals.grandTotal,
        amountDue: paymentMode === 'credit' ? totals.grandTotal : 0,
        customer: finalCustomer,
        customerGstin: isB2B && buyerGstin.trim() ? buyerGstin.trim().toUpperCase() : undefined,
        isB2B,
        counterNumber: counterNumber || 1,
        staffId: activeStaff?.id,
        staffName: activeStaff?.name,
        cashTendered: paymentMode === 'cash' ? tenderedAmount : undefined,
        changeDue: paymentMode === 'cash' ? changeDue : undefined,
        createdBy: user?.uid || 'demo_owner',
      };

      const finalInvoice = await createInvoice(storeId, invoiceData, user?.uid || 'demo_owner');

      // Record in current cashier counter shift
      recordShiftSale(totals.grandTotal, paymentMode);

      // Trigger automatic cash drawer kick on cash payments
      const hwSettings = useHardwareStore.getState().getPrinterSettings();
      if (paymentMode === 'cash' && hwSettings.autoKickDrawer) {
        kickCashDrawer(hwSettings).catch(() => {});
      }

      clearCart();
      setLoading(false);
      onClose();
      onSuccess(finalInvoice);
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message || 'Failed to process checkout.');
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Checkout & Payment</Text>
              <Text style={styles.sheetSubtitle}>
                {invoiceNumber} • {items.length} items
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Due Banner */}
          <View style={styles.amountBanner}>
            <Text style={styles.amountBannerLabel}>TOTAL PAYABLE</Text>
            <Text style={styles.amountBannerVal}>₹{grandTotal}</Text>
          </View>

          {/* B2B Tax Invoice Toggle */}
          <TouchableOpacity
            style={[styles.b2bToggleRow, isB2B && styles.b2bToggleRowActive]}
            activeOpacity={0.8}
            onPress={() => setIsB2B(!isB2B)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="briefcase" size={16} color={colors.primary} />
              <Text style={styles.b2bToggleText}>B2B Tax Invoice (व्यापार बिल / GST)</Text>
            </View>
            <View style={[styles.checkbox, isB2B && styles.checkboxActive]}>
              {isB2B && <Feather name="check" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>

          {isB2B && (
            <View style={styles.gstinInputBox}>
              <Text style={styles.gstinLabel}>BUYER GSTIN (15 DIGITS)</Text>
              <TextInput
                style={styles.gstinInput}
                placeholder="e.g. 07AABCK1234F1Z5"
                placeholderTextColor={colors.textMuted}
                value={buyerGstin}
                onChangeText={setBuyerGstin}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>
          )}

          {/* Payment Mode Selector Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.tab, paymentMode === 'cash' && styles.tabActive]}
              onPress={() => setPaymentMode('cash')}
            >
              <Feather
                name="dollar-sign"
                size={15}
                color={paymentMode === 'cash' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, paymentMode === 'cash' && styles.tabTextActive]}>
                Cash (नकद)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, paymentMode === 'upi' && styles.tabActive]}
              onPress={() => setPaymentMode('upi')}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={15}
                color={paymentMode === 'upi' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, paymentMode === 'upi' && styles.tabTextActive]}>
                UPI QR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, paymentMode === 'credit' && styles.tabActive]}
              onPress={() => setPaymentMode('credit')}
            >
              <Feather
                name="book-open"
                size={15}
                color={paymentMode === 'credit' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, paymentMode === 'credit' && styles.tabTextActive]}>
                Khata (उधार)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* 1. CASH PAYMENT VIEW */}
            {paymentMode === 'cash' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>CASH RECEIVED (TENDERED)</Text>
                <TextInput
                  style={styles.cashInput}
                  value={cashTendered}
                  onChangeText={setCashTendered}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />

                {/* Quick Note Buttons */}
                <View style={styles.quickCashRow}>
                  <TouchableOpacity
                    style={styles.quickCashBtn}
                    onPress={() => handleQuickCash(grandTotal)}
                  >
                    <Text style={styles.quickCashText}>Exact (₹{grandTotal})</Text>
                  </TouchableOpacity>
                  {[100, 200, 500, 2000].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.quickCashBtn}
                      onPress={() => handleQuickCash(amt)}
                    >
                      <Text style={styles.quickCashText}>₹{amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Change Calculation Box */}
                <View style={styles.changeCard}>
                  <Text style={styles.changeLabel}>CHANGE TO RETURN</Text>
                  <Text style={[styles.changeVal, changeDue > 0 && styles.changeValActive]}>
                    ₹{changeDue}
                  </Text>
                </View>
              </View>
            )}

            {/* 2. UPI QR VIEW */}
            {paymentMode === 'upi' && (
              <UpiQrView
                vpa={storeUpi}
                payeeName={storeName}
                amount={grandTotal}
                invoiceNumber={invoiceNumber}
              />
            )}

            {/* 3. KHATA / UDHAR VIEW */}
            {paymentMode === 'credit' && (
              <View style={styles.sectionCard}>
                <View style={styles.khataToggleRow}>
                  <Text style={styles.sectionLabel}>CUSTOMER KHATA</Text>
                  <TouchableOpacity
                    onPress={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  >
                    <Text style={styles.khataToggleText}>
                      {isAddingNewCustomer ? 'Select Existing' : '+ New Customer'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isAddingNewCustomer ? (
                  <View style={styles.newCustForm}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Customer Name (e.g. Ramesh Bhai)"
                      placeholderTextColor="#94A3B8"
                      value={newCustomerName}
                      onChangeText={setNewCustomerName}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Mobile Number (10 digits)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={newCustomerPhone}
                      onChangeText={setNewCustomerPhone}
                    />
                  </View>
                ) : (
                  <View>
                    {customers.length === 0 ? (
                      <Text style={styles.noCustomers}>
                        No customers in Khata yet. Tap "+ New Customer" above to add.
                      </Text>
                    ) : (
                      customers.map((cust) => {
                        const isSelected = selectedCustomer?.id === cust.id;
                        return (
                          <TouchableOpacity
                            key={cust.id}
                            style={[
                              styles.customerRow,
                              isSelected && styles.customerRowSelected,
                            ]}
                            onPress={() => setSelectedCustomer(cust)}
                          >
                            <View>
                              <Text style={styles.custName}>{cust.name}</Text>
                              <Text style={styles.custPhone}>{cust.phoneNumber}</Text>
                            </View>
                            <View style={styles.balanceBadge}>
                              <Text style={styles.balanceText}>
                                Due: ₹{cust.currentBalance}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.finishBtn, loading && styles.finishBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleCompletePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.finishBtnText}>
                  {paymentMode === 'credit'
                    ? `Record Udhar (₹${grandTotal})`
                    : `Complete & Generate Bill (₹${grandTotal})`}
                </Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  amountBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  amountBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  amountBannerVal: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primaryDark,
    marginTop: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  bodyScroll: {
    maxHeight: 280,
  },
  sectionCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cashInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  quickCashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  quickCashBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickCashText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  changeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  changeVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: 2,
  },
  changeValActive: {
    color: colors.danger,
  },
  khataToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  khataToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  newCustForm: {
    gap: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  noCustomers: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  customerRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  custName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  custPhone: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  balanceBadge: {
    backgroundColor: 'rgba(234, 84, 85, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  balanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  finishBtn: {
    backgroundColor: colors.primary, // MasterX Royal Purple
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  finishBtnDisabled: {
    opacity: 0.6,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  b2bToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  b2bToggleRowActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  b2bToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  gstinInputBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  gstinLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  gstinInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
