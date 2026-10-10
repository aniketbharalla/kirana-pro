import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Product } from '@kirana-pro/shared';
import { colors } from '../../theme';

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
      <View style={styles.headingRow}>
        <Feather name="zap" size={13} color={colors.primary} />
        <Text style={styles.heading}>Quick Add Items</Text>
      </View>
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
              <View style={styles.iconCircle}>
                <Feather
                  name={prod.isLoose ? 'compass' : 'package'}
                  size={14}
                  color={colors.primary}
                />
              </View>
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
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
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: 6,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  hindi: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
