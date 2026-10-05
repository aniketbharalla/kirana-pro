import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Product } from '@kirana-pro/shared';

export interface QuickItemPickerProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const QuickItemPicker: React.FC<QuickItemPickerProps> = ({
  products,
  onSelectProduct,
}) => {
  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>⚡ Quick Add Items</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {products.slice(0, 10).map((prod) => (
          <TouchableOpacity
            key={prod.id}
            style={styles.itemTile}
            activeOpacity={0.8}
            onPress={() => onSelectProduct(prod)}
          >
            <View style={styles.topRow}>
              <Text style={styles.icon}>{prod.isLoose ? '🌾' : '📦'}</Text>
              <Text style={styles.price}>₹{prod.sellingPrice}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {prod.name}
            </Text>
            {prod.nameHindi ? (
              <Text style={styles.hindi} numberOfLines={1}>
                {prod.nameHindi}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  itemTile: {
    width: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 18,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  hindi: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
});
