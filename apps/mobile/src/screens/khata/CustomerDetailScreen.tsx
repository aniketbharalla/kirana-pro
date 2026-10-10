import React, { useState } from 'react';
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
import { CustomerKhata, formatWhatsAppUdharReminder } from '@kirana-pro/shared';
import { useStoreStore } from '../../store/storeStore';
import { useKhataStore } from '../../store/khataStore';
import { RecordPaymentModal } from '../../components/khata/RecordPaymentModal';
import { colors } from '../../theme';

export const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { store } = useStoreStore();
  const { customers, setCustomers } = useKhataStore();

  const initialCustomer: CustomerKhata = route.params?.customer;
  const [customer, setCustomer] = useState<CustomerKhata>(initialCustomer);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const storeName = store?.name || 'Kirana Pro Dukaan';
  const upiId = '9876543210@paytm'; // Default / store UPI
  const storePhone = '9876543210';

  if (!customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendReminder = async () => {
    if (customer.currentBalance <= 0) {
      Alert.alert('No Due Balance', `${customer.name} has no outstanding balance.`);
      return;
    }

    const text = formatWhatsAppUdharReminder(
      customer.name,
      customer.currentBalance,
      storeName,
      upiId
    );

    const phone = customer.phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Could not open WhatsApp directly. Reminder text generated successfully.');
    }
  };

  const handlePaymentSuccess = (newBalance: number) => {
    const updated = { ...customer, currentBalance: newBalance };
    setCustomer(updated);
    setCustomers(customers.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Customer Header Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <View style={styles.contactRow}>
            <Feather name="phone" size={13} color={colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={styles.customerPhone}>+91 {customer.phoneNumber}</Text>
          </View>
          {customer.address ? (
            <View style={[styles.contactRow, { marginTop: 2 }]}>
              <Feather name="map-pin" size={13} color={colors.textSecondary} style={{ marginRight: 5 }} />
              <Text style={styles.customerAddress}>{customer.address}</Text>
            </View>
          ) : null}

          {/* Balance Banner */}
          <View
            style={[
              styles.balanceBanner,
              customer.currentBalance > 0 ? styles.balanceBannerDue : styles.balanceBannerClear,
            ]}
          >
            <Text
              style={[
                styles.balanceLabel,
                customer.currentBalance > 0 ? styles.balanceLabelDue : styles.balanceLabelClear,
              ]}
            >
              {customer.currentBalance > 0 ? 'PENDING UDHAR (DUE)' : 'KHATA STATUS'}
            </Text>
            <Text
              style={[
                styles.balanceValue,
                customer.currentBalance > 0 ? styles.balanceValueDue : styles.balanceValueClear,
              ]}
            >
              {customer.currentBalance > 0 ? `₹${customer.currentBalance}` : 'All Clear (₹0)'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.payBtn}
            activeOpacity={0.88}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Feather name="credit-card" size={16} color="#FFFFFF" />
            <Text style={styles.payBtnText}>Record Payment Received (Jama)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppReminderBtn}
            activeOpacity={0.88}
            onPress={handleSendReminder}
          >
            <Feather name="share-2" size={16} color="#FFFFFF" />
            <Text style={styles.whatsAppReminderText}>Send WhatsApp Due Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Ledger Transactions Statement */}
        <View style={styles.ledgerSection}>
          <Text style={styles.sectionHeader}>LEDGER STATEMENT</Text>

          <View style={styles.statementCard}>
            <View style={styles.txRow}>
              <View style={styles.txLeft}>
                <Text style={styles.txTitle}>Opening Balance</Text>
                <Text style={styles.txDate}>Joined Khata</Text>
              </View>
              <Text style={styles.txNeutral}>₹0</Text>
            </View>

            {customer.currentBalance > 0 && (
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txTitle}>Udhar Purchases (Debit)</Text>
                  <Text style={styles.txDate}>Store bills on credit</Text>
                </View>
                <Text style={styles.txDebit}>+₹${customer.currentBalance}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <RecordPaymentModal
        visible={paymentModalVisible}
        customer={customer}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
      />
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  customerAddress: {
    fontSize: 12,
    color: colors.textMuted,
  },
  balanceBanner: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  balanceBannerDue: {
    backgroundColor: 'rgba(234, 84, 85, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 84, 85, 0.25)',
  },
  balanceBannerClear: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceLabelDue: {
    color: colors.danger,
  },
  balanceLabelClear: {
    color: colors.primary,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceValueDue: {
    color: colors.danger,
  },
  balanceValueClear: {
    color: colors.primary,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary, // MasterX Royal Purple
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  whatsAppReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  whatsAppReminderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ledgerSection: {
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  txLeft: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  txDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txNeutral: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  txDebit: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
