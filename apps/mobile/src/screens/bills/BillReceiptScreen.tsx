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
import { Feather } from '@expo/vector-icons';
import { Invoice, formatWhatsAppReceipt } from '@kirana-pro/shared';
import { useStoreStore } from '../../store/storeStore';
import { useHardwareStore } from '../../store/hardwareStore';
import { printInvoiceReceipt } from '../../services/printerService';
import { colors } from '../../theme';

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
        gstin: store?.gstNumber || undefined,
      },
      settings
    );
    Alert.alert(
      result.success ? 'Receipt Printed' : 'Print Notice',
      result.message
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success Banner */}
        <View style={styles.successBadge}>
          <Feather name="check-circle" size={16} color={colors.systemGreen} />
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
          <Text style={styles.footerGreeting}>Thank you for visiting!</Text>
          <Text style={styles.footerBrand}>Powered by Kirana Pro</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.whatsAppBtn}
            activeOpacity={0.88}
            onPress={handleShareWhatsApp}
          >
            <Feather name="share-2" size={16} color="#FFFFFF" />
            <Text style={styles.whatsAppBtnText}>Share Bill on WhatsApp</Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.printBtn}
              activeOpacity={0.85}
              onPress={handlePrint}
            >
              <Feather name="printer" size={16} color={colors.text} />
              <Text style={styles.printBtnText}>Thermal Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newBillBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BillingScreen')}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
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
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 199, 111, 0.12)',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(40, 199, 111, 0.25)',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.systemGreen,
  },
  paperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  receiptTop: {
    alignItems: 'center',
    marginBottom: 6,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  receiptSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    color: colors.border,
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
    color: colors.text,
  },
  customerLine: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemsTable: {
    marginVertical: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.background,
  },
  colItem: {
    flex: 3,
  },
  colQty: {
    flex: 1.5,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  colRate: {
    flex: 1.5,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  itemText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  itemHindiText: {
    fontSize: 10,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  grandTotalLine: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  grandTotalVal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.systemGreen,
    backgroundColor: 'rgba(40, 199, 111, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.systemOrange,
    backgroundColor: 'rgba(255, 159, 67, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  footerGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  footerBrand: {
    fontSize: 10,
    color: colors.textMuted,
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
    borderRadius: 12,
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
    fontWeight: '700',
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
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  printBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  newBillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary, // MasterX Royal Purple
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  newBillBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
