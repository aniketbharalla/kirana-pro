import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { InvoiceItem } from '@kirana-pro/shared';
import { colors } from '../../theme';

export interface CartItemListProps {
  items: InvoiceItem[];
  onIncrement: (productId: string, currentQty: number) => void;
  onDecrement: (productId: string, currentQty: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Feather name="shopping-bag" size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Scan a barcode, select from quick items below, or use the Taraju calculator!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item, idx) => (
        <View key={`${item.productId}_${idx}`} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isLoose && (
                <View style={styles.looseBadge}>
                  <MaterialCommunityIcons name="scale-balance" size={10} color={colors.primary} style={{ marginRight: 2 }} />
                  <Text style={styles.looseBadgeText}>Loose</Text>
                </View>
              )}
            </View>

            {item.nameHindi ? (
              <Text style={styles.itemHindi} numberOfLines={1}>
                {item.nameHindi}
              </Text>
            ) : null}

            <Text style={styles.itemRate}>
              ₹{item.unitPrice}/{item.unit}
              {item.gstRate > 0 ? ` • GST ${item.gstRate}%` : ''}
            </Text>
          </View>

          {/* Stepper Controls */}
          <View style={styles.actionColumn}>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onDecrement(item.productId, item.quantity)}
                activeOpacity={0.7}
              >
                <Feather name="minus" size={14} color={colors.danger} />
              </TouchableOpacity>

              <Text style={styles.qtyText}>
                {item.quantity}
                <Text style={styles.unitSuffix}> {item.unit}</Text>
              </Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onIncrement(item.productId, item.quantity)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.itemTotal}>₹{item.totalAmount}</Text>
              <TouchableOpacity
                onPress={() => onRemove(item.productId)}
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
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
  itemRow: {
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
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  looseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  looseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  itemHindi: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemRate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  actionColumn: {
    alignItems: 'flex-end',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F2F7',
    borderRadius: 8,
    padding: 3,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 8,
  },
  unitSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  deleteBtn: {
    padding: 3,
  },
});
