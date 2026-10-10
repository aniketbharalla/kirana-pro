import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useKhataStore } from '../../store/khataStore';
import { useAuthStore } from '../../store/authStore';
import { fetchCustomers, subscribeToCustomers } from '../../services/khata';
import { AddCustomerModal } from '../../components/khata/AddCustomerModal';
import { CustomerKhata } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const KhataScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    customers,
    searchQuery,
    setCustomers,
    setSearchQuery,
    getTotalPendingCredit,
    getFilteredCustomers,
  } = useKhataStore();

  const [addModalVisible, setAddModalVisible] = useState(false);

  const storeId = user?.storeId || 'demo_store_1';

  useEffect(() => {
    fetchCustomers(storeId).then((list) => {
      if (list.length > 0) setCustomers(list);
    });

    const unsubscribe = subscribeToCustomers(storeId, (list) => {
      if (list.length > 0) setCustomers(list);
    });

    return () => unsubscribe();
  }, [storeId]);

  const filtered = getFilteredCustomers();
  const totalPending = getTotalPendingCredit();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header Summary Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>TOTAL MARKET UDHAR</Text>
          <Text style={styles.summaryAmount}>
            ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{customers.length} Customers</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer name, phone, area..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Customer Directory */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="book-open" size={32} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Customers Found</Text>
          <Text style={styles.emptySubtitle}>
            Add regular customers to your Khata ledger to manage udhar & receipts.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.customerCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CustomerDetail', { customer: item })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Feather name="phone" size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.phone}>+91 {item.phoneNumber}</Text>
                </View>
                {item.address ? (
                  <View style={[styles.metaRow, { marginTop: 2 }]}>
                    <Feather name="map-pin" size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.address} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.balanceCol}>
                <View
                  style={[
                    styles.balanceBadge,
                    item.currentBalance > 0
                      ? styles.balanceBadgeDue
                      : styles.balanceBadgeClear,
                  ]}
                >
                  <Text
                    style={[
                      styles.balanceBadgeText,
                      item.currentBalance > 0
                        ? styles.balanceTextDue
                        : styles.balanceTextClear,
                    ]}
                  >
                    {item.currentBalance > 0
                      ? `₹${item.currentBalance.toLocaleString('en-IN')} Due`
                      : 'All Clear'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Customer FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.88}
        onPress={() => setAddModalVisible(true)}
      >
        <Feather name="plus" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.fabText}>Add Customer</Text>
      </TouchableOpacity>

      <AddCustomerModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
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
    backgroundColor: '#2F2B3D',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.systemOrange,
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  phone: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  address: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  balanceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  balanceBadgeDue: {
    backgroundColor: 'rgba(234, 84, 85, 0.12)',
  },
  balanceBadgeClear: {
    backgroundColor: 'rgba(40, 199, 111, 0.12)',
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  balanceTextDue: {
    color: colors.danger,
  },
  balanceTextClear: {
    color: colors.systemGreen,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary, // MasterX Royal Purple
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
