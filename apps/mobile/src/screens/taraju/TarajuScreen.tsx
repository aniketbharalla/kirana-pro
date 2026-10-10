import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useHardwareStore } from '../../store/hardwareStore';
import { calculateWeight, calculatePrice, Product } from '@kirana-pro/shared';
import { QuickAmountButtons } from '../../components/taraju/QuickAmountButtons';
import { CalculationResult } from '../../components/taraju/CalculationResult';
import { colors } from '../../theme';

export interface TarajuHistoryItem {
  id: string;
  productName: string;
  rate: number;
  input: string;
  result: string;
  mode: 'amount_to_weight' | 'weight_to_price';
}

export const TarajuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { getLooseProducts } = useProductStore();
  const looseProducts = getLooseProducts();
  const { isScaleConnected, scaleWeight, isScaleStable, isSimulatedScale } = useHardwareStore();

  const [mode, setMode] = useState<'amount_to_weight' | 'weight_to_price'>('amount_to_weight');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customRate, setCustomRate] = useState('50');
  const [inputValue, setInputValue] = useState('5');
  const [history, setHistory] = useState<TarajuHistoryItem[]>([]);

  // Default to first loose product if available
  useEffect(() => {
    if (looseProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(looseProducts[0]);
      setCustomRate(String(looseProducts[0].sellingPrice));
    }
  }, [looseProducts]);

  const activeRate = selectedProduct ? selectedProduct.sellingPrice : parseFloat(customRate) || 50;
  const numInput = parseFloat(inputValue) || 0;

  let resultDisplay = '0 g';
  if (mode === 'amount_to_weight') {
    const res = calculateWeight(activeRate, numInput);
    resultDisplay = res.display;
  } else {
    const res = calculatePrice(activeRate, numInput);
    resultDisplay = res.display;
  }

  // Update history item on meaningful calculation
  const handleAddToHistory = () => {
    if (numInput <= 0) return;
    const newItem: TarajuHistoryItem = {
      id: String(Date.now()),
      productName: selectedProduct ? selectedProduct.name : `Loose Item (₹${activeRate}/kg)`,
      rate: activeRate,
      input: inputValue,
      result: resultDisplay,
      mode,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 4)]);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCustomRate(String(product.sellingPrice));
  };

  const handleQuickAmount = (amount: number) => {
    setInputValue(String(amount));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="scale-balance" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.screenTitle}>Taraju Smart Scale</Text>
              <Text style={styles.screenSubtitle}>
                Instant price-to-weight & weight-to-price calculator
              </Text>
            </View>
          </View>
        </View>

        {/* Live Digital Scale Banner */}
        {(isScaleConnected || isSimulatedScale) && (
          <View style={styles.liveScaleBanner}>
            <View style={styles.liveScaleInfo}>
              <View style={styles.liveScaleStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: isScaleStable ? colors.systemGreen : colors.systemOrange }]} />
                <Text style={styles.liveScaleTitle}>DIGITAL SCALE (LIVE TARAJU)</Text>
                <View
                  style={[
                    styles.scalePill,
                    isScaleStable ? styles.scalePillStable : styles.scalePillUnstable,
                  ]}
                >
                  <Text style={styles.scalePillText}>
                    {isScaleStable ? 'STABLE' : 'UNSTABLE'}
                  </Text>
                </View>
              </View>
              <Text style={styles.liveScaleWeight}>
                {scaleWeight.toFixed(3)}{' '}
                <Text style={styles.liveScaleKg}>kg</Text>
                <Text style={styles.liveScaleGrams}>
                  {' '}({Math.round(scaleWeight * 1000)} g)
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.applyScaleBtn}
              activeOpacity={0.85}
              onPress={() => {
                const grams = Math.round(scaleWeight * 1000);
                setMode('weight_to_price');
                setInputValue(String(grams));
              }}
            >
              <Text style={styles.applyScaleBtnText}>Apply Weight</Text>
              <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Loose Items Horizontal Picker */}
        <Text style={styles.sectionHeader}>SELECT LOOSE ITEM</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productPickerRow}
        >
          {looseProducts.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.productPill, isSelected && styles.productPillSelected]}
                onPress={() => handleSelectProduct(p)}
                activeOpacity={0.8}
              >
                <Feather
                  name="package"
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <View>
                  <Text
                    style={[
                      styles.productPillName,
                      isSelected && styles.productPillNameSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.productPillRate,
                      isSelected && styles.productPillRateSelected,
                    ]}
                  >
                    ₹{p.sellingPrice}/kg
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.productPill, !selectedProduct && styles.productPillSelected]}
            onPress={() => setSelectedProduct(null)}
            activeOpacity={0.8}
          >
            <Feather
              name="edit-2"
              size={15}
              color={!selectedProduct ? colors.primary : colors.textSecondary}
            />
            <View>
              <Text
                style={[
                  styles.productPillName,
                  !selectedProduct && styles.productPillNameSelected,
                ]}
              >
                Custom Rate
              </Text>
              <Text
                style={[
                  styles.productPillRate,
                  !selectedProduct && styles.productPillRateSelected,
                ]}
              >
                ₹{customRate}/kg
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Custom Rate Input if no product selected */}
        {!selectedProduct && (
          <View style={styles.customRateCard}>
            <Text style={styles.fieldLabel}>ENTER RATE PER KG (₹)</Text>
            <TextInput
              style={styles.rateInput}
              value={customRate}
              onChangeText={setCustomRate}
              keyboardType="numeric"
              placeholder="e.g. 50"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        {/* Mode Toggle Switch */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'amount_to_weight' && styles.modeTabActive,
            ]}
            onPress={() => {
              setMode('amount_to_weight');
              setInputValue('5');
            }}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'amount_to_weight' && styles.modeTabTextActive,
              ]}
            >
              ₹ → Grams (Price to Wt)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'weight_to_price' && styles.modeTabActive,
            ]}
            onPress={() => {
              setMode('weight_to_price');
              setInputValue('250');
            }}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'weight_to_price' && styles.modeTabTextActive,
              ]}
            >
              Grams → ₹ (Scale to Price)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Box */}
        <View style={styles.inputCard}>
          <Text style={styles.fieldLabel}>
            {mode === 'amount_to_weight'
              ? 'CUSTOMER AMOUNT (₹)'
              : 'SCALE WEIGHT (GRAMS)'}
          </Text>
          <TextInput
            style={styles.mainInput}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        </View>

        {/* Quick Amount Buttons (only in amount_to_weight mode) */}
        {mode === 'amount_to_weight' && (
          <QuickAmountButtons
            onSelectAmount={handleQuickAmount}
            selectedAmount={parseFloat(inputValue)}
          />
        )}

        {/* Big Calculation Result Display */}
        <CalculationResult
          mode={mode}
          resultDisplay={resultDisplay}
          rate={activeRate}
          inputDisplay={inputValue}
        />

        {/* Action Buttons: Add to Bill & Save to Log */}
        <TouchableOpacity
          style={styles.addBillBtn}
          activeOpacity={0.88}
          onPress={() => {
            handleAddToHistory();

            // Calculate quantity in kg
            let qtyInKg = 0;
            if (mode === 'amount_to_weight') {
              const grams = Math.round((numInput / activeRate) * 1000);
              qtyInKg = grams / 1000;
            } else {
              qtyInKg = Math.round((numInput / 1000) * 1000) / 1000;
            }

            if (qtyInKg <= 0) {
              Alert.alert('Invalid Weight', 'Please enter a valid amount or weight.');
              return;
            }

            const targetProduct: Product = selectedProduct || {
              id: `loose_custom_${activeRate}`,
              storeId: 'demo_store_1',
              name: `Loose Kirana Item (₹${activeRate}/kg)`,
              category: 'other',
              barcode: null,
              purchasePrice: activeRate * 0.85,
              sellingPrice: activeRate,
              gstRate: 0,
              unit: 'kg',
              isLoose: true,
              pricePerUnit: activeRate,
              currentStock: 999,
              minStockAlert: 10,
              imageURL: null,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            useCartStore.getState().addItem(targetProduct, qtyInKg, activeRate);

            Alert.alert(
              'Added to Bill',
              `${resultDisplay} of ${targetProduct.name} added to cart.`,
              [
                { text: 'Keep Weighing', style: 'cancel' },
                {
                  text: 'Go to Cart',
                  onPress: () => (navigation as any)?.navigate?.('BillsTab'),
                },
              ]
            );
          }}
        >
          <Feather name="shopping-cart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addBillText}>
            Add to Active Bill ({resultDisplay})
          </Text>
        </TouchableOpacity>

        {/* Recent History Strip */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionHeader}>RECENT CALCULATIONS</Text>
            {history.map((h) => (
              <View key={h.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyProduct}>{h.productName}</Text>
                  <Text style={styles.historyDetails}>
                    {h.mode === 'amount_to_weight'
                      ? `₹${h.input} given @ ₹${h.rate}/kg`
                      : `${h.input}g weighed @ ₹${h.rate}/kg`}
                  </Text>
                </View>
                <Text style={styles.historyResult}>{h.result}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  productPickerRow: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 10,
  },
  productPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  productPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  productPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  productPillNameSelected: {
    color: colors.primary,
  },
  productPillRate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  productPillRateSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  customRateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  rateInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEEEF2',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  mainInput: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 4,
  },
  addBillBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary, // MasterX Royal Purple
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  addBillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  historySection: {
    marginTop: 24,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  historyProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  historyDetails: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyResult: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  liveScaleBanner: {
    backgroundColor: '#2F2B3D',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  liveScaleInfo: {
    flex: 1,
  },
  liveScaleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveScaleTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  scalePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scalePillStable: {
    backgroundColor: colors.systemGreen,
  },
  scalePillUnstable: {
    backgroundColor: colors.systemOrange,
  },
  scalePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  liveScaleWeight: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.systemBlue,
  },
  liveScaleKg: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  liveScaleGrams: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  applyScaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyScaleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
