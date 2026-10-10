import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Product } from '@kirana-pro/shared';

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
  const currentStock = product?.currentStock ?? 0;
  const minStockAlert = product?.minStockAlert ?? 5;
  const isOutOfStock = currentStock === 0;
  const isLowStock = !isOutOfStock && currentStock <= minStockAlert;
  const unit = product?.unit || 'unit';

  let stockBadgeBg = '#E8FADF';
  let stockBadgeText = '#28C76F';
  let stockLabel = `${currentStock} ${unit}`;

  if (isOutOfStock) {
    stockBadgeBg = '#FCE4E4';
    stockBadgeText = '#EA5455';
    stockLabel = 'Out of Stock';
  } else if (isLowStock) {
    stockBadgeBg = '#FFF0E1';
    stockBadgeText = '#FF9F43';
    stockLabel = `${currentStock} ${unit} (Low)`;
  }

  const barcodeStr = product?.barcode ? String(product.barcode) : null;
  const displayBarcode = barcodeStr && barcodeStr.length > 6 ? barcodeStr.slice(-6) : barcodeStr;

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

        {product?.isLoose && (
          <View style={styles.looseBadge}>
            <Feather name="sliders" size={10} color="#7367F0" style={{ marginRight: 3 }} />
            <Text style={styles.looseText}>Loose</Text>
          </View>
        )}
      </View>

      {/* Thumbnail or Fallback Icon */}
      <View style={styles.imageBox}>
        {product?.imageURL ? (
          <Image
            source={{ uri: product.imageURL }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <Feather
            name={product?.isLoose ? 'sliders' : 'package'}
            size={32}
            color="#7367F0"
          />
        )}
      </View>

      {/* Product Details */}
      <Text style={styles.productName} numberOfLines={2}>
        {product?.name || 'Unnamed Product'}
      </Text>
      {product?.nameHindi ? (
        <Text style={styles.hindiName} numberOfLines={1}>
          {product.nameHindi}
        </Text>
      ) : null}

      {/* Price & Action Row */}
      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.priceLine}>
            <Text style={styles.priceText}>
              ₹{product?.sellingPrice ?? 0}
              <Text style={styles.unitText}>/{unit}</Text>
            </Text>
            {product?.purchasePrice != null && product.purchasePrice > 0 ? (
              <Text style={styles.costText}>
                Cost: ₹{product.purchasePrice}
              </Text>
            ) : null}
          </View>

          {product?.sellingPrice && product?.purchasePrice ? (
            <Text style={styles.profitText}>
              +₹{(product.sellingPrice - product.purchasePrice).toFixed(1)} profit (
              {Math.round(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100)}%)
            </Text>
          ) : null}

          {displayBarcode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Feather name="maximize" size={10} color="#82808B" style={{ marginRight: 3 }} />
              <Text style={styles.barcodeText} numberOfLines={1}>
                {displayBarcode}
              </Text>
            </View>
          ) : null}
        </View>

        {onQuickStockIn && (
          <TouchableOpacity
            style={styles.quickAddBtn}
            activeOpacity={0.8}
            onPress={(e) => {
              e?.stopPropagation?.();
              onQuickStockIn();
            }}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBDADE',
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
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
    borderRadius: 6,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  looseBadge: {
    backgroundColor: '#EDEBFD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  looseText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7367F0',
  },
  imageBox: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B465C',
    minHeight: 36,
  },
  hindiName: {
    fontSize: 12,
    color: '#82808B',
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  costText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#82808B',
    backgroundColor: '#F8F7FA',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  profitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#28C76F',
    marginTop: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B465C',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#82808B',
  },
  barcodeText: {
    fontSize: 10,
    color: '#82808B',
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#7367F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
});

