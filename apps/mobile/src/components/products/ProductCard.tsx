import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { Product } from '@kirana-pro/shared';
import { colors } from '../../theme';

export interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onQuickStockIn?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onQuickStockIn,
}) => {
  const isOutOfStock = product.currentStock === 0;
  const isLowStock = !isOutOfStock && product.currentStock <= product.minStockAlert;

  let stockBadgeBg = '#ECFDF5';
  let stockBadgeText = '#065F46';
  let stockLabel = `${product.currentStock} ${product.unit}`;

  if (isOutOfStock) {
    stockBadgeBg = '#FEF2F2';
    stockBadgeText = '#DC2626';
    stockLabel = 'Out of Stock';
  } else if (isLowStock) {
    stockBadgeBg = '#FFFBEB';
    stockBadgeText = '#B45309';
    stockLabel = `${product.currentStock} ${product.unit} (Low)`;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Top badges */}
      <View style={styles.topRow}>
        <View style={[styles.stockBadge, { backgroundColor: stockBadgeBg }]}>
          <Text style={[styles.stockText, { color: stockBadgeText }]}>
            {stockLabel}
          </Text>
        </View>

        {product.isLoose && (
          <View style={styles.looseBadge}>
            <Text style={styles.looseText}>⚖️ Loose</Text>
          </View>
        )}
      </View>

      {/* Thumbnail or Fallback Icon */}
      <View style={styles.imageBox}>
        {product.imageURL ? (
          <Image
            source={{ uri: product.imageURL }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.fallbackEmoji}>
            {product.isLoose ? '🌾' : '📦'}
          </Text>
        )}
      </View>

      {/* Product Details */}
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      {product.nameHindi ? (
        <Text style={styles.hindiName} numberOfLines={1}>
          {product.nameHindi}
        </Text>
      ) : null}

      {/* Price & Action Row */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.priceText}>
            ₹{product.sellingPrice}
            <Text style={styles.unitText}>/{product.unit}</Text>
          </Text>
          {product.barcode ? (
            <Text style={styles.barcodeText} numberOfLines={1}>
              📷 {product.barcode.slice(-6)}
            </Text>
          ) : null}
        </View>

        {onQuickStockIn && (
          <TouchableOpacity
            style={styles.quickAddBtn}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              onQuickStockIn();
            }}
          >
            <Text style={styles.quickAddPlus}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  looseBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  looseText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  imageBox: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  fallbackEmoji: {
    fontSize: 38,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    minHeight: 36,
  },
  hindiName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  barcodeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAddPlus: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -1,
  },
});
