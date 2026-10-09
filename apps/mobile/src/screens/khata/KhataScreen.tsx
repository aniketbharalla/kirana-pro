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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useKhataStore } from '../../store/khataStore';
import { useAuthStore } from '../../store/authStore';
import { fetchCustomers, subscribeToCustomers } from '../../services/khata';
import { AddCustomerModal } from '../../components/khata/AddCustomerModal';
import { CustomerKhata } from '@kirana-pro/shared';

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
  const [loading, setLoading] = useState(false);

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
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* Header Summary Card (Apple Wallet / Credit aesthetic) */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>TOTAL MARKET UDHAR</Text>
          <Text style={styles.summaryAmount}>₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{customers.length} Customers</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer name, phone, area..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Customer Directory */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📒</Text>
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
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CustomerDetail', { customer: item })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>📞 +91 {item.phoneNumber}</Text>
                {item.address ? (
                  <Text style={styles.address} numberOfLines={1}>
                    📍 {item.address}
                  </Text>
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
                <Text style={styles.arrowIcon}>›</Text>
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
        <Text style={styles.fabIcon}>+</Text>
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
    backgroundColor: '#F2F2F7',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF453A',
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(60, 60, 67, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  clearText: {
    fontSize: 14,
    color: '#8E8E93',
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(60, 60, 67, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  phone: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  balanceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  balanceBadgeDue: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  balanceBadgeClear: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceTextDue: {
    color: '#FF3B30',
  },
  balanceTextClear: {
    color: '#059669',
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C7C7CC',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1D1F',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
