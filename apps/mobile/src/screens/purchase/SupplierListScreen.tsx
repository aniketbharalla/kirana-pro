import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
      activeOpacity={0.85}
      onPress={() => navigation.navigate('SupplierDetail', { supplierId: item.id, supplier: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameBlock}>
          <Text style={styles.supplierName}>{item.name}</Text>
          <View style={styles.phoneRow}>
            <Feather name="phone" size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>
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
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ScanInvoice', { supplier: item })}
        >
          <Feather name="camera" size={13} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.newBillBtnText}>Inward Bill</Text>
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
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddSupplier')}
        >
          <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addSupplierBtnText}>Add Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wholesaler name or phone..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Suppliers List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplierItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="truck" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Wholesalers Found</Text>
            <Text style={styles.emptySubtitle}>
              Add distributors (like Parle, Britannia, ITC) or scan a bill to auto-create them.
            </Text>
            <TouchableOpacity
              style={styles.scanBillHeroBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('ScanInvoice')}
            >
              <Feather name="camera" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.scanBillHeroBtnText}>Scan First Distributor Bill</Text>
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
    backgroundColor: '#2F2B3D',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bannerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bannerAmount: {
    color: colors.systemOrange,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  addSupplierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addSupplierBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameBlock: {
    flex: 1,
    marginRight: 12,
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceDue: {
    color: colors.danger,
  },
  balanceClean: {
    color: colors.systemGreen,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  newBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  newBillBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
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
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  scanBillHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBillHeroBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
