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
import { CustomerKhata } from '@kirana-pro/shared';
import { RecordPaymentModal } from '../../components/khata/RecordPaymentModal';
import { useStoreStore } from '../../store/storeStore';
import { useKhataStore } from '../../store/khataStore';

export const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { store } = useStoreStore();
  const { customers, setCustomers } = useKhataStore();

  const initialCustomer: CustomerKhata = route.params?.customer;
  const [customer, setCustomer] = useState<CustomerKhata>(initialCustomer);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  if (!customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const storeName = store?.name || 'Kirana Pro Dukaan';

  const handleSendReminder = async () => {
    if (customer.currentBalance <= 0) {
      Alert.alert('No Due Balance', 'This customer currently has zero pending balance.');
      return;
    }

    const reminderText = `नमस्ते ${customer.name} जी,\n\nआपके ${storeName} पर कुल *₹${customer.currentBalance}* का बकाया (उधार) शेष है।\n\nकृपया सुविधा अनुसार समय पर भुगतान करने का कष्ट करें।\n\nधन्यवाद 🙏\n*${storeName}*`;
    const cleanPhone = customer.phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reminderText)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(reminderText)}`);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Could not launch WhatsApp directly.');
    }
  };

  const handlePaymentSuccess = (newBalance: number) => {
    const updated = { ...customer, currentBalance: newBalance };
    setCustomer(updated);
    setCustomers(customers.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Customer Header Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>📞 +91 {customer.phoneNumber}</Text>
          {customer.address && <Text style={styles.customerAddress}>📍 {customer.address}</Text>}

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
              {customer.currentBalance > 0 ? 'PENDING UDHAR (बकाया)' : 'KHATA STATUS'}
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
            <Text style={styles.btnIcon}>💵</Text>
            <Text style={styles.payBtnText}>Record Payment Received (जमा)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppReminderBtn}
            activeOpacity={0.88}
            onPress={handleSendReminder}
          >
            <Text style={styles.btnIcon}>💬</Text>
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
                <Text style={styles.txDebit}>+₹{customer.currentBalance}</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#065F46',
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  customerAddress: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  balanceBanner: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  balanceBannerDue: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  balanceBannerClear: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceLabelDue: {
    color: '#DC2626',
  },
  balanceLabelClear: {
    color: '#065F46',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  balanceValueDue: {
    color: '#DC2626',
  },
  balanceValueClear: {
    color: '#059669',
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  whatsAppReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 14,
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
  btnIcon: {
    fontSize: 16,
  },
  ledgerSection: {
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txLeft: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txNeutral: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  txDebit: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
  },
});
