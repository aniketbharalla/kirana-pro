import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { InvoiceItem } from '@kirana-pro/shared';

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
        <Text style={styles.emptyIcon}>🛒</Text>
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
                  <Text style={styles.looseBadgeText}>⚖️ Loose</Text>
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
                <Text style={styles.stepperMinus}>−</Text>
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
                <Text style={styles.stepperPlus}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.itemTotal}>₹{item.totalAmount}</Text>
              <TouchableOpacity
                onPress={() => onRemove(item.productId)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>🗑️</Text>
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
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
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
    color: '#0F172A',
    flexShrink: 1,
  },
  looseBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  looseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  itemHindi: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemRate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  actionColumn: {
    alignItems: 'flex-end',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperMinus: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  stepperPlus: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  unitSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteBtn: {
    padding: 2,
  },
  deleteText: {
    fontSize: 13,
  },
});
