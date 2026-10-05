import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSupplierStore } from '../../store/supplierStore';
import { useAuthStore } from '../../store/authStore';
import { getSuppliers } from '../../services/supplier';
import { colors } from '../../theme';
import { Supplier } from '@kirana-pro/shared';

export const SupplierListScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { suppliers, searchQuery, setSearchQuery, getFilteredSuppliers, getTotalPayable } =
    useSupplierStore();

  const storeId = user?.storeId || 'dev_store_001';

  useEffect(() => {
    getSuppliers(storeId);
  }, [storeId]);

  const filtered = getFilteredSuppliers();
  const totalPayable = getTotalPayable();

  const renderSupplierItem = ({ item }: { item: Supplier }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CreatePurchase', { supplier: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameBlock}>
          <Text style={styles.supplierName}>{item.name}</Text>
          <Text style={styles.phoneText}>📞 {item.phone}</Text>
          {item.gstin ? (
            <Text style={styles.gstinText}>GST: {item.gstin}</Text>
          ) : null}
        </View>
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Due to Supplier</Text>
          <Text
            style={[
              styles.balanceValue,
              item.balance > 0 ? styles.balanceDue : styles.balanceClean,
            ]}
          >
            ₹{item.balance.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
        <TouchableOpacity
          style={styles.newBillBtn}
          onPress={() => navigation.navigate('ScanInvoice', { supplier: item })}
        >
          <Text style={styles.newBillBtnText}>📷 Inward Bill</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Banner: Total Supplier Credit Payable */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerLabel}>Total Payable to Wholesalers</Text>
          <Text style={styles.bannerAmount}>₹{totalPayable.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addSupplierBtn}
          onPress={() => navigation.navigate('AddSupplier')}
        >
          <Text style={styles.addSupplierBtnText}>+ Add Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search wholesaler name or phone..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Suppliers List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplierItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚚</Text>
            <Text style={styles.emptyTitle}>No Wholesalers Found</Text>
            <Text style={styles.emptySubtitle}>
              Add distributors (like Parle, Britannia, ITC) or scan a bill to auto-create them.
            </Text>
            <TouchableOpacity
              style={styles.scanBillHeroBtn}
              onPress={() => navigation.navigate('ScanInvoice')}
            >
              <Text style={styles.scanBillHeroBtnText}>📷 Scan First Distributor Bill</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    backgroundColor: '#0F172A',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bannerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bannerAmount: {
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  addSupplierBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addSupplierBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameBlock: {
    flex: 1,
    marginRight: 12,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  phoneText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gstinText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  balanceBlock: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceDue: {
    color: colors.danger,
  },
  balanceClean: {
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  newBillBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  newBillBtnText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  scanBillHeroBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  scanBillHeroBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
