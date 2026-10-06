import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Invoice, formatWhatsAppReceipt } from '@kirana-pro/shared';
import { useStoreStore } from '../../store/storeStore';
import { useHardwareStore } from '../../store/hardwareStore';
import { printInvoiceReceipt } from '../../services/printerService';

export const BillReceiptScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { store } = useStoreStore();

  const invoice: Invoice = route.params?.invoice;
  const storeName = store?.name || 'Kirana Pro Dukaan';
  const storeAddress = store?.address?.city
    ? `${store.address.street}, ${store.address.city}`
    : undefined;
  const storePhone = store?.gstNumber ? `GST: ${store.gstNumber}` : undefined;

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>No invoice selected</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('BillingScreen')}
          >
            <Text style={styles.actionBtnText}>Go to POS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShareWhatsApp = async () => {
    const formattedText = formatWhatsAppReceipt(
      invoice,
      storeName,
      storeAddress,
      storePhone
    );
    const customerPhone = invoice.customer?.phoneNumber?.replace(/\D/g, '') || '';
    const phoneParam = customerPhone ? `91${customerPhone}` : '';
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(formattedText)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Could not open WhatsApp directly. Bill text formatted successfully.');
    }
  };

  const handlePrint = async () => {
    const settings = useHardwareStore.getState().getPrinterSettings();
    const result = await printInvoiceReceipt(
      invoice,
      {
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        gstin: store?.gstNumber,
      },
      settings
    );
    Alert.alert(
      result.success ? 'Receipt Printed 🖨️' : 'Print Notice',
      result.message
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success Banner */}
        <View style={styles.successBadge}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Bill Generated Successfully!</Text>
        </View>

        {/* 58mm Monospaced Thermal Receipt Paper */}
        <View style={styles.paperContainer}>
          <View style={styles.receiptTop}>
            <Text style={styles.storeTitle}>{storeName}</Text>
            {storeAddress && <Text style={styles.receiptSub}>{storeAddress}</Text>}
            {storePhone && <Text style={styles.receiptSub}>{storePhone}</Text>}
            <Text style={styles.divider}>--------------------------------</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Bill: {invoice.invoiceNumber}</Text>
            <Text style={styles.metaText}>
              {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
            </Text>
          </View>

          {invoice.customer?.name && (
            <Text style={styles.customerLine}>
              Customer: {invoice.customer.name} ({invoice.customer.phoneNumber || ''})
            </Text>
          )}

          <Text style={styles.divider}>--------------------------------</Text>

          {/* Items Table */}
          <View style={styles.itemsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colItem, styles.headerText]}>Item</Text>
              <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
              <Text style={[styles.colRate, styles.headerText]}>Rate</Text>
              <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
            </View>

            {invoice.items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colItem}>
                  <Text style={styles.itemText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.nameHindi ? (
                    <Text style={styles.itemHindiText} numberOfLines={1}>
                      {item.nameHindi}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.colQty}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={styles.colRate}>₹{item.unitPrice}</Text>
                <Text style={styles.colTotal}>₹{item.totalAmount}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.divider}>--------------------------------</Text>

          {/* Subtotal & Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalLine}>
              <Text style={styles.receiptText}>Subtotal:</Text>
              <Text style={styles.receiptText}>₹{invoice.subtotal}</Text>
            </View>

            {invoice.discountTotal > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.receiptText}>Discount:</Text>
                <Text style={styles.receiptText}>-₹{invoice.discountTotal}</Text>
              </View>
            )}

            {invoice.taxTotal > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.receiptText}>GST Total:</Text>
                <Text style={styles.receiptText}>₹{invoice.taxTotal}</Text>
              </View>
            )}

            <View style={[styles.totalLine, styles.grandTotalLine]}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
              <Text style={styles.grandTotalVal}>₹{invoice.grandTotal}</Text>
            </View>

            <View style={styles.paymentBadgeRow}>
              <Text style={styles.paymentBadge}>
                {invoice.paymentMode.toUpperCase()} ({invoice.paymentStatus.toUpperCase()})
              </Text>
              {invoice.changeDue && invoice.changeDue > 0 ? (
                <Text style={styles.changeBadge}>Return: ₹{invoice.changeDue}</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.divider}>--------------------------------</Text>
          <Text style={styles.footerGreeting}>धन्यवाद! फिर पधारें 🙏</Text>
          <Text style={styles.footerBrand}>Powered by Kirana Pro</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.whatsAppBtn}
            activeOpacity={0.88}
            onPress={handleShareWhatsApp}
          >
            <Text style={styles.btnIcon}>💬</Text>
            <Text style={styles.whatsAppBtnText}>Share Bill on WhatsApp</Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.printBtn}
              activeOpacity={0.85}
              onPress={handlePrint}
            >
              <Text style={styles.btnIcon}>🖨️</Text>
              <Text style={styles.printBtnText}>Thermal Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newBillBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BillingScreen')}
            >
              <Text style={styles.btnIcon}>⚡</Text>
              <Text style={styles.newBillBtnText}>New Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successIcon: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  paperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  receiptTop: {
    alignItems: 'center',
    marginBottom: 6,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    color: '#CBD5E1',
    letterSpacing: -1,
    marginVertical: 4,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  customerLine: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemsTable: {
    marginVertical: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8FAFC',
  },
  colItem: {
    flex: 3,
  },
  colQty: {
    flex: 1.5,
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
  },
  colRate: {
    flex: 1.5,
    fontSize: 11,
    color: '#334155',
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  itemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemHindiText: {
    fontSize: 10,
    color: '#64748B',
  },
  totalsSection: {
    marginVertical: 4,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  receiptText: {
    fontSize: 12,
    color: '#475569',
  },
  grandTotalLine: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  paymentBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  footerGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  footerBrand: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  printBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  newBillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  newBillBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnIcon: {
    fontSize: 16,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
