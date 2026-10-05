import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { fetchInvoices, subscribeToInvoices } from '../../services/invoice';
import { Invoice } from '@kirana-pro/shared';

export const BillsHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const storeId = user?.storeId || 'demo_store_1';

  useEffect(() => {
    fetchInvoices(storeId).then((res) => {
      setInvoices(res);
      setLoading(false);
    });

    const unsubscribe = subscribeToInvoices(storeId, (list) => {
      setInvoices(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer?.name.toLowerCase().includes(q) ||
      inv.paymentMode.toLowerCase().includes(q)
    );
  });

  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Banner */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>TOTAL REVENUE</Text>
          <Text style={styles.summaryAmount}>₹{totalSales.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryCount}>{invoices.length} Bills</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice number, customer, or mode..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Invoices List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>No Bills Recorded Yet</Text>
          <Text style={styles.emptySubtitle}>
            Completed sales and bills will automatically appear in this history log.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.invoiceCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BillReceipt', { invoice: item })}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.invNumber}>{item.invoiceNumber}</Text>
                  <Text style={styles.invDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.amountCol}>
                  <Text style={styles.invAmount}>₹{item.grandTotal}</Text>
                  <View
                    style={[
                      styles.modeBadge,
                      item.paymentMode === 'credit'
                        ? styles.modeBadgeCredit
                        : item.paymentMode === 'upi'
                        ? styles.modeBadgeUpi
                        : styles.modeBadgeCash,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBadgeText,
                        item.paymentMode === 'credit'
                          ? styles.modeTextCredit
                          : item.paymentMode === 'upi'
                          ? styles.modeTextUpi
                          : styles.modeTextCash,
                      ]}
                    >
                      {item.paymentMode.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.itemsSummary}>
                  {item.items.length} items •{' '}
                  {item.customer?.name ? `Customer: ${item.customer.name}` : 'Counter Sale'}
                </Text>
                <Text style={styles.viewLink}>View Bill ➔</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  clearText: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  invNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  invDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  invAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  modeBadgeCash: {
    backgroundColor: '#ECFDF5',
  },
  modeTextCash: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  modeBadgeUpi: {
    backgroundColor: '#EFF6FF',
  },
  modeTextUpi: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  modeBadgeCredit: {
    backgroundColor: '#FEF2F2',
  },
  modeTextCredit: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemsSummary: {
    fontSize: 12,
    color: '#64748B',
  },
  viewLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
