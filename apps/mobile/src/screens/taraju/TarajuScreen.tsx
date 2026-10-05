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
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Taraju Smart Scale ⚖️</Text>
          <Text style={styles.screenSubtitle}>
            Instant price-to-weight & weight-to-price calculator
          </Text>
        </View>

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
                <Text style={styles.pillEmoji}>🌾</Text>
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
            <Text style={styles.pillEmoji}>✏️</Text>
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
              placeholderTextColor="#94A3B8"
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
            placeholderTextColor="#94A3B8"
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
              'Added to Bill! 🛒',
              `${resultDisplay} of ${targetProduct.name} added to cart.`,
              [
                { text: 'Keep Weighing', style: 'cancel' },
                {
                  text: 'Go to Cart ➔',
                  onPress: () => (navigation as any)?.navigate?.('BillsTab'),
                },
              ]
            );
          }}
        >
          <Text style={styles.addBillText}>
            🛒 Add to Active Bill ({resultDisplay})
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
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  productPillSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  pillEmoji: {
    fontSize: 20,
  },
  productPillName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  productPillNameSelected: {
    color: '#065F46',
  },
  productPillRate: {
    fontSize: 11,
    color: '#64748B',
  },
  productPillRateSelected: {
    color: '#047857',
    fontWeight: '600',
  },
  customRateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  rateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  mainInput: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    paddingVertical: 4,
  },
  addBillBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 4,
  },
  addBillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  historySection: {
    marginTop: 24,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  historyProduct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyResult: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
});
