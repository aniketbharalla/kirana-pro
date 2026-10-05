import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { fetchProductByBarcode, ScannedProductMetadata } from '../../services/openFoodFacts';
import { recordStockMovement } from '../../services/stock';
import { addProduct } from '../../services/product';
import { Product } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { findByBarcode } = useProductStore();

  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modal 1: Existing Product found -> Quick Stock Increment
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [stockIncrement, setStockIncrement] = useState<number>(5);
  const [updatingStock, setUpdatingStock] = useState(false);

  // Modal 2: New Product found from Open Food Facts -> 1-Tap Quick Add
  const [openFoodProduct, setOpenFoodProduct] = useState<ScannedProductMetadata | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newInitialStock, setNewInitialStock] = useState('10');
  const [addingNewProduct, setAddingNewProduct] = useState(false);

  // Handler for barcode scanned or entered
  const handleProcessBarcode = async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    // 1. Check if product already exists in current Dukaan catalog
    const existing = findByBarcode(clean);
    if (existing) {
      setExistingProduct(existing);
      setStockIncrement(5);
      return;
    }

    // 2. Not in store -> Query Open Food Facts free database
    setIsSearching(true);
    try {
      const offMetadata = await fetchProductByBarcode(clean);
      if (offMetadata) {
        setOpenFoodProduct(offMetadata);
        setNewSellingPrice('20');
        setNewInitialStock('10');
      } else {
        // Not in Open Food Facts -> Navigate to Add Product form with barcode
        Alert.alert(
          'New Barcode Detected',
          `Barcode ${clean} is not in your store or Open Food Facts. Would you like to enter details manually?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Item',
              onPress: () => navigation.navigate('AddProduct', { barcode: clean }),
            },
          ]
        );
      }
    } catch (err) {
      console.warn('Scan lookup error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Action: Increment Stock on Existing Item
  const handleConfirmStockUpdate = async () => {
    if (!existingProduct || !user?.storeId) return;
    setUpdatingStock(true);

    try {
      await recordStockMovement(user.storeId, existingProduct.id, {
        type: 'in',
        quantity: stockIncrement,
        reason: 'purchase',
        note: `Barcode restock: +${stockIncrement} ${existingProduct.unit}`,
        performedBy: user.uid,
      });

      Alert.alert(
        'Stock Updated! ✓',
        `Added +${stockIncrement} ${existingProduct.unit} to ${existingProduct.name}. New Stock: ${
          existingProduct.currentStock + stockIncrement
        } ${existingProduct.unit}.`
      );

      setExistingProduct(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update stock');
    } finally {
      setUpdatingStock(false);
    }
  };

  // Action: Add Item pre-filled from Open Food Facts
  const handleConfirmAddOpenFoodProduct = async () => {
    if (!openFoodProduct || !user?.storeId) return;

    const sPrice = parseFloat(newSellingPrice);
    if (isNaN(sPrice) || sPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price');
      return;
    }

    const initStock = parseFloat(newInitialStock) || 0;
    setAddingNewProduct(true);

    try {
      await addProduct(
        user.storeId,
        {
          name: openFoodProduct.name,
          category: 'snacks-namkeen',
          barcode: openFoodProduct.barcode,
          purchasePrice: Math.round(sPrice * 0.8),
          sellingPrice: sPrice,
          gstRate: 0,
          unit: 'packet',
          isLoose: false,
          pricePerUnit: sPrice,
          currentStock: initStock,
          minStockAlert: 5,
          imageURL: openFoodProduct.imageUrl || null,
          isActive: true,
        },
        user.uid
      );

      Alert.alert(
        'Product Added! 🎉',
        `"${openFoodProduct.name}" added to catalog with ${initStock} in stock!`
      );

      setOpenFoodProduct(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add product');
    } finally {
      setAddingNewProduct(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Scanner Viewport Simulation / UI */}
        <View style={styles.viewfinderCard}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          <View style={styles.reticle}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.reticleText}>Align barcode inside frame</Text>
            {isSearching && (
              <View style={styles.searchingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.searchingText}>
                  Querying Open Food Facts...
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Manual Code Input & Quick Demos */}
        <View style={styles.bottomControls}>
          <Text style={styles.controlHeader}>Manual Barcode Entry</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.barcodeInput}
              placeholder="e.g. 8901030000001"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <TouchableOpacity
              style={styles.processBtn}
              onPress={() => handleProcessBarcode(manualCode)}
              disabled={isSearching}
            >
              <Text style={styles.processBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Barcode Demo Buttons */}
          <Text style={styles.demoHeading}>💡 Sample Barcodes to Test:</Text>
          <View style={styles.demoChipsRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901030000001');
                handleProcessBarcode('8901030000001');
              }}
            >
              <Text style={styles.demoChipText}>🍜 Maggi (8901030000001)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901491101837');
                handleProcessBarcode('8901491101837');
              }}
            >
              <Text style={styles.demoChipText}>🥔 Lay's Chips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901719101037');
                handleProcessBarcode('8901719101037');
              }}
            >
              <Text style={styles.demoChipText}>🍪 Parle-G</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MODAL 1: Existing Product Scanned -> Quick Stock Increment */}
        <Modal visible={!!existingProduct} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalBadge}>
                <Text style={styles.modalBadgeText}>✓ PRODUCT FOUND IN DUKAAN</Text>
              </View>
              <Text style={styles.modalTitle}>{existingProduct?.name}</Text>
              <Text style={styles.modalSub}>
                Current Stock: {existingProduct?.currentStock} {existingProduct?.unit} • Price: ₹{existingProduct?.sellingPrice}
              </Text>

              <Text style={styles.stepperLabel}>Add Inward Stock Quantity:</Text>
              <View style={styles.stepperRow}>
                {[1, 5, 10, 25, 50].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.stepperChip,
                      stockIncrement === num && styles.stepperChipActive,
                    ]}
                    onPress={() => setStockIncrement(num)}
                  >
                    <Text
                      style={[
                        styles.stepperText,
                        stockIncrement === num && styles.stepperTextActive,
                      ]}
                    >
                      +{num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setExistingProduct(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirmStockUpdate}
                  disabled={updatingStock}
                >
                  {updatingStock ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      Update Stock (+{stockIncrement})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: New Item Found via Open Food Facts */}
        <Modal visible={!!openFoodProduct} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.modalBadgeText, { color: '#065F46' }]}>
                  🌐 FOUND IN OPEN FOOD FACTS
                </Text>
              </View>

              <View style={styles.offRow}>
                {openFoodProduct?.imageUrl ? (
                  <Image
                    source={{ uri: openFoodProduct.imageUrl }}
                    style={styles.offImage}
                  />
                ) : (
                  <View style={styles.offPlaceholder}>
                    <Text style={{ fontSize: 24 }}>📦</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{openFoodProduct?.name}</Text>
                  {openFoodProduct?.brand && (
                    <Text style={styles.offBrand}>Brand: {openFoodProduct.brand}</Text>
                  )}
                  <Text style={styles.offBarcode}>Barcode: {openFoodProduct?.barcode}</Text>
                </View>
              </View>

              {/* Price & Stock Inputs */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputMiniLabel}>SELLING PRICE (₹)</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="20"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newSellingPrice}
                    onChangeText={setNewSellingPrice}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputMiniLabel}>INITIAL STOCK</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newInitialStock}
                    onChangeText={setNewInitialStock}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setOpenFoodProduct(null)}
                >
                  <Text style={styles.cancelBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: '#059669' }]}
                  onPress={handleConfirmAddOpenFoodProduct}
                  disabled={addingNewProduct}
                >
                  {addingNewProduct ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>+ Add to Dukaan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  viewfinderCard: {
    flex: 1,
    margin: 20,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 36,
    height: 36,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 36,
    height: 36,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10B981',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 36,
    height: 36,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 36,
    height: 36,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10B981',
  },
  reticle: {
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  reticleText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  searchingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomControls: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  controlHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  processBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  demoHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  stepperChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  stepperText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  stepperTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  offRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  offImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  offPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offBrand: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  offBarcode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  miniInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
});
