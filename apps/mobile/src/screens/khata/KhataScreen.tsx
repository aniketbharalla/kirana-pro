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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Summary */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>TOTAL MARKET UDHAR (कुल उधारी)</Text>
          <Text style={styles.summaryAmount}>₹{totalPending.toFixed(2)}</Text>
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
          placeholder="Search customer by name, phone, or area..."
          placeholderTextColor="#94A3B8"
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
              activeOpacity={0.85}
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
                      ? `₹${item.currentBalance} Due`
                      : 'All Clear'}
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
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
    padding: 18,
    borderRadius: 20,
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
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
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
    paddingBottom: 90,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  phone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  address: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  balanceBadgeDue: {
    backgroundColor: '#FEF2F2',
  },
  balanceBadgeClear: {
    backgroundColor: '#ECFDF5',
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  balanceTextDue: {
    color: '#DC2626',
  },
  balanceTextClear: {
    color: '#065F46',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#CBD5E1',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
