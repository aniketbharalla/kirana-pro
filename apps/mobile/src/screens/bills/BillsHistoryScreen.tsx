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
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { fetchInvoices, subscribeToInvoices } from '../../services/invoice';
import { Invoice } from '@kirana-pro/shared';
import { colors } from '../../theme';

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
        <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice number, customer, or mode..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Invoices List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="file-text" size={32} color={colors.primary} />
          </View>
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.viewLink}>View Bill</Text>
                  <Feather name="chevron-right" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
                </View>
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
    backgroundColor: colors.background,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
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
    fontWeight: '700',
    color: colors.text,
  },
  invDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  invAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeBadgeCash: {
    backgroundColor: 'rgba(40, 199, 111, 0.12)',
  },
  modeTextCash: {
    color: colors.systemGreen,
  },
  modeBadgeUpi: {
    backgroundColor: 'rgba(0, 207, 232, 0.12)',
  },
  modeTextUpi: {
    color: '#0097A7',
  },
  modeBadgeCredit: {
    backgroundColor: 'rgba(234, 84, 85, 0.12)',
  },
  modeTextCredit: {
    color: colors.danger,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemsSummary: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
